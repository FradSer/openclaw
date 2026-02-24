# Task 018: TaskCreate Tool Tests

**Phase:** 3 (Task Management Tools)
**Status:** pending
**depends-on:** ["task-017-session-state.md"]

## Description

Create tests for TaskCreate tool including task creation, validation, and dependency management.

## BDD Scenario

```gherkin
Feature: Task Creation
  As a team member
  I want to create tasks
  So that work can be assigned and tracked

  # Feature 2: Task Management - 17 scenarios (1-5, 11-16)
  Scenario: Add a single task to the team
    Given a team exists with ID "project-team"
    When a user requests to create a task with subject "Implement login feature"
    Then a new task is created with unique ID
    And the task is stored in the team's ledger database
    And the tool returns the task ID in the response
    And the task has status "pending"

  Scenario: Add a task with active form
    Given a team exists with ID "project-team"
    When a user requests to create a task with active form "Implementing login feature"
    Then the task stores the active form text
    And the active form is displayed in UI spinners when task is in_progress
    And active form is optional and can be omitted

  Scenario: Add task with metadata
    Given a team exists with ID "project-team"
    When a user requests to create a task with metadata {"priority": "high", "estimate": "2d"}
    Then the task stores the metadata object
    And metadata fields are accessible for filtering and reporting
    And metadata is optional and can be omitted

  Scenario: Add task with dependencies
    Given a team exists with ID "project-team"
    And task with ID "task-123" exists in the team
    When a user requests to create a task that depends on "task-123"
    Then the new task stores "task-123" in dependsOn array
    And the new task's blockedBy array includes "task-123"
    And if "task-123" is completed, blockedBy is updated

  Scenario: Circular dependency detection and prevention
    Given task A depends on task B
    When a user requests to make task B depend on task A
    Then the tool rejects the request with circular dependency error
    And no changes are made to existing tasks
    And the error message indicates circular dependency detected
```

## Files to Create

- `src/agents/tools/teams/task-create.test.ts` - TaskCreate tests

## Test Requirements

1. Test successful task creation
2. Test active form handling
3. Test metadata storage
4. Test dependency validation
5. Test circular dependency detection

## Verification

Run tests: `pnpm test src/agents/tools/teams/task-create.test.ts`

Ensure all tests fail (RED) before implementation.
