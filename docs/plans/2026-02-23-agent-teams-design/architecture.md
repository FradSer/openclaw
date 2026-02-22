# Agent Teams Architecture

## System Architecture

```mermaid
graph TB
    subgraph User Interface Layer
        UI[User Message]
        CLI[CLI openclaw agent]
        WEB[WebChat]
        APP[macOS/iOS Apps]
    end

    subgraph Gateway Control Plane
        GW[Gateway WebSocket Server]
        WS[ws://127.0.0.1:18789]
    end

    subgraph Agent Runtime
        PI[Pi Agent Runtime]
    end

    subgraph Team Layer
        TL[Team Lead Session]
        TM1[Teammate 1 Session]
        TM2[Teammate 2 Session]
        TM3[Teammate 3 Session]
    end

    subgraph Storage Layer
        DIR[~/.openclaw/teams/]
        CFG[config.json]
        DB[ledger.db SQLite]
        INBOX[inbox/]
        MSGS[messages.jsonl]
    end

    UI --> GW
    CLI --> GW
    WEB --> GW
    APP --> GW

    GW <--> WS
    GW <--> PI

    PI --> TL
    PI --> TM1
    PI --> TM2
    PI --> TM3

    TL -->|TeamCreate| DIR
    TL -->|TaskCreate| DB
    TL -->|TaskList| DB

    TM1 -->|TaskClaim| DB
    TM2 -->|TaskClaim| DB
    TM3 -->|TaskClaim| DB

    TM1 -->|TaskComplete| DB
    TM2 -->|TaskComplete| DB
    TM3 -->|TaskComplete| DB

    TL -->|SendMessage| INBOX
    TM1 -->|SendMessage| INBOX
    TM2 -->|SendMessage| INBOX

    INBOX --> MSGS
    MSGS --> TM1
    MSGS --> TM2
    MSGS --> TL
```

## Component Architecture

### 1. Storage Layer

#### Team Directory Structure
```
~/.openclaw/teams/
├── teams.json                    # Team registry
├── {team_name}/
│   ├── config.json               # Team configuration
│   ├── ledger.db                 # SQLite task ledger
│   ├── ledger.db-shm             # WAL shared memory
│   ├── ledger.db-wal             # WAL log
│   └── inbox/
│       ├── {teammate_session_key}/
│       │   └── messages.jsonl    # Message queue (one line per message)
```

#### Team Config Schema
```typescript
interface TeamConfig {
  id: string;                    // UUID
  name: string;                  // Path-safe team identifier
  description?: string;          // Human-readable description
  agentType?: string;            // Agent type for team lead
  createdAt: number;             // Unix timestamp
  updatedAt: number;             // Unix timestamp
  status: 'active' | 'shutdown';
  leadSessionKey: string;        // Session key of team lead
}
```

#### SQLite Schema

**Tasks Table:**
```sql
CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,           -- UUID
  subject TEXT NOT NULL,         -- High-level summary
  description TEXT NOT NULL,     -- Detailed instructions for LLM
  activeForm TEXT,               -- Present continuous form for display
  status TEXT NOT NULL CHECK(
    status IN ('pending', 'claimed', 'in_progress', 'completed', 'failed')
  ),
  owner TEXT,                    -- Session key of claiming agent
  dependsOn TEXT,                -- JSON array: ["task-id-1", "task-id-2"]
  blockedBy TEXT,                -- JSON array (computed): ["task-id-3"]
  metadata TEXT,                 -- JSON object: {"priority": "high", "deadline": "2026-03-01"}
  createdAt INTEGER NOT NULL,
  claimedAt INTEGER,
  completedAt INTEGER
);

CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_owner ON tasks(owner);
CREATE INDEX IF NOT EXISTS idx_tasks_created ON tasks(createdAt);
```

**Members Table:**
```sql
CREATE TABLE IF NOT EXISTS members (
  sessionKey TEXT PRIMARY KEY,
  agentId TEXT NOT NULL,
  name TEXT,
  role TEXT CHECK(role IN ('lead', 'member')),
  joinedAt INTEGER NOT NULL,
  lastActiveAt INTEGER
);
```

**Messages Table (optional persistence):**
```sql
CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  fromSession TEXT NOT NULL,
  toSession TEXT NOT NULL,
  type TEXT NOT NULL CHECK(
    type IN ('message', 'broadcast', 'shutdown_request', 'shutdown_response', 'idle')
  ),
  content TEXT NOT NULL,
  summary TEXT,
  requestId TEXT,
  approve INTEGER,               -- 0/1 for shutdown_response
  reason TEXT,
  createdAt INTEGER NOT NULL,
  delivered INTEGER DEFAULT 0
);
```

### 2. Tool Layer

#### Tool Organization
```
src/agents/tools/
├── teams/
│   ├── team-create.ts
│   ├── team-create.test.ts
│   ├── teammate-spawn.ts
│   ├── teammate-spawn.test.ts
│   ├── team-shutdown.ts
│   ├── team-shutdown.test.ts
│   ├── task-create.ts
│   ├── task-create.test.ts
│   ├── task-list.ts
│   ├── task-list.test.ts
│   ├── task-claim.ts
│   ├── task-claim.test.ts
│   ├── task-complete.ts
│   ├── task-complete.test.ts
│   ├── send-message.ts
│   ├── send-message.test.ts
│   └── common.ts                # Shared utilities
```

#### Tool Registration

Update `src/agents/openclaw-tools.ts`:

```typescript
// Add team tools to createOpenClawTools
const tools: AnyAgentTool[] = [
  // ... existing tools ...
  createTeamCreateTool({
    agentSessionKey: opts?.agentSessionKey,
  }),
  createTeammateSpawnTool({
    agentSessionKey: opts?.agentSessionKey,
    agentChannel: opts?.agentChannel,
    agentAccountId: opts?.agentAccountId,
  }),
  createTeamShutdownTool({
    agentSessionKey: opts?.agentSessionKey,
  }),
  createTaskCreateTool({
    agentSessionKey: opts?.agentSessionKey,
  }),
  createTaskListTool({
    agentSessionKey: opts?.agentSessionKey,
  }),
  createTaskClaimTool({
    agentSessionKey: opts?.agentSessionKey,
  }),
  createTaskCompleteTool({
    agentSessionKey: opts?.agentSessionKey,
  }),
  createSendMessageTool({
    agentSessionKey: opts?.agentSessionKey,
  }),
];
```

### 3. Manager Layer

#### TeamManager Class

```typescript
// src/teams/manager.ts
import { randomUUID } from 'node:crypto';
import { requireNodeSqlite } from '../memory/sqlite.js';
import type { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs/promises';

export class TeamManager {
  private readonly teamDir: string;
  private readonly db: DatabaseSync;
  private readonly teamName: string;

  constructor(teamName: string, stateDir: string) {
    this.teamName = teamName;
    this.teamDir = path.join(stateDir, 'teams', teamName);
    this.db = this.openDatabase();
    this.ensureSchema();
  }

  private openDatabase(): DatabaseSync {
    const { DatabaseSync } = requireNodeSqlite();
    const dbPath = path.join(this.teamDir, 'ledger.db');
    return new DatabaseSync(dbPath, { mode: 'wal' });
  }

  private ensureSchema(): void {
    // Create tables...
  }

  async createTask(params: {
    subject: string;
    description: string;
    activeForm?: string;
    dependsOn?: string[];
    metadata?: Record<string, unknown>;
  }): Promise<string> {
    const taskId = randomUUID();
    // Insert into tasks table...
    return taskId;
  }

  async claimTask(taskId: string, sessionKey: string): Promise<boolean> {
    const stmt = this.db.prepare(`
      UPDATE tasks
      SET status = 'claimed',
          owner = ?,
          claimedAt = ?
      WHERE id = ?
        AND status = 'pending'
        AND owner IS NULL
    `);
    const result = stmt.exec(sessionKey, Date.now(), taskId);
    return result.changes > 0;
  }

  async completeTask(taskId: string): Promise<void> {
    // Update task status
    // Unblock dependent tasks
  }
}
```

### 4. Gateway Integration

#### Team Handlers

```typescript
// src/gateway/server-methods/teams.ts
export const teamsHandlers: GatewayRequestHandlers = {
  'teams.create': async (opts) => {
    const { team_name, description, agent_type } = opts.params;
    const teamDir = path.join(resolveStateDir(), 'teams', team_name);
    // Create team config
    // Create SQLite ledger
    // Respond with team ID
  },
  'teams.delete': async (opts) => {
    // Remove team directory
  },
  'teams.list': async (opts) => {
    // List all teams
  },
  'teams.get': async (opts) => {
    // Get team details
  },
};
```

Register in `src/gateway/server-methods.ts`:

```typescript
export const coreGatewayHandlers: GatewayRequestHandlers = {
  ...connectHandlers,
  ...teamsHandlers,  // Add team handlers
  ...chatHandlers,
  // ... other handlers
};
```

### 5. Session State Integration

#### Extend SessionEntry

```typescript
// src/config/sessions/types.ts
export type SessionEntry = {
  sessionId: string;
  updatedAt: number;
  // ... existing fields ...
  teamId?: string;              // ID of team session belongs to
  teamRole?: 'lead' | 'member'; // Role in team
  teamCapabilities?: string[];   // Assigned capabilities
};
```

#### Context Injection for Team State

```typescript
// In system prompt construction (src/agents/system-prompt.ts or similar)
function buildSystemPrompt(session: SessionEntry): string {
  let prompt = basePrompt;

  if (session.teamId && session.teamRole === 'lead') {
    const teamState = loadTeamState(session.teamId); // Load from file/DB
    prompt += '\n\n=== TEAM STATE ===\n';
    prompt += `Team: ${teamState.name} (${session.teamId})\n`;
    prompt += `Role: Team Lead\n`;
    prompt += `Active Members (${teamState.members.length}):\n`;
    for (const member of teamState.members) {
      prompt += `  - ${member.name} (${member.agentId})\n`;
    }
    prompt += `Pending Tasks: ${teamState.pendingTaskCount}\n`;
    prompt += `In Progress Tasks: ${teamState.inProgressTaskCount}\n`;
    prompt += '====================\n\n';
  }

  return prompt;
}
```

## Concurrency Control

### SQLite WAL Mode

WAL (Write-Ahead Logging) mode enables:
- Concurrent readers during writes
- Better performance for read-heavy workloads
- Checkpoint-based persistence

Configuration:
```typescript
const db = new DatabaseSync(dbPath, { mode: 'wal' });
```

### Atomic Task Claiming

```typescript
async claimTask(taskId: string, sessionKey: string): Promise<ClaimResult> {
  const stmt = this.db.prepare(`
    UPDATE tasks
    SET status = 'claimed',
        owner = ?,
        claimedAt = ?
    WHERE id = ?
      AND status = 'pending'
      AND owner IS NULL
  `);

  let attempts = 0;
  const maxAttempts = 5;
  const baseDelay = 50; // ms

  while (attempts < maxAttempts) {
    try {
      const result = stmt.exec(sessionKey, Date.now(), taskId);
      if (result.changes > 0) {
        return { success: true, taskId };
      }
      // No rows affected = already claimed
      return { success: false, error: 'Task already claimed' };
    } catch (err) {
      if (err.code === 'SQLITE_BUSY') {
        const delay = baseDelay * Math.pow(2, attempts);
        await sleep(delay);
        attempts++;
        continue;
      }
      throw err;
    }
  }

  return { success: false, error: 'Failed to claim task after retries' };
}
```

### Task Dependency Resolution

```typescript
async completeTask(taskId: string, sessionKey: string): Promise<void> {
  // Mark task as completed
  const updateStmt = this.db.prepare(`
    UPDATE tasks
    SET status = 'completed',
        completedAt = ?
    WHERE id = ? AND owner = ?
  `);
  updateStmt.exec(Date.now(), taskId, sessionKey);

  // Find tasks blocked by this task
  const findBlocked = this.db.prepare(`
    SELECT id, blockedBy FROM tasks
    WHERE status IN ('pending', 'claimed')
      AND blockedBy LIKE ?
  `);

  const pattern = `%"${taskId}"%`;
  const blocked = findBlocked.all(pattern);

  // Update each blocked task
  const removeBlocked = this.db.prepare(`
    UPDATE tasks
    SET blockedBy = (
      SELECT json_remove(blockedBy, idx)
      FROM (
        SELECT blockedBy, json_each.key as idx
        FROM tasks
        WHERE id = ?
      )
      WHERE json_extract(blockedBy, '$[' || idx || ']') = ?
    )
    WHERE id = ?
  `);

  const unblockIfEmpty = this.db.prepare(`
    UPDATE tasks
    SET status = 'pending'
    WHERE id = ? AND json_array_length(blockedBy) = 0
  `);

  for (const task of blocked) {
    // Remove from blockedBy
    removeBlocked.exec(task.id, taskId, task.id);
    // Unblock if no remaining dependencies
    unblockIfEmpty.exec(task.id);
  }
}
```

## Mailbox Protocol

### Message Format

```typescript
interface TeamMessage {
  id: string;
  from: string;              // Session key
  to?: string;               // Session key (optional for broadcast)
  type: 'message' | 'broadcast' | 'shutdown_request' | 'shutdown_response' | 'idle';
  content: string;
  summary?: string;          // 5-10 word summary for UI
  requestId?: string;        // For shutdown protocol
  approve?: boolean;         // For shutdown_response
  reason?: string;           // For shutdown_response reject
  timestamp: number;
}
```

### Message Storage

```typescript
// Write to inbox
async writeMessage(teamName: string, message: TeamMessage): Promise<void> {
  const inboxDir = path.join(resolveStateDir(), 'teams', teamName, 'inbox');

  if (message.type === 'broadcast') {
    // Write to all members' inboxes
    const members = await listTeamMembers(teamName);
    for (const member of members) {
      if (member.sessionKey !== message.from) {
        await writeToMemberInbox(inboxDir, member.sessionKey, message);
      }
    }
  } else {
    await writeToMemberInbox(inboxDir, message.to!, message);
  }
}

async function writeToMemberInbox(
  inboxDir: string,
  sessionKey: string,
  message: TeamMessage
): Promise<void> {
  const memberInbox = path.join(inboxDir, sanitizeSessionKey(sessionKey));
  await fs.mkdir(memberInbox, { recursive: true });

  const messagesFile = path.join(memberInbox, 'messages.jsonl');
  const line = JSON.stringify(message) + '\n';
  await fs.appendFile(messagesFile, line, { mode: 0o600 });
}
```

### Message Injection into Context

```typescript
async injectPendingMessages(session: SessionEntry): Promise<string> {
  if (!session.teamId) {
    return '';
  }

  const inboxDir = path.join(
    resolveStateDir(),
    'teams',
    session.teamId,
    'inbox',
    sanitizeSessionKey(session.sessionKey)
  );

  const messagesFile = path.join(inboxDir, 'messages.jsonl');

  try {
    const content = await fs.readFile(messagesFile, 'utf-8');
    const lines = content.trim().split('\n').filter(Boolean);
    const messages: TeamMessage[] = lines.map(line => JSON.parse(line));

    // Build context from messages
    let context = '';
    for (const msg of messages) {
      const fromName = resolveAgentName(msg.from);
      const attrs = [`teammate_id="${fromName}"`, `type="${msg.type}"`];
      if (msg.summary) attrs.push(`summary="${msg.summary}"`);
      if (msg.requestId) attrs.push(`request_id="${msg.requestId}"`);
      if (msg.approve !== undefined) attrs.push(`approve="${msg.approve}"`);

      context += `<teammate-message ${attrs.join(' ')}>\n`;
      context += `${msg.content}\n`;
      context += `</teammate-message>\n`;
    }

    // Clear processed messages
    await fs.unlink(messagesFile).catch(() => {});

    return context;
  } catch (err) {
    if (err.code !== 'ENOENT') {
      // Log error but continue
    }
    return '';
  }
}
```

## Security Considerations

### Path Traversal Prevention

```typescript
function sanitizeSessionKey(sessionKey: string): string {
  // Remove or replace dangerous characters
  return sessionKey
    .replace(/[.\/\\]/g, '_')
    .substring(0, 100); // Limit length
}

function validateTeamName(name: string): boolean {
  // Only allow alphanumeric, hyphens, underscores
  return /^[a-zA-Z0-9_-]{1,50}$/.test(name);
}
```

### Team Isolation

- Each team has its own directory
- SQLite database is team-specific
- Inboxes are per-session scoped
- No cross-team message routing

### Sandbox Integration

Teammate sessions should use Docker sandboxing:

```typescript
// When spawning teammate
await spawnSubagentDirect({
  task: `Join team ${teamName} as ${name}`,
  agentId: requestedAgentId,
  // ...
}, {
  // Enforce sandbox for teammates
  agentSessionKey: parentKey,
  // ... other context
});
```

## Performance Considerations

### Connection Pooling

```typescript
// Shared connection manager
const connectionCache = new Map<string, DatabaseSync>();

function getTeamManager(teamName: string): TeamManager {
  if (!connectionCache.has(teamName)) {
    connectionCache.set(teamName, new TeamManager(teamName, resolveStateDir()));
  }
  return connectionCache.get(teamName)!;
}
```

### Checkpoint Configuration

```typescript
// Configure WAL checkpoint
db.pragma('wal_autocheckpoint = 1000'); // Every 1000 pages
```

### Message Cleanup

```typescript
// Periodic cleanup of old messages
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

      // Filter out old messages
      const recent = messages.filter(m => (now - m.timestamp) < maxAge);

      if (recent.length < messages.length) {
        const newContent = recent.map(m => JSON.stringify(m)).join('\n') + '\n';
        await fs.writeFile(messagesFile, newContent, { mode: 0o600 });
      }
    } catch (err) {
      // Ignore missing files
    }
  }
}
```