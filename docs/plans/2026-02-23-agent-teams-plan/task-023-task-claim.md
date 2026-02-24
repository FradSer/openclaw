# Task 023: TaskClaim Tool Implementation

**Phase:** 3 (Task Management Tools)
**Status:** pending
**depends-on:** ["task-022-task-claim-tests.md"]

## Description

Implement TaskClaim tool with atomic operations to prevent race conditions.

## BDD Scenario

```gherkin
Feature: TaskClaim Implementation
  As a team member
  I want to claim tasks atomically
  So that no race conditions occur

  # Must pass all scenarios from Task 022
  Scenario: Atomic task claiming prevents race conditions
    Given a pending task
    When two members attempt to claim simultaneously
    Then only one succeeds
```

## Files to Create

- `src/agents/tools/teams/task-claim.ts` - TaskClaim tool

## Implementation Requirements

### Input Parameters

```typescript
{
  team_name: string; // Required: Team containing task
  task_id: string; // Required: Task ID to claim
}
```

### Atomic Claim SQL

```sql
UPDATE tasks
SET status = 'claimed',
    owner = ?,
    claimedAt = ?
WHERE id = ?
  AND status = 'pending'
  AND owner IS NULL
```

- Check affected rows
- If 0: task already claimed, return conflict error

## Verification

Run tests: `pnpm test src/agents/tools/teams/task-claim.test.ts`

Ensure all tests pass (GREEN).
