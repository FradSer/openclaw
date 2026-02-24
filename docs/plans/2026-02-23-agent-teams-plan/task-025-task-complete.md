# Task 025: TaskComplete Tool Implementation

**Phase:** 3 (Task Management Tools)
**Status:** pending
**depends-on:** ["task-024-task-complete-tests.md"]

## Description

Implement TaskComplete tool with dependency resolution.

## BDD Scenario

```gherkin
Feature: TaskComplete Implementation
  As a team member
  I want to complete tasks
  So that dependents can start

  # Must pass all scenarios from Task 024
  Scenario: Mark task as completed
    Given I own a task
    When I complete it
    Then status is updated and dependents are unblocked
```

## Files to Create

- `src/agents/tools/teams/task-complete.ts` - TaskComplete tool

## Implementation Requirements

### Input Parameters

```typescript
{
  team_name: string; // Required: Team containing task
  task_id: string; // Required: Task ID to complete
}
```

### Completion Logic

1. Update task status to "completed"
2. Set completedAt timestamp
3. Query tasks with blockedBy containing completed task ID
4. Remove from blockedBy arrays
5. If blockedBy is empty, set status to "pending"

## Verification

Run tests: `pnpm test src/agents/tools/teams/task-complete.test.ts`

Ensure all tests pass (GREEN).
