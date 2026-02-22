# Task 002: SQLite Ledger Initialization Tests

**Phase:** 1 (Core Infrastructure)
**Status:** pending
**depends-on:** ["task-001-types.md"]

## Description

Create comprehensive tests for SQLite ledger initialization, schema creation, and WAL mode configuration. Use test doubles for SQLite operations to ensure tests are fast and deterministic.

## Files to Create

- `src/teams/ledger.test.ts` - Ledger initialization tests

## Test Requirements

### Schema Creation Tests

Test that the database schema is correctly initialized:

1. Test creates tasks table with all columns and constraints
2. Test creates members table with all columns and constraints
3. Test creates messages table with all columns and constraints
4. Test creates indexes on tasks (status, owner, createdAt)
5. Test that schema is idempotent (running twice doesn't fail)

### WAL Mode Tests

Test WAL mode configuration:

1. Test WAL mode is enabled on database open
2. Test wal_autocheckpoint pragma is configured
3. Test database is in WAL mode after initialization

### Connection Tests

Test database connection lifecycle:

1. Test database connection opens successfully
2. Test database connection closes cleanly
3. Test database file is created in correct location

### Mock Strategy

Use Vitest vi.mock() or create a mock database wrapper:

- Mock `node:sqlite` DatabaseSync class
- Track SQL statements executed
- Return mock data for queries
- Track transaction state

## BDD Scenario References

- Feature 2: Task Management (Scenarios 1-17)
- Feature 4: Concurrency Control (Scenarios 1-6)

## Verification

Run tests: `pnpm test src/teams/ledger.test.ts`

Ensure all tests fail (RED) before implementation.