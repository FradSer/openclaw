# Agent Teams Best Practices

## Security Guidelines

### 1. Path Traversal Prevention

Always sanitize team names and session keys when constructing file paths:

```typescript
function sanitizeSessionKey(sessionKey: string): string {
  return sessionKey
    .replace(/[.\/\\]/g, '_')
    .substring(0, 100);
}

function validateTeamName(name: string): boolean {
  return /^[a-zA-Z0-9_-]{1,50}$/.test(name);
}
```

### 2. Team Isolation

- Each team directory is completely isolated
- SQLite database is scoped to a single team
- Inbox directories are per-session scoped
- Never allow cross-team message routing through tools

### 3. Permission Scoping

Team Lead should have restricted tool permissions:

```typescript
// Team Lead tool profile - orchestration only
const TEAM_LEAD_TOOLS = [
  'team_create',
  'teammate_spawn',
  'team_shutdown',
  'task_create',
  'task_list',
  'send_message',
];

// Teammate tool profile - execution focused
const TEAMMATE_TOOLS = [
  'task_list',
  'task_claim',
  'task_complete',
  'send_message',
  'browser',
  'bash',
  // ... execution tools
];
```

### 4. Docker Sandbox Enforcement

Teammate sessions should always run in Docker sandbox when enabled:

```typescript
// When spawning teammate
const spawnResult = await spawnSubagentDirect({
  task,
  agentId,
  // ...
}, {
  agentSessionKey: opts.agentSessionKey,
  // Context ensures sandbox is inherited
});
```

### 5. Message Content Validation

Validate and sanitize message content to prevent injection attacks:

```typescript
function validateMessageContent(content: string): { valid: boolean; error?: string } {
  if (!content || content.length === 0) {
    return { valid: false, error: 'Message content cannot be empty' };
  }

  if (content.length > 100_000) {
    return { valid: false, error: 'Message content too large' };
  }

  return { valid: true };
}
```

### 6. Communication Auditing

Log all team communication for security monitoring:

```typescript
async logTeamMessage(teamId: string, message: TeamMessage): Promise<void> {
  const auditLog = path.join(resolveStateDir(), 'teams', teamId, 'audit.log');
  const entry = {
    timestamp: Date.now(),
    from: message.from,
    to: message.to,
    type: message.type,
    size: message.content.length,
  };
  await fs.appendFile(auditLog, JSON.stringify(entry) + '\n');
}
```

## Performance Guidelines

### 1. SQLite Connection Pooling

Reuse database connections per team to avoid overhead:

```typescript
const connectionCache = new Map<string, DatabaseSync>();

export function getTeamManager(teamName: string): TeamManager {
  if (!connectionCache.has(teamName)) {
    connectionCache.set(teamName, new TeamManager(teamName, resolveStateDir()));
  }
  return connectionCache.get(teamName)!;
}

// Clean up on team shutdown
export function closeTeamManager(teamName: string): void {
  const manager = connectionCache.get(teamName);
  if (manager) {
    manager.close();
    connectionCache.delete(teamName);
  }
}
```

### 2. WAL Configuration

Configure WAL mode for optimal concurrent performance:

```typescript
const db = new DatabaseSync(dbPath, { mode: 'wal' });

// Auto-checkpoint every 1000 pages (configurable)
db.pragma('wal_autocheckpoint = 1000');

// Alternatively, manual checkpoint
db.exec('PRAGMA wal_checkpoint(TRUNCATE)');
```

### 3. Index Strategy

Create indexes for common query patterns:

```sql
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_owner ON tasks(owner);
CREATE INDEX idx_tasks_created ON tasks(createdAt);
CREATE INDEX idx_tasks_blocked_by ON tasks(blockedBy);
```

### 4. Batching for Bulk Operations

When adding multiple tasks, use transactions:

```typescript
async createTasks(taskParams: TaskParams[]): Promise<string[]> {
  const taskIds: string[] = [];
  const db = this.db;

  db.exec('BEGIN TRANSACTION');

  try {
    const stmt = db.prepare(`
      INSERT INTO tasks (id, subject, description, activeForm, status, dependsOn, metadata, createdAt)
      VALUES (?, ?, ?, ?, 'pending', ?, ?, ?)
    `);

    for (const params of taskParams) {
      const taskId = randomUUID();
      stmt.run(taskId, params.subject, params.description, params.activeForm,
               JSON.stringify(params.dependsOn), JSON.stringify(params.metadata),
               Date.now());
      taskIds.push(taskId);
    }

    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }

  return taskIds;
}
```

### 5. Message Cleanup

Periodically clean up old messages to prevent disk bloat:

