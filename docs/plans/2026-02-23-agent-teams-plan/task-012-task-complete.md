# Task 012: task_complete Tool

**Phase:** 2 (Tool Verification)
**Status:** complete
**depends-on:** []

## Description

Verify task_complete tool marks a task as completed and auto-unblocks dependent tasks.

## Implementation Location

`src/agents/tools/teams/task-complete.ts` (49 lines)

## BDD Scenario

```gherkin
Feature: task_complete Tool
  As a team member
  I want to mark my tasks as completed
  So that dependent tasks become available

  Scenario: Complete task successfully
    Given I own task "T1" with status "in_progress"
    When I call task_complete for "T1"
    Then task status becomes "completed"
    And completedAt timestamp is set

  Scenario: Auto-unblock dependent tasks
    Given task "T1" blocks task "T2"
    And task "T2" has blockedBy containing "T1"
    When I complete task "T1"
    Then "T2"'s blockedBy no longer contains "T1"
    And "T2" becomes available for claiming

  Scenario: Reject completing unclaimed task
    Given task "T3" has status "pending"
    When I call task_complete for "T3"
    Then the operation fails with "Task not claimed"

  Scenario: Reject completing non-existent task
    When I call task_complete for non-existent task
    Then the operation fails with "Task not found"
```

## Tool Schema

```typescript
{
  team_name: string; // Required
  task_id: string; // Required: Task to complete
}
```

## Output

```typescript
{
  success: boolean;
  taskId: string;
  unblockedTasks?: string[];  // Tasks that became available
}
```

## Auto-Unlock Logic

1. Mark task as completed
2. Find all tasks in its `blocks` array
3. Remove completed task ID from their `blockedBy` arrays
4. If `blockedBy` becomes empty, task is claimable

## Verification

```bash
pnpm test src/agents/tools/teams/task-complete.test.ts
```
