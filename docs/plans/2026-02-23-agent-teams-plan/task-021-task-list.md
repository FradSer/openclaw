# Task 021: TaskList Tool Implementation

**Phase:** 3 (Task Management Tools)
**Status:** pending
**depends-on:** ["task-020-task-list-tests.md"]

## Description

Implement TaskList tool for querying team tasks.

## BDD Scenario

```gherkin
Feature: TaskList Implementation
  As a team member
  I want to list tasks
  So that I can see work

  # Must pass all scenarios from Task 020
  Scenario: List all tasks
    Given a team with tasks
    When listing is requested
    Then tasks are returned
```

## Files to Create

- `src/agents/tools/teams/task-list.ts` - TaskList tool

## Implementation Requirements

### Input Parameters

```typescript
{
  team_name: string;           // Required: Team to query
  status?: string;             // Optional: Filter by status
  owner?: string;              // Optional: Filter by owner
  includeCompleted?: boolean;  // Optional: Include completed tasks
}
```

### Output

- Array of Task objects
- Filtered by provided options

## Verification

Run tests: `pnpm test src/agents/tools/teams/task-list.test.ts`

Ensure all tests pass (GREEN).
