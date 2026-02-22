# Task 022: TaskComplete Tool Tests

**Phase:** 3 (Task Management Tools)
**Status:** pending
**depends-on**: ["task-021-task-claim.md"]

## Description

Create tests for the TaskComplete tool that marks tasks as completed and unblocks dependent tasks. Use test doubles for team operations and ledger interactions.

## Files to Create

- `src/agents/tools/teams/task-complete.test.ts` - TaskComplete tool tests

## Test Requirements

### Successful Completion

1. Test marks task as completed successfully
2. Test updates task status to 'completed'
3. Test sets completedAt timestamp
4. Test verifies task ownership before completion

### Dependency Unblocking

1. Test finds tasks blocked by completed task
2. Test removes task from blockedBy of dependents
3. Test updates dependent status to 'pending' if no remaining blocks
4. Test handles multiple dependent tasks

### Complex Dependency Chain

1. Test resolves chain of dependencies
2. Test unblocks tasks at multiple levels
3. Test handles diamond dependency pattern

### Failed Completion

1. Test fails to complete task owned by another
2. Test fails to complete already completed task
3. Test fails to complete non-existent task

### Validation Errors

1. Test validates team name format
2. Test validates task ID format

### Mock Strategy

Mock `getTeamManager`:
- Track completeTask calls and parameters
- Return mock completion results
- Track unblocked tasks

## BDD Scenario References

- Feature 2: Task Management (Scenarios 10, 13-14, 16)
  - Scenario 10: Mark task as completed
  - Scenario 13: Auto-unblock tasks when dependency completes
  - Scenario 14: Complex dependency chain resolution
  - Scenario 16: Task completion removes from blockedBy of dependents

## Verification

Run tests: `pnpm test src/agents/tools/teams/task-complete.test.ts`

Ensure all tests fail (RED) before implementation.