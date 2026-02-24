# Task 006: Connection Pool Tests

**Phase:** 1 (Core Infrastructure)
**Status:** pending
**depends-on:** ["task-003-ledger.md"]

## Description

Create tests for connection pool that manages SQLite connections for concurrent agent sessions.

## BDD Scenario

```gherkin
Feature: Connection Pool Management
  As a developer
  I want efficient connection management
  So that concurrent agents can access the database

  # Feature 4: Concurrency Control scenarios
  Scenario: Connection pooling handles concurrent agents
    Given 10 concurrent agent sessions
    When each session needs database access
    Then connections are reused efficiently
    And no connection exhaustion occurs

  Scenario: Connection reuse within same session
    Given a session with multiple operations
    When operations share the same connection
    Then performance is optimized

  Scenario: WAL mode enables concurrent reads during writes
    Given SQLite is configured with WAL mode
    When a write transaction is in progress
    Then concurrent read queries return consistent data
```

## Files to Create

- `src/teams/pool.test.ts` - Connection pool tests

## Test Requirements

1. Test pool initialization
2. Test connection acquisition/release
3. Test concurrent access
4. Test connection reuse
5. Test pool limits

## Verification

Run tests: `pnpm test src/teams/pool.test.ts`

Ensure all tests fail (RED) before implementation.
