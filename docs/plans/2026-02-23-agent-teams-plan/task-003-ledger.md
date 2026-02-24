# Task 003: SQLite Ledger Implementation

**Phase:** 1 (Core Infrastructure)
**Status:** pending
**depends-on:** ["task-002-ledger-tests.md"]

## Description

Implement SQLite ledger operations with WAL mode, connection pooling, and atomic operations for task management.

## BDD Scenario

```gherkin
Feature: SQLite Ledger Implementation
  As a developer
  I want robust database operations
  So that team data is managed reliably

  # Must pass all scenarios from Task 002
  Scenario: WAL mode enables concurrent reads during writes
    Given SQLite is configured with WAL mode
    When a write transaction is in progress
    Then concurrent read queries return consistent data
```

## Files to Create

- `src/teams/ledger.ts` - Ledger implementation

## Implementation Requirements

### Database Schema

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

CREATE TABLE IF NOT EXISTS members (
  sessionKey TEXT PRIMARY KEY,
  agentId TEXT NOT NULL,
  name TEXT,
  role TEXT CHECK(role IN ('lead', 'member')),
  joinedAt INTEGER NOT NULL
);

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

### Key Methods

- `initialize(dbPath: string)` - Initialize database with WAL mode
- `createTask(task: Task)` - Insert new task
- `getTask(id: string)` - Get task by ID
- `listTasks(options: TaskListOptions)` - List tasks with filters
- `claimTask(taskId: string, owner: string)` - Atomic claim
- `completeTask(taskId: string)` - Mark complete and unblock dependents
- `addMember(member: TeamMember)` - Add team member
- `getMembers(teamId: string)` - Get all team members

### Concurrency

- Use `better-sqlite3` for synchronous operations
- Configure WAL mode: `PRAGMA journal_mode=WAL`
- Implement retry logic with exponential backoff
- Use atomic UPDATE for task claiming

## Verification

Run tests: `pnpm test src/teams/ledger.test.ts`

Ensure all tests pass (GREEN).