```typescript
async cleanupOldMessages(teamName: string, maxAge = 24 * 60 * 60 * 1000): Promise<void> {
  const inboxDir = path.join(resolveStateDir(), 'teams', teamName, 'inbox');
  const now = Date.now();

  const entries = await fs.readdir(inboxDir, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;

    const messagesFile = path.join(inboxDir, entry.name, 'messages.jsonl');
    try {
      const content = await fs.readFile(messagesFile, 'utf-8');
      const lines = content.trim().split('\n').filter(Boolean);
      const messages: TeamMessage[] = lines.map(line => JSON.parse(line));

      const recent = messages.filter(m => (now - m.timestamp) < maxAge);

      if (recent.length < messages.length) {
        const newContent = recent.map(m => JSON.stringify(m)).join('\n') + '\n';
        await fs.writeFile(messagesFile, newContent, { mode: 0o600 });
      }
    } catch (err) {
      if (err.code !== 'ENOENT') throw err;
    }
  }
}
```

## Code Quality Guidelines

### 1. Type Safety

Always use explicit types, avoid `any`:

```typescript
// Good
interface TaskClaimResult {
  success: boolean;
  taskId: string;
  error?: string;
}

async claimTask(taskId: string, sessionKey: string): Promise<TaskClaimResult> {
  // ...
}

// Bad
async claimTask(taskId: string, sessionKey: string): Promise<any> {
  // ...
}
```

### 2. Error Handling

Use structured error types:

```typescript
export class TeamError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'TeamError';
  }
}

// Usage
throw new TeamError('Team not found', 'TEAM_NOT_FOUND', { teamId });
```

### 3. Validation with TypeBox

Use TypeBox schemas for tool parameters:

```typescript
import { Type } from '@sinclair/typebox';

const TaskCreateSchema = Type.Object({
  team_name: Type.String({ minLength: 1, maxLength: 50 }),
  subject: Type.String({ minLength: 1, maxLength: 200 }),
  description: Type.String({ minLength: 1, maxLength: 10_000 }),
  activeForm: Type.Optional(Type.String({ maxLength: 100 })),
  dependsOn: Type.Optional(Type.Array(Type.String())),
  metadata: Type.Optional(Type.Record(Type.String(), Type.Unknown())),
});
```

### 4. File Size Limits

Enforce reasonable limits to prevent resource exhaustion:

```typescript
const MAX_TASK_DESCRIPTION = 10_000;
const MAX_MESSAGE_SIZE = 100_000;
const MAX_TASKS_PER_TEAM = 1000;
const MAX_MEMBERS_PER_TEAM = 10;

function validateTaskDescription(description: string): boolean {
  return description.length <= MAX_TASK_DESCRIPTION;
}
```

### 5. Atomic File Operations

Use atomic write patterns for persistence:

```typescript
async atomicWrite(path: string, content: string): Promise<void> {
  const tmpPath = `${path}.tmp.${randomUUID()}`;
  try {
    await fs.writeFile(tmpPath, content, { mode: 0o600 });
    await fs.rename(tmpPath, path);
  } catch (err) {
    await fs.rm(tmpPath, { force: true }).catch(() => {});
    throw err;
  }
}
```

## Testing Guidelines

### 1. Unit Tests

Test individual functions in isolation:

```typescript
describe('sanitizeSessionKey', () => {
  it('removes dangerous characters', () => {
    expect(sanitizeSessionKey('agent:test/../key')).toBe('agent:test___key');
  });

  it('limits length', () => {
    const longKey = 'a'.repeat(200);
    expect(sanitizeSessionKey(longKey).length).toBe(100);
  });
});
```

### 2. Integration Tests

Test tool interactions:

```typescript
describe('TaskClaim workflow', () => {
  it('claims task atomically', async () => {
    const manager = new TeamManager('test-team', testStateDir);
    const taskId = await manager.createTask({ subject: 'Test', description: 'Test' });

    const claim1 = await manager.claimTask(taskId, 'agent-1');
    const claim2 = await manager.claimTask(taskId, 'agent-2');

    expect(claim1.success).toBe(true);
    expect(claim2.success).toBe(false);
  });
});
```

### 3. Concurrency Tests

Test race conditions:

```typescript
describe('Concurrent task claiming', () => {
  it('prevents double assignment', async () => {
    const manager = new TeamManager('test-team', testStateDir);
    const taskId = await manager.createTask({ subject: 'Test', description: 'Test' });

    const [claim1, claim2] = await Promise.all([
      manager.claimTask(taskId, 'agent-1'),
      manager.claimTask(taskId, 'agent-2'),
    ]);

    const successCount = [claim1, claim2].filter(c => c.success).length;
    expect(successCount).toBe(1);
  });
});
```

### 4. BDD Tests

Follow Gherkin scenarios:

```gherkin
Scenario: Atomic task claiming prevents race conditions
  Given a pending task with ID 5
  And two idle members "agent-fast" and "agent-slow"
  When both members attempt to claim the task simultaneously
  Then only one member successfully claims the task
  And the other member receives a conflict error
```

