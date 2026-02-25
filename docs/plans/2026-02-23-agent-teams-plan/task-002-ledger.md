# Task 002: SQLite Ledger

**Phase:** 1 (Core Infrastructure)
**Status:** complete
**depends-on:** []

## Description

Verify SQLite ledger implementation with WAL mode for concurrent access and schema management.

## Implementation Location

`src/teams/ledger.ts` (129 lines)

## BDD Scenario

```gherkin
Feature: SQLite Ledger
  As a developer
  I want a SQLite database with WAL mode
  So that multiple processes can access team state concurrently

  Scenario: Database opens with WAL mode
    Given a TeamLedger instance is created
    When the database is opened
    Then journal_mode is set to WAL
    And wal_autocheckpoint is configured

  Scenario: Tasks table has correct schema
    Given the database is open
    When I query the tasks table schema
    Then it has all required columns with correct types
    And CHECK constraints enforce valid status values
    And indexes exist on status, owner, createdAt

  Scenario: Members table has correct schema
    Given the database is open
    When I query the members table schema
    Then it has sessionKey as primary key
    And role is constrained to 'lead' or 'member'

  Scenario: Messages table has correct schema
    Given the database is open
    When I query the messages table schema
    Then it has all required columns for team messaging
    And type is constrained to valid message types
```

## Schema Definition

### Tasks Table

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
  blocks TEXT,
  metadata TEXT,
  createdAt INTEGER NOT NULL,
  claimedAt INTEGER,
  completedAt INTEGER
)
```

### Indexes

- `idx_tasks_status` ON tasks(status)
- `idx_tasks_owner` ON tasks(owner)
- `idx_tasks_created` ON tasks(createdAt)

## Key Methods

- `openDatabase()` - Open with WAL mode
- `getDb()` - Get database instance
- `isOpen()` - Check connection state
- `close()` - Close connection

## WAL Configuration

```typescript
db.exec("PRAGMA journal_mode = WAL");
db.exec("PRAGMA wal_autocheckpoint = 1000");
```

## Verification

```bash
pnpm test src/teams/ledger.test.ts
```
