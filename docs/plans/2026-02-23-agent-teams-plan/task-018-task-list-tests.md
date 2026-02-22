# Task 018: TaskList Tool Tests

**Phase:** 3 (Task Management Tools)
**Status:** pending
**depends-on**: ["task-017-task-create.md"]

## Description

Create tests for the TaskList tool that queries tasks from the team ledger with filtering options. Use test doubles for team operations and ledger interactions.

## Files to Create

- `src/agents/tools/teams/task-list.test.ts` - TaskList tool tests

## Test Requirements

### List All Tasks

1. Test lists all tasks in team
2. Test returns tasks sorted by createdAt (newest first)
3. Test includes all task fields in response

### Filter by Status

1. Test filters tasks by status
2. Test returns only matching status tasks
3. Test handles multiple status values

### Filter by Owner

1. Test filters tasks by owner
2. Test returns only tasks owned by specified session
3. Test returns undefined when no tasks match

### Include Completed

1. Test excludes completed tasks by default
2. Test includes completed tasks when requested
3. Test includes failed tasks by default

### Validation Errors

1. Test validates team name format
2. Test validates status enum values
3. Test handles empty team

### Mock Strategy

Mock `getTeamManager`:
- Track listTask calls and parameters
- Return mock task arrays
- Simulate empty results

## BDD Scenario References

- Feature 2: Task Management (Scenarios 4-5, 12)
  - Scenario 4: List all tasks in the team
  - Scenario 5: List only pending tasks
  - Scenario 12: List tasks blocked by dependencies

## Verification

Run tests: `pnpm test src/agents/tools/teams/task-list.test.ts`

Ensure all tests fail (RED) before implementation.