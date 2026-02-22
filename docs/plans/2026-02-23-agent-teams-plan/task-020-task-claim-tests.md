# Task 020: TaskClaim Tool Tests

**Phase:** 3 (Task Management Tools)
**Status:** pending
**depends-on**: ["task-019-task-list.md"]

## Description

Create tests for the TaskClaim tool that atomically claims tasks from the team ledger. Include tests for race condition prevention and retry logic.

## Files to Create

- `src/agents/tools/teams/task-claim.test.ts` - TaskClaim tool tests

## Test Requirements

### Successful Claim

1. Test claims available task successfully
2. Test updates task status to 'claimed'
3. Test sets task owner to session key
4. Test sets claimedAt timestamp
5. Test returns success response

### Active Form Update

1. Test updates active form when claiming
2. Test stores active form in ledger

### Failed Claims

1. Test fails to claim already claimed task
2. Test fails to claim non-existent task
3. Test returns conflict error for race condition

### Atomic Claiming

1. Test prevents race conditions with parallel claims
2. Test only one claim succeeds for same task
3. Test second claim returns conflict error

### Retry Logic

1. Test retries on SQLITE_BUSY
2. Test uses exponential backoff between retries
3. Test gives up after max attempts

### Validation Errors

1. Test validates team name format
2. Test validates task ID format
3. Test validates session key

### Mock Strategy

Mock `getTeamManager`:
- Track claimTask calls and parameters
- Return mock claim results
- Simulate SQLITE_BUSY for retry testing

## BDD Scenario References

- Feature 2: Task Management (Scenarios 6-8)
- Feature 4: Concurrency Control (Scenarios 9-12)
  - Scenario 9: Atomic task claiming prevents race conditions
  - Scenario 10: UPDATE with WHERE returns row count
  - Scenario 11: Zero rows affected = task already claimed

## Verification

Run tests: `pnpm test src/agents/tools/teams/task-claim.test.ts`

Ensure all tests fail (RED) before implementation.