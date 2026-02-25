# Task 009: task_create Tool

**Phase:** 2 (Tool Verification)
**Status:** complete
**depends-on:** []

## Description

Verify task_create tool adds tasks to the shared ledger with optional dependencies.

## Implementation Location

`src/agents/tools/teams/task-create.ts` (67 lines)

## BDD Scenario

```gherkin
Feature: task_create Tool
  As a team member
  I want to create tasks in the shared ledger
  So that work can be distributed

  Scenario: Create task with basic info
    Given a team "alpha-squad" exists
    When I call task_create with subject and description
    Then a task is added to the ledger
    And task has status "pending"
    And task has a unique UUID

  Scenario: Create task with dependencies
    When I call task_create with dependsOn containing existing task IDs
    Then the task's blockedBy is populated
    And task cannot be claimed until dependencies complete

  Scenario: Create task with metadata
    When I call task_create with metadata object
    Then the metadata is stored and retrievable

  Scenario: Create task with active form
    When I call task_create with activeForm "Reviewing authentication code"
    Then the activeForm is stored for progress display
```

## Tool Schema

```typescript
{
  team_name: string;     // Required
  subject: string;       // Required: Max 200 chars
  description: string;   // Required: Max 10000 chars
  activeForm?: string;   // Optional: Max 100 chars
  dependsOn?: string[];  // Optional: Task ID dependencies
  metadata?: object;     // Optional
}
```

## Output

```typescript
{
  taskId: string;
  status: "pending" | "blocked";
}
```

## Verification

```bash
pnpm test src/agents/tools/teams/task-create.test.ts
```
