# Task 007: Connection Pool Implementation

**Phase:** 1 (Core Infrastructure)
**Status:** pending
**depends-on:** ["task-006-connection-pool-tests.md"]

## Description

Implement connection pool for managing SQLite database connections across concurrent agent sessions.

## BDD Scenario

```gherkin
Feature: Connection Pool Implementation
  As a developer
  I want connection pooling
  So that database access is efficient

  # Must pass all scenarios from Task 006
  Scenario: Connection pooling handles concurrent agents
    Given 10 concurrent agent sessions
    When each session needs database access
    Then connections are reused efficiently
```

## Files to Create

- `src/teams/pool.ts` - Connection pool implementation

## Implementation Requirements

### Key Methods

- `acquire(sessionKey: string)` - Get connection for session
- `release(sessionKey: string)` - Return connection to pool
- `getConnection(sessionKey: string)` - Get existing or create new

### Configuration

- Default pool size: 10 connections
- Connection timeout: 30 seconds
- Idle connection timeout: 5 minutes

## Verification

Run tests: `pnpm test src/teams/pool.test.ts`

Ensure all tests pass (GREEN).