## Concurrency Best Practices

### 1. Transaction Boundaries

Keep transactions short and focused:

```typescript
// Good - single operation
async claimTask(taskId: string, sessionKey: string): Promise<boolean> {
  const stmt = this.db.prepare(`
    UPDATE tasks SET status = 'claimed', owner = ?, claimedAt = ?
    WHERE id = ? AND status = 'pending' AND owner IS NULL
  `);
  const result = stmt.exec(sessionKey, Date.now(), taskId);
  return result.changes > 0;
}

// Bad - multiple unrelated operations in one transaction
async doEverything(teamId: string): Promise<void> {
  db.exec('BEGIN');
  // ... many operations ...
  db.exec('COMMIT');
}
```

### 2. Retry Logic with Backoff

Handle SQLITE_BUSY gracefully:

```typescript
async withRetry<T>(
  fn: () => T,
  maxAttempts = 5,
  baseDelay = 50
): Promise<T> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (err.code === 'SQLITE_BUSY' && attempt < maxAttempts - 1) {
        const delay = baseDelay * Math.pow(2, attempt);
        await sleep(delay);
        continue;
      }
      throw err;
    }
  }
  throw new Error('Max retry attempts exceeded');
}
```

### 3. Lock Ordering

Always acquire locks in consistent order to prevent deadlocks:

```typescript
// Always claim tasks by ID order to prevent deadlocks
async claimMultipleTasks(taskIds: string[], sessionKey: string): Promise<boolean[]> {
  const sortedIds = [...taskIds].sort();
  const results: boolean[] = [];

  for (const taskId of sortedIds) {
    results.push(await this.claimTask(taskId, sessionKey));
  }

  return results;
}
```

## Observability Guidelines

### 1. Logging

Use structured logging:

```typescript
import { logDebug } from '../logger.js';

logDebug('Team created', { teamId, teamName, agentType });
logDebug('Task claimed', { teamId, taskId, sessionKey });
logDebug('Message sent', { teamId, from, to, type });
```

### 2. Metrics

Track key metrics:

```typescript
const metrics = {
  teamsCreated: 0,
  tasksCreated: 0,
  tasksClaimed: 0,
  tasksCompleted: 0,
  messagesSent: 0,
};

function incrementMetric(name: keyof typeof metrics): void {
  metrics[name]++;
}
```

### 3. Status Reporting

Provide team status for UI:

```typescript
async getTeamStatus(teamId: string): Promise<TeamStatus> {
  const tasks = await listTasks(teamId);
  const members = await listMembers(teamId);

  return {
    teamId,
    status: 'active',
    memberCount: members.length,
    pendingTasks: tasks.filter(t => t.status === 'pending').length,
    inProgressTasks: tasks.filter(t => t.status === 'in_progress').length,
    completedTasks: tasks.filter(t => t.status === 'completed').length,
  };
}
```

## Context Management Guidelines

### 1. Ground Truth Injection

Always inject team state before Team Lead inference:

```typescript
function injectTeamState(session: SessionEntry): string {
  if (!session.teamId || session.teamRole !== 'lead') {
    return '';
  }

  const teamState = loadTeamState(session.teamId);
  let state = '\n\n=== TEAM STATE ===\n';
  state += `Team: ${teamState.name}\n`;
  state += `Members: ${teamState.members.map(m => m.name).join(', ')}\n`;
  state += `Pending Tasks: ${teamState.pendingTaskCount}\n`;
  state += '====================\n';

  return state;
}
```

### 2. Context Compression Handling

Team state must survive context compression:

```typescript
// Store team state separately from conversation history
const teamStateCache = new Map<string, TeamState>();

// Load on demand, persist to file
function getTeamState(teamId: string): TeamState {
  if (!teamStateCache.has(teamId)) {
    const state = loadTeamStateFromFile(teamId);
    teamStateCache.set(teamId, state);
  }
  return teamStateCache.get(teamId)!;
}
```

### 3. Message Summarization

Provide short summaries for UI preview:

```typescript
function summarizeMessage(content: string, maxWords = 10): string {
  const words = content.trim().split(/\s+/);
  if (words.length <= maxWords) {
    return content;
  }
  return words.slice(0, maxWords).join(' ') + '...';
}
```

## Resource Limits

### 1. Team Limits

- Max teams: 10 (configurable)
- Max members per team: 10
- Max tasks per team: 1000
- Max message size: 100KB
- Max task description: 10KB

### 2. Timeout Configuration

- Task claim timeout: 30 seconds
- Task completion timeout: 1 hour
- Shutdown response timeout: 60 seconds
- Message delivery timeout: immediate (async)

### 3. Cleanup Policies

- Inactive teams: Delete after 7 days
- Completed tasks: Archive after 30 days
- Old messages: Delete after 24 hours
- Temporary files: Clean on team shutdown