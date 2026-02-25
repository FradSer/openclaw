# Agent Teams Best Practices

## Code Organization

### File Structure

Team-related code follows the established patterns:

```
src/
├── teams/                      # Core infrastructure
│   ├── manager.ts              # High-level orchestration
│   ├── ledger.ts               # SQLite operations
│   ├── types.ts                # Type definitions
│   ├── storage.ts              # Filesystem operations
│   ├── inbox.ts                # Message queues
│   ├── pool.ts                 # Connection caching
│   ├── limits.ts               # Resource limits
│   ├── cleanup.ts              # Maintenance
│   ├── context-injection.ts    # Message to XML
│   └── state-injection.ts      # Team state injection
│
└── agents/tools/teams/         # Tool implementations
    ├── team-create.ts
    ├── teammate-spawn.ts
    ├── team-shutdown.ts
    ├── task-create.ts
    ├── task-list.ts
    ├── task-claim.ts
    ├── task-complete.ts
    ├── task-find-available.ts
    ├── task-auto-claim.ts
    └── send-message.ts
```

### Naming Conventions

**Tool names use snake_case:**

```typescript
name: "team_create";
name: "task_claim";
name: "send_message";
```

**Parameters use snake_case:**

```typescript
team_name: string;
agent_type: string;
request_id: string;
```

**File names use kebab-case:**

```
team-create.ts
task-claim.ts
send-message.ts
```

## Type Definitions

Centralize types in `src/teams/types.ts`:

```typescript
export interface TeamConfig {
  id: string; // UUID
  name: string; // Path-safe identifier (1-50 chars)
  description?: string;
  agentType?: string;
  createdAt: number;
  updatedAt: number;
  status: "active" | "shutdown";
  leadSessionKey: string;
}

export interface Task {
  id: string; // UUID
  subject: string; // Max 200 chars
  description: string; // Max 10000 chars
  activeForm?: string; // Present continuous form
  status: "pending" | "claimed" | "in_progress" | "completed" | "failed";
  owner?: string; // Session key of claimer
  dependsOn?: string[]; // Task IDs this depends on
  blockedBy?: string[]; // Computed blocking tasks
  metadata?: Record<string, unknown>;
  createdAt: number;
  claimedAt?: number;
  completedAt?: number;
}

export interface TeamMessage {
  id: string; // UUID
  from: string; // Sender session key
  to?: string; // Recipient (empty for broadcast)
  type: "message" | "broadcast" | "shutdown_request" | "shutdown_response" | "idle";
  content: string; // Max 100KB
  summary?: string; // 5-10 words
  requestId?: string; // For shutdown protocol
  approve?: boolean; // For shutdown_response
  reason?: string; // Rejection reason
  timestamp: number;
}
```

## Security Guidelines

### 1. Team Name Validation

Validate team names to prevent path traversal:

```typescript
// Valid: lowercase alphanumeric, hyphens, 1-50 chars
const TEAM_NAME_REGEX = /^[a-z0-9-]{1,50}$/;

function validateTeamNameOrThrow(name: string): void {
  if (!TEAM_NAME_REGEX.test(name)) {
    throw new Error("Team name must be 1-50 lowercase alphanumeric characters or hyphens");
  }
  // Additional checks
  if (name.startsWith("-") || name.endsWith("-")) {
    throw new Error("Team name cannot start or end with hyphen");
  }
  if (name.includes("--")) {
    throw new Error("Team name cannot contain consecutive hyphens");
  }
}
```

### 2. Session Key Sanitization

Sanitize session keys before using in file paths:

```typescript
function sanitizeSessionKey(sessionKey: string): string {
  return sessionKey
    .replace(/[./\\]/g, "_") // Remove path separators
    .replace(/:/g, "_") // Remove colons
    .substring(0, 100); // Limit length
}
```

### 3. Team Isolation

Enforce strict isolation between teams:

1. **Storage Isolation**: Each team has its own `config.json` and `ledger.db`
2. **Access Control**: Verify session key belongs to registered member
3. **No Cross-Team Access**: A session can only access its own team's resources

```typescript
function verifyTeamMembership(teamName: string, sessionKey: string): boolean {
  const manager = getTeamManager(teamName, stateDir);
  const members = manager.listMembers();
  return members.some((m) => m.sessionKey === sessionKey);
}
```

### 4. Message Content Validation

Sanitize messages before injection:

```typescript
function escapeXml(content: string): string {
  return content
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
```

## Performance Guidelines

### 1. SQLite Connection Management

Reuse connections via the pool:

```typescript
// Good: Use pool
const manager = getTeamManager(teamName, stateDir);

// Bad: Create new connection each time
const manager = new TeamManager(teamName, stateDir);
```

### 2. WAL Configuration

Enable WAL mode for concurrent access:

```typescript
db.exec("PRAGMA journal_mode = WAL");
db.exec("PRAGMA wal_autocheckpoint = 1000");
db.exec("PRAGMA synchronous = NORMAL");
```

### 3. Atomic Task Claiming

Use SQL WHERE clause for atomic updates:

```typescript
// Good: Atomic update
const stmt = db.prepare(`
  UPDATE tasks
  SET status = 'in_progress', owner = ?, claimedAt = ?
  WHERE id = ? AND status = 'pending' AND (owner IS NULL OR owner = '')
`);
const result = stmt.run(owner, Date.now(), taskId);
return result.changes > 0;

// Bad: Read-modify-write (race condition)
const task = db.prepare("SELECT * FROM tasks WHERE id = ?").get(taskId);
if (task.status === "pending") {
  db.prepare("UPDATE tasks SET owner = ? WHERE id = ?").run(owner, taskId);
}
```

### 4. SQLITE_BUSY Handling

Implement exponential backoff:

```typescript
async function withRetry<T>(fn: () => T, maxAttempts = 5, baseDelay = 50): Promise<T> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return fn();
    } catch (err: any) {
      if (err.code === "SQLITE_BUSY" || err.code === "SQLITE_LOCKED") {
        const delay = baseDelay * Math.pow(2, attempt);
        await new Promise((r) => setTimeout(r, delay));
        continue;
      }
      throw err;
    }
  }
  throw new Error("Database locked after max retries");
}
```

### 5. Inbox Cleanup

Delete messages after reading to prevent unbounded growth:

```typescript
async function consumeInbox(inboxPath: string): Promise<TeamMessage[]> {
  try {
    const content = await readFile(inboxPath, "utf8");
    const messages = parseMessages(content);
    await unlink(inboxPath); // Delete immediately
    return messages;
  } catch (err) {
    if (err.code === "ENOENT") return [];
    throw err;
  }
}
```

## Resource Limits

Enforce limits defined in `src/teams/limits.ts`:

| Resource             | Limit       |
| -------------------- | ----------- |
| Max teams            | 10          |
| Max members per team | 10          |
| Max tasks per team   | 1000        |
| Max message size     | 100KB       |
| Max task subject     | 200 chars   |
| Max task description | 10000 chars |
| Max team name length | 50 chars    |

```typescript
export function enforceLimits(teamName: string, team: TeamState): void {
  if (team.members.length >= MAX_MEMBERS) {
    throw new Error(`Team ${teamName} has reached maximum members (${MAX_MEMBERS})`);
  }
  if (team.tasks.length >= MAX_TASKS) {
    throw new Error(`Team ${teamName} has reached maximum tasks (${MAX_TASKS})`);
  }
}
```

## Testing Guidelines

### Test File Organization

```
src/teams/
├── manager.test.ts        # Core operations
├── ledger.test.ts         # SQLite operations
├── inbox.test.ts          # Message storage
├── storage.test.ts        # Filesystem operations
├── pool.test.ts           # Connection caching
├── limits.test.ts         # Resource limits
├── cleanup.test.ts        # Maintenance
├── context-injection.test.ts  # XML formatting
├── state-injection.test.ts    # State formatting
├── security.test.ts       # Security tests
├── performance.test.ts    # Concurrency tests
└── e2e.test.ts            # End-to-end workflows
```

### Test Patterns

```typescript
describe("TeamManager", () => {
  let manager: TeamManager;
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "teams-test-"));
    manager = new TeamManager("test-team", tempDir);
  });

  afterEach(() => {
    manager.close();
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it("should claim task atomically", () => {
    // Create task
    const task = manager.createTask("Test", "Description");

    // First claim succeeds
    const result1 = manager.claimTask(task.id, "agent1");
    expect(result1.success).toBe(true);

    // Second claim fails
    const result2 = manager.claimTask(task.id, "agent2");
    expect(result2.success).toBe(false);
    expect(result2.reason).toBe("Task already claimed by another agent");
  });
});
```

## Error Messages

Provide clear, actionable error messages:

```typescript
// Good: Clear and actionable
"Team 'alpha-squad' already exists. Please choose a different name.";
"Task 'abc-123' has unmet dependencies: ['def-456', 'ghi-789']";
"Agent-to-agent messaging is disabled. Set tools.agentToAgent.enabled=true";

// Bad: Vague and unhelpful
"Error";
"Failed to create team";
"Invalid input";
```

## Integration with agentToAgent

For cross-team or cross-agent communication, integrate with the existing `agentToAgent` policy:

```typescript
import { createAgentToAgentPolicy } from "../sessions-access.js";

export function createTeamMessagingPolicy(
  cfg: OpenClawConfig,
  teamConfig: TeamConfig,
): TeamMessagingPolicy {
  const a2aPolicy = createAgentToAgentPolicy(cfg);

  return {
    canSend(fromSession: string, toMember: string): boolean {
      const fromMember = teamConfig.members.find((m) => m.sessionKey === fromSession);
      const toMemberData = teamConfig.members.find((m) => m.name === toMember);

      if (!fromMember || !toMemberData) return false;

      // Reuse A2A bidirectional check
      return a2aPolicy.isAllowed(fromMember.agentId, toMemberData.agentId);
    },
  };
}
```
