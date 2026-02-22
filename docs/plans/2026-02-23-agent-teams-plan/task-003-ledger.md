# Task 003: SQLite Ledger Implementation

**Phase:** 1 (Core Infrastructure)
**Status:** pending
**depends-on:** ["task-002-ledger-tests.md"]

## Description

Implement the SQLite ledger class with schema initialization, WAL mode configuration, and connection management. This provides the database foundation for task and member storage.

## Files to Create

- `src/teams/ledger.ts` - Ledger class implementation

## Implementation Requirements

### Ledger Class

Create a `TeamLedger` class with:

1. **Constructor**: `constructor(teamName: string, stateDir: string)`
   - Validates team name format (alphanumeric, hyphen, underscore, 1-50 chars)
   - Creates team directory if it doesn't exist
   - Opens database in WAL mode
   - Initializes schema

2. **openDatabase()**: Private method
   - Uses `node:sqlite` DatabaseSync
   - Opens database at `{stateDir}/teams/{teamName}/ledger.db`
   - Configures WAL mode: `{ mode: 'wal' }`
   - Sets wal_autocheckpoint to 1000 pages

3. **ensureSchema()**: Private method
   - Creates tasks table with all columns and CHECK constraints
   - Creates members table with all columns
   - Creates messages table with all columns
   - Creates indexes on tasks table (status, owner, createdAt)
   - Uses CREATE TABLE IF NOT EXISTS for idempotency

### SQL Schema

Tasks table:
```sql
CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  activeForm TEXT,
  status TEXT NOT NULL CHECK(status IN ('pending', 'claimed', 'in_progress', 'completed', 'failed')),
  owner TEXT,
  dependsOn TEXT,
  blockedBy TEXT,
  metadata TEXT,
  createdAt INTEGER NOT NULL,
  claimedAt INTEGER,
  completedAt INTEGER
);

CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_owner ON tasks(owner);
CREATE INDEX IF NOT EXISTS idx_tasks_created ON tasks(createdAt);
```

Members table:
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

Messages table:
```sql
CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  fromSession TEXT NOT NULL,
  toSession TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('message', 'broadcast', 'shutdown_request', 'shutdown_response', 'idle')),
  content TEXT NOT NULL,
  summary TEXT,
  requestId TEXT,
  approve INTEGER,
  reason TEXT,
  createdAt INTEGER NOT NULL,
  delivered INTEGER DEFAULT 0
);
```

### Close Method

Implement `close()` method to properly close database connection.

## Constraints

- Use synchronous DatabaseSync for consistency
- All file paths must use path.join() for cross-platform compatibility
- Directory creation should use fs.mkdir with recursive: true

## Verification

Run tests: `pnpm test src/teams/ledger.test.ts`

Ensure all tests pass (GREEN).