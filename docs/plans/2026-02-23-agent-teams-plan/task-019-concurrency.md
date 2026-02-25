# Task 019: Concurrency Tests

**Phase:** 4 (Quality Assurance)
**Status:** complete
**depends-on:** []

## Description

Verify concurrent access works correctly with SQLite WAL mode.

## Implementation Location

`src/teams/performance.test.ts`

## BDD Scenario

```gherkin
Feature: Concurrency
  As a developer
  I want concurrent access to work correctly
  So that multiple agents can work simultaneously

  Scenario: Handle concurrent task claims
    Given a pending task "T1" exists
    When 10 teammates attempt to claim "T1" simultaneously
    Then exactly one teammate successfully claims the task
    And 9 teammates receive "already claimed" error

  Scenario: Handle SQLite BUSY errors
    Given the database is locked by another transaction
    When a teammate attempts to update a task
    Then SQLITE_BUSY error is caught
    And operation is retried with exponential backoff
    And operation succeeds on retry

  Scenario: Handle rapid message writing
    Given 10 messages are written to same inbox simultaneously
    When all writes complete
    Then all 10 messages are present in the inbox
    And no data corruption occurs

  Scenario: Resolve dependency graphs without deadlocks
    Given task A depends on B, B depends on C
    When C completes, then B, then A
    Then each becomes available in order
    And no deadlock occurs
```

## Concurrency Mechanisms

### WAL Mode

```typescript
db.exec("PRAGMA journal_mode = WAL");
db.exec("PRAGMA wal_autocheckpoint = 1000");
```

### Exponential Backoff

```typescript
async function withRetry<T>(fn: () => T, maxAttempts = 5): Promise<T> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return fn();
    } catch (err: any) {
      if (err.code === "SQLITE_BUSY") {
        await sleep(50 * Math.pow(2, attempt));
        continue;
      }
      throw err;
    }
  }
  throw new Error("Database locked");
}
```

### Atomic Claiming

```sql
UPDATE tasks
SET status = 'in_progress', owner = ?
WHERE id = ? AND status = 'pending' AND owner IS NULL
```

## Verification

```bash
pnpm test src/teams/performance.test.ts
```
