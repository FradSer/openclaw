# Task 036: E2E Team Workflow Tests

**Phase:** 5 (Integration & Testing)
**Status:** pending
**depends-on**: ["task-035-team-lead-tests.md"]

## Description

Create end-to-end workflow tests that validate complete team operations including creation, task distribution, coordination, and shutdown.

## Files to Create

- `tests/e2e/team-workflows.test.ts` - E2E workflow tests

## Test Requirements

### Complete Workflow Tests

1. **Complete team lifecycle workflow**
   - Create team
   - Spawn 3 teammates
   - Add 10 tasks with dependencies
   - Claim and complete all tasks
   - Shutdown team
   - Verify cleanup

2. **Complex dependency resolution workflow**
   - Create task chain: A -> B -> C -> D -> E
   - Complete in order
   - Verify unblocking at each step
   - Verify final task becomes available

3. **Concurrent task claiming workflow**
   - Create 5 tasks
   - Have 3 members claim simultaneously
   - Verify atomic claiming
   - Verify no double assignments

4. **Communication workflow**
   - Team lead sends directives via messages
   - Members respond with status updates
   - Verify message delivery and context injection

5. **Error recovery workflow**
   - Member fails during task
   - Team lead spawns replacement
   - Task is reassigned and completed
   - Verify team continues

6. **Context compression workflow**
   - Create team with many messages
   - Trigger context compression
   - Verify team state persists
   - Verify lead still knows team info

### Test Implementation

Use actual database operations (no mocks) for true end-to-end validation. Clean up test teams after each test.

## Verification

Run E2E tests: `pnpm test tests/e2e/team-workflows.test.ts`

Ensure all workflows complete successfully.