# Task 002: SQLite Ledger Tests

**Phase:** 1 (Core Infrastructure)
**Status:** pending
**depends-on:** ["task-001-types.md"]

## Description

Create tests for the SQLite ledger operations including task CRUD, member management, and atomic operations. Use test doubles for SQLite to ensure isolation.

## BDD Scenario

```gherkin
Feature: SQLite Ledger Operations
  As a developer
  I want reliable database operations for task management
  So that team data persists correctly

  # Feature 4: Concurrency Control scenarios
  Scenario: WAL mode enables concurrent reads during writes
    Given SQLite is configured with WAL mode
    When a write transaction is in progress
    Then concurrent read queries return consistent data

  Scenario: Multiple readers access DB during single write
    Given a write transaction is executing
    When 3 concurrent readers query the database
    Then all readers complete successfully
    And all readers see the same data

  Scenario: Write operation blocks other writers
    Given SQLite with WAL mode
    When a write transaction is holding a lock
    Then another write attempt receives SQLITE_BUSY
    And the second writer retries successfully

  Scenario: Atomic task claiming prevents race conditions
    Given a pending task with ID 5
    And two idle members "agent-fast" and "agent-slow"
    When both members attempt to claim the task simultaneously
    Then only one member successfully claims the task
    And the other member receives a conflict error
    And the task has exactly one owner assigned

  Scenario: UPDATE with WHERE returns row count
    Given a pending task exists
    When I execute UPDATE with WHERE status='pending'
    Then the result includes affected row count

  Scenario: Zero rows affected equals task already claimed
    Given a task was already claimed by another agent
    When I attempt to claim it with atomic UPDATE
    Then zero rows are affected
    And I return conflict error to the caller

  Scenario: Transaction isolation level SERIALIZABLE for claim
    Given two agents attempting to claim simultaneously
    When both use SERIALIZABLE isolation
    Then only one transaction succeeds

  Scenario: Retry logic on SQLITE_BUSY error
    Given a database lock is held
    When I execute a write operation
    Then the operation retries up to 5 times
    And exponential backoff is applied between retries

  Scenario: Maximum retry attempts
    Given maximum retry attempts is set to 5
    When a database remains locked beyond 5 retries
    Then operation fails with appropriate error

  Scenario: Exponential backoff between retries
    Given retry attempts are needed
    Then backoff time doubles with each attempt
    And initial backoff is 10ms

  Scenario: Deadlock prevention with consistent ordering
    Given multiple transactions need multiple locks
    When locks are acquired in consistent order
    Then deadlocks are prevented

  Scenario: Transaction timeout
    Given a long-running transaction
    When timeout threshold is exceeded
    Then transaction is rolled back

  Scenario: Connection pooling handles concurrent agents
    Given 10 concurrent agent sessions
    When each session needs database access
    Then connections are reused efficiently
    And no connection exhaustion occurs

  Scenario: Connection reuse within same session
    Given a session with multiple operations
    When operations share the same connection
    Then performance is optimized
```

## Files to Create

- `src/teams/ledger.test.ts` - Ledger operation tests

## Test Requirements

1. Test WAL mode configuration
2. Test concurrent read/write operations
3. Test atomic task claiming
4. Test SQLITE_BUSY retry logic
5. Test connection pooling
6. Test transaction timeout

## Verification

Run tests: `pnpm test src/teams/ledger.test.ts`

Ensure all tests fail (RED) before implementation.
