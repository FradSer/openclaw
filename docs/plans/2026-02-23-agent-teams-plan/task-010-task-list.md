# Task 010: task_list Tool

**Phase:** 2 (Tool Verification)
**Status:** complete
**depends-on:** []

## Description

Verify task_list tool queries tasks from the shared ledger with filtering options.

## Implementation Location

`src/agents/tools/teams/task-list.ts` (73 lines)

## BDD Scenario

```gherkin
Feature: task_list Tool
  As a team member
  I want to list available tasks
  So that I can find work to do

  Scenario: List all tasks
    Given multiple tasks exist in the team
    When I call task_list without filters
    Then all tasks are returned

  Scenario: Filter by status
    Given tasks with various statuses exist
    When I call task_list with status "pending"
    Then only pending tasks are returned

  Scenario: Filter by owner
    Given tasks owned by different agents
    When I call task_list with owner "researcher"
    Then only tasks owned by researcher are returned

  Scenario: Exclude completed tasks
    Given completed tasks exist
    When I call task_list with includeCompleted=false
    Then completed tasks are not included

  Scenario: Empty result for no matches
    Given no tasks match the filter
    When I call task_list with restrictive filters
    Then an empty array is returned
```

## Tool Schema

```typescript
{
  team_name: string;           // Required
  status?: string;             // Optional: Filter by status
  owner?: string;              // Optional: Filter by owner
  includeCompleted?: boolean;  // Optional: Default false
}
```

## Output

```typescript
{
  tasks: Array<{
    id: string;
    subject: string;
    description: string;
    status: string;
    owner?: string;
    dependsOn?: string[];
    blockedBy?: string[];
  }>;
}
```

## Verification

```bash
pnpm test src/agents/tools/teams/task-list.test.ts
```
