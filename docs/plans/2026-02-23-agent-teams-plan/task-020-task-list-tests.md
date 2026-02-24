# Task 020: TaskList Tool Tests

**Phase:** 3 (Task Management Tools)
**Status:** pending
**depends-on:** ["task-019-task-create.md"]

## Description

Create tests for TaskList tool including filtering and status queries.

## BDD Scenario

```gherkin
Feature: Task Listing
  As a team member
  I want to list tasks
  So that I can see available work

  # Feature 2: Task Management scenarios (4-5)
  Scenario: List all tasks in the team
    Given a team with multiple tasks
    When a user requests to list all tasks
    Then all tasks are returned
    And each task includes subject, description, status, owner

  Scenario: List only pending tasks
    Given a team with tasks in various statuses
    When a user requests to list pending tasks
    Then only tasks with status "pending" are returned
    And completed tasks are excluded

  Scenario: List tasks blocked by dependencies
    Given a task that depends on incomplete tasks
    When listing tasks
    Then blocked tasks show blockedBy array
```

## Files to Create

- `src/agents/tools/teams/task-list.test.ts` - TaskList tests

## Test Requirements

1. Test list all tasks
2. Test filter by status
3. Test filter by owner
4. Test dependency display

## Verification

Run tests: `pnpm test src/agents/tools/teams/task-list.test.ts`

Ensure all tests fail (RED) before implementation.
