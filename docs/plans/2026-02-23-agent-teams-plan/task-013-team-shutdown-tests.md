# Task 013: TeamShutdown Tool Tests

**Phase:** 2 (Team Lifecycle Tools)
**Status:** pending
**depends-on**: ["task-012-teammate-spawn.md"]

## Description

Create tests for the TeamShutdown tool that initiates graceful team shutdown with member approval. Use test doubles for team operations and message delivery.

## Files to Create

- `src/agents/tools/teams/team-shutdown.test.ts` - TeamShutdown tool tests

## Test Requirements

### Shutdown with No Active Members

1. Test shuts down team with no active members
2. Test updates team status to 'shutdown'
3. Test deletes team directory
4. Test returns success response

### Shutdown Request Protocol

1. Test sends shutdown_request to all members
2. Test waits for member approvals
3. Test completes shutdown after all approvals
4. Test fails shutdown if any member rejects

### Member Approval

1. Test processes member approval via shutdown_response
2. Test tracks pending approvals
3. Test completes shutdown when all members approve

### Member Rejection

1. Test handles member rejection with reason
2. Test returns rejection reason to caller
3. Test does not delete team on rejection

### Validation Errors

1. Test validates team name format
2. Test rejects shutdown for non-existent team
3. Test rejects shutdown for already shutdown team

### Mock Strategy

Mock `getTeamManager`, team state queries, and message operations:
- Track shutdown requests sent
- Track member approvals
- Simulate rejections for error cases

## BDD Scenario References

- Feature 1: Team Lifecycle (Scenarios 6-11)
  - Scenario 6: Graceful team shutdown with no active members
  - Scenario 7: Graceful shutdown requests member approval
  - Scenario 8: Member approves shutdown request
  - Scenario 9: Member rejects shutdown with reason
  - Scenario 10: Team shutdown fails with active members

## Verification

Run tests: `pnpm test src/agents/tools/teams/team-shutdown.test.ts`

Ensure all tests fail (RED) before implementation.