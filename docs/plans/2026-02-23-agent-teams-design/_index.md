# OpenClaw Agent Teams Design

## Context

This document describes the design for implementing Claude Code-style multi-agent team orchestration in OpenClaw. The design enables a Team Lead agent to coordinate multiple independent Teammate agents through a shared task ledger with SQLite-backed concurrency control and a mailbox protocol for peer-to-peer communication.

## Requirements

### Success Criteria for MVP

- **Team Creation and Lifecycle**: Users can create teams via `TeamCreate` tool, team configuration persists in `~/.openclaw/teams/{team_name}/config.json`, teams can be gracefully shut down with member approval
- **Teammate Spawning**: Team leads can spawn teammate agents via `TeammateSpawn` tool, teammate processes run as independent agent sessions
- **Task Ledger Management**: Tasks can be added with full metadata via `TaskCreate` tool, task claiming is atomic, task dependencies (`dependsOn`/`blockedBy`) are fully resolved, auto-unblock occurs when blocking tasks complete
- **Agent-to-Agent Communication**: Direct messaging via `SendMessage` tool, broadcasting to all teammates, shutdown request/response protocol

### Technical Constraints

- **Language**: TypeScript (ESM), Node.js 22+, pnpm package manager
- **Database**: SQLite (node:sqlite) with WAL mode
- **Implementation**: Native OpenClaw tools (not skills/extensions)
- **Testing**: Vitest with BDD scenarios (84 total)

See [AGENT_TEAMS_REQUIREMENTS.md](../../AGENT_TEAMS_REQUIREMENTS.md) for complete requirements.

## Rationale

### Why SQLite for Task Ledger

The task ledger is a shared resource accessed concurrently by multiple independent Node.js event loops. SQLite with WAL mode provides:

1. **Transactional Integrity**: Atomic updates for task claiming prevent race conditions
2. **Concurrent Reads**: Multiple agents can query tasks while writes are in progress
3. **Persistence**: Survives Gateway restarts, no data loss
4. **Simplicity**: No complex file locking logic required

### Why File-Based Team Storage

OpenClaw follows a local-first, file-driven design. Storing team data in `~/.openclaw/teams/` provides:

1. **Transparency**: Users can inspect team state directly
2. **Durability**: Survives process crashes and restarts
3. **Alignment**: Consistent with existing `~/.openclaw/agents/` patterns
4. **Debuggability**: Direct file inspection for troubleshooting

### Why Native Tools Instead of Extensions

- Tighter integration with session state management
- Direct access to Gateway internals for team coordination
- Easier testing and maintenance
- Consistent with OpenClaw tool patterns

## Detailed Design

### Architecture Overview

```mermaid
graph TB
    subgraph User Interface
        U[User Message]
    end

    subgraph Gateway
        G[Gateway WebSocket Server]
        TL[Team Lead Session]
    end

    subgraph Team Storage
        DIR[~/.openclaw/teams/{team}/]
        CFG[config.json]
        DB[ledger.db SQLite]
        INBOX[inbox/]
    end

    subgraph Teammates
        TM1[Teammate 1 Session]
        TM2[Teammate 2 Session]
    end

    U --> G
    G --> TL
    TL -->|TeamCreate| DIR
    TL -->|TaskAdd| DB
    TM1 -->|TaskClaim| DB
    TM2 -->|TaskClaim| DB
    TL -->|SendMessage| INBOX
    INBOX --> TM1
    INBOX --> TM2
```

### Directory Structure

```
~/.openclaw/
├── teams/
│   ├── {team_name}/
│   │   ├── config.json          # Team configuration
│   │   ├── ledger.db            # SQLite task ledger
│   │   ├── ledger.db-shm        # WAL shared memory
│   │   ├── ledger.db-wal        # WAL log
│   │   └── inbox/
│   │       ├── {teammate_id}/   # Message queues
│   │       │   └── messages.jsonl
```

### SQLite Schema

```sql
-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  activeForm TEXT,
  status TEXT NOT NULL CHECK(status IN ('pending', 'claimed', 'in_progress', 'completed', 'failed')),
  owner TEXT,
  dependsOn TEXT,  -- JSON array of task IDs
  blockedBy TEXT, -- JSON array of task IDs (computed)
  metadata TEXT,  -- JSON object
  createdAt INTEGER NOT NULL,
  claimedAt INTEGER,
  completedAt INTEGER
);

-- Team members table
CREATE TABLE IF NOT EXISTS members (
  sessionKey TEXT PRIMARY KEY,
  agentId TEXT NOT NULL,
  name TEXT,
  role TEXT CHECK(role IN ('lead', 'member')),
  joinedAt INTEGER NOT NULL
);

-- Messages table (optional, for inbox persistence)
CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  from_session TEXT NOT NULL,
  to_session TEXT NOT NULL,
  type TEXT NOT NULL,
  content TEXT NOT NULL,
  createdAt INTEGER NOT NULL,
  delivered INTEGER DEFAULT 0
);
```

### Tool API

#### Team Management Tools

**TeamCreate**: Creates a new team
```typescript
{
  team_name: string;           // Required: Path-safe team identifier
  description?: string;       // Optional: Team description
  agent_type?: string;        // Optional: Agent type for team lead
}
```

**TeammateSpawn**: Creates a teammate session
```typescript
{
  team_name: string;           // Required: Team to join
  name: string;               // Required: Display name
  agent_id?: string;          // Optional: Agent type ID
  model?: string;             // Optional: Model override
}
```

**TeamShutdown**: Gracefully shuts down a team
```typescript
{
  team_name: string;           // Required: Team to shutdown
  reason?: string;            // Optional: Shutdown reason
}
```

#### Task Management Tools

**TaskCreate**: Adds a task to the ledger
```typescript
{
  team_name: string;           // Required: Team to add task to
  subject: string;             // Required: Task subject
  description: string;         // Required: Task description
  activeForm?: string;         // Optional: Present continuous form
  dependsOn?: string[];        // Optional: Task ID dependencies
  metadata?: Record<string, unknown>; // Optional: Additional metadata
}
```

**TaskList**: Queries available tasks
```typescript
{
  team_name: string;           // Required: Team to query
  status?: string;             // Optional: Filter by status
  owner?: string;              // Optional: Filter by owner
  includeCompleted?: boolean;  // Optional: Include completed tasks
}
```

**TaskClaim**: Atomically claims a task
```typescript
{
  team_name: string;           // Required: Team containing task
  task_id: string;             // Required: Task ID to claim
}
```

**TaskComplete**: Marks a task as completed
```typescript
{
  team_name: string;           // Required: Team containing task
  task_id: string;             // Required: Task ID to complete
}
```

#### Communication Tools

**SendMessage**: Sends a message to teammate(s)
```typescript
{
  team_name: string;           // Required: Team context
  type: "message" | "broadcast" | "shutdown_request";
  recipient?: string;          // Required for message type
  content: string;             // Required: Message content
  request_id?: string;         // Required for shutdown_request
  approve?: boolean;           // Required for shutdown_response
  reason?: string;             // Optional: Reject reason
  summary?: string;            // Optional: 5-10 word summary
}
```

### Session State Integration

Add team-related fields to `SessionEntry` type in `src/config/sessions/types.ts`:

```typescript
export type SessionEntry = {
  // ... existing fields ...
  teamId?: string;            // ID of team session belongs to
  teamRole?: 'lead' | 'member'; // Role in team
  teamCapabilities?: string[]; // Assigned capabilities
};
```

### Concurrency Control

**Atomic Task Claiming** uses SQL UPDATE with WHERE:

```sql
UPDATE tasks
SET status = 'claimed',
    owner = ?,
    claimedAt = ?
WHERE id = ?
  AND status = 'pending'
  AND owner IS NULL
```

If no rows are affected, another agent claimed the task first - return a conflict error.

**Task Dependency Resolution** uses a post-completion trigger:

```sql
-- After marking task as completed:
SELECT id FROM tasks WHERE blockedBy LIKE '%"completedTaskId"%';

-- Update each blocked task
UPDATE tasks SET blockedBy = json_remove(blockedBy, '$[idx]') WHERE id = ?;
UPDATE tasks SET status = 'pending' WHERE id = ? AND json_array_length(blockedBy) = 0;
```

### Mailbox Protocol

**Message Flow**:

1. Sender calls `SendMessage` tool
2. Gateway writes message to `~/.openclaw/teams/{team}/inbox/{recipient}/messages.jsonl`
3. On next inference, Gateway reads pending messages for the session
4. Messages are injected into context with XML tags:

```xml
<teammate-message teammate_id="researcher-1" type="message" summary="Found critical bug in auth module">
Found a critical security vulnerability in the auth module at src/auth/jwt.ts:42.
The token expiration check is bypassed when using admin claims.

I recommend we prioritize fixing this before deploying to production.
</teammate-message>
```

**Shutdown Protocol**:

```xml
<!-- Request -->
<teammate-message teammate_id="team-lead" type="shutdown_request" request_id="abc-123">
Task complete, wrapping up the session
</teammate-message>

<!-- Response -->
<teammate-message teammate_id="researcher-1" type="shutdown_response" request_id="abc-123" approve="true">
</teammate-message>

<!-- Reject -->
<teammate-message teammate_id="worker-1" type="shutdown_response" request_id="abc-123" approve="false" reason="Still working on task #3">
</teammate-message>
```

### Context Amnesia Prevention

Team state is injected as "ground truth" before each Team Lead inference:

```typescript
// In system prompt construction
if (session.teamId && session.teamRole === 'lead') {
  const teamState = await loadTeamState(session.teamId);
  systemPrompt += `\n\n=== TEAM STATE ===\n`;
  systemPrompt += `Team: ${teamState.name}\n`;
  systemPrompt += `Active Members: ${teamState.members.map(m => m.name).join(', ')}\n`;
  systemPrompt += `Pending Tasks: ${teamState.pendingTaskCount}\n`;
  systemPrompt += `====================\n`;
}
```

This ensures Team Lead always knows about its team and members, regardless of context compression.

## Design Documents

- [BDD Specifications](./bdd-specs.md) - Behavior scenarios and testing strategy
- [Architecture](./architecture.md) - System architecture and component details
- [Best Practices](./best-practices.md) - Security, performance, and code quality guidelines