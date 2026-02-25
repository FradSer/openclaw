# Task 011: task_claim Tool

**Phase:** 2 (Tool Verification)
**Status:** complete
**depends-on:** []

## Description

Verify task_claim tool atomically claims a task for the calling agent.

## Implementation Location

`src/agents/tools/teams/task-claim.ts` (56 lines)

## BDD Scenario

```gherkin
Feature: task_claim Tool
  As a team member
  I want to atomically claim a task
  So that no other agent claims the same task

  Scenario: Claim pending task successfully
    Given a pending task "T1" exists with no owner
    When I call task_claim for "T1"
    Then task status becomes "in_progress"
    And task owner is set to my agent name

  Scenario: Reject claiming already claimed task
    Given a task "T1" is owned by "agent-a"
    When I call task_claim for "T1"
    Then the operation fails with "Task already claimed"

  Scenario: Reject claiming blocked task
    Given a task "T2" has unmet dependencies
    When I call task_claim for "T2"
    Then the operation fails with "Task has unmet dependencies"
    And blockedBy array is included in response

  Scenario: Reject claiming completed task
    Given a task "T3" is completed
    When I call task_claim for "T3"
    Then the operation fails with "Task is completed"
```

## Tool Schema

```typescript
{
  team_name: string; // Required
  task_id: string; // Required: Task to claim
}
```

## Output

```typescript
{
  success: boolean;
  taskId: string;
  reason?: string;       // If failed
  blockedBy?: string[];  // If blocked
}
```

## Atomic Claiming

Uses SQL UPDATE with WHERE clause:

```sql
UPDATE tasks
SET status = 'in_progress', owner = ?, claimedAt = ?
WHERE id = ? AND status = 'pending' AND (owner IS NULL OR owner = '')
```

## Verification

```bash
pnpm test src/agents/tools/teams/task-claim.test.ts
```
