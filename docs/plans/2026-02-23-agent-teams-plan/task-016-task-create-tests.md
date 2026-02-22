# Task 016: TaskCreate Tool Tests

**Phase:** 3 (Task Management Tools)
**Status:** pending
**depends-on**: ["task-015-session-state.md"]

## Description

Create tests for the TaskCreate tool that adds tasks to the team ledger. Use test doubles for team operations and ledger interactions.

## Files to Create

- `src/agents/tools/teams/task-create.test.ts` - TaskCreate tool tests

## Test Requirements

### Basic Task Creation

1. Test creates task with required parameters
2. Test returns task ID in response
3. Test stores task in ledger
4. Test sets initial status to 'pending'

### Active Form

1. Test creates task with active form
2. Test stores active form in ledger

### Metadata

1. Test creates task with metadata
2. Test stores metadata as JSON in ledger
3. Test handles complex metadata structures

### Dependencies

1. Test creates task with dependencies
2. Test computes blockedBy from existing tasks
3. Test stores dependsOn in ledger
4. Test stores blockedBy in ledger

### Validation Errors

1. Test validates team name format
2. Test validates subject length (max 200 chars)
3. Test validates description length (max 10000 chars)
4. Test rejects empty subject
5. Test rejects empty description

### Circular Dependency Detection

1. Test detects circular dependencies
2. Test prevents creation with circular dependency
3. Test returns error describing circular dependency

### Mock Strategy

Mock `getTeamManager`:
- Track createTask calls and parameters
- Return mock task IDs
- Simulate errors for validation failures

## BDD Scenario References

- Feature 2: Task Management (Scenarios 1-3, 11, 15)
  - Scenario 1: Add a single task to the team
  - Scenario 2: Add a task with active form
  - Scenario 3: Add task with metadata
  - Scenario 11: Add task with dependencies
  - Scenario 15: Circular dependency detection and prevention

## Verification

Run tests: `pnpm test src/agents/tools/teams/task-create.test.ts`

Ensure all tests fail (RED) before implementation.