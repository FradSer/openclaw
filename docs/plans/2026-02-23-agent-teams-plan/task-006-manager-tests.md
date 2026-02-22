# Task 006: Team Manager Tests

**Phase:** 1 (Core Infrastructure)
**Status:** pending
**depends-on:** ["task-005-storage.md", "task-003-ledger.md"]

## Description

Create comprehensive tests for the TeamManager class which orchestrates team storage and ledger operations. Use test doubles for both file system and SQLite operations.

## Files to Create

- `src/teams/manager.test.ts` - Team manager tests

## Test Requirements

### Task Operations

1. Test creates a task and returns task ID
2. Test lists all tasks in a team
3. Test filters tasks by status
4. Test filters tasks by owner
5. Test claims an available task successfully
6. Test fails to claim already claimed task
7. Test marks task as in_progress
8. Test marks task as completed
9. Test marks task as failed
10. Test creates task with metadata

### Task Dependency Tests

1. Test creates task with dependencies
2. Test lists tasks blocked by dependencies
3. Test auto-unblocks tasks when dependency completes
4. Test detects circular dependencies and prevents creation
5. Test complex dependency chain resolution

### Member Operations

1. Test adds team lead as member
2. Test lists all team members
3. Test updates member lastActiveAt timestamp
4. Test queries member by session key
5. Test removes member from team

### Message Operations

1. Test stores message in SQLite
2. Test retrieves pending messages for a session
3. Test marks messages as delivered
4. Test clears delivered messages

### Mock Strategy

Mock both `node:fs/promises` and `node:sqlite`:
- File system mocks for config operations
- Database mocks for ledger operations
- Return consistent mock data
- Track operation order and parameters

## BDD Scenario References

- Feature 2: Task Management (Scenarios 1-17)
- Feature 1: Team Lifecycle (Scenarios 6, 10)

## Verification

Run tests: `pnpm test src/teams/manager.test.ts`

Ensure all tests fail (RED) before implementation.