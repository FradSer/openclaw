# Task 024: TaskComplete Tool Tests

**Phase:** 3 (Task Management Tools)
**Status:** pending
**depends-on:** ["task-023-task-claim.md"]

## Description

Create tests for TaskComplete tool including dependency resolution and auto-unblock.

## BDD Scenario

```gherkin
Feature: Task Completion
  As a team member
  I want to complete tasks
  So that dependent tasks can start

  # Feature 2: Task Management scenarios (10-16)
  Scenario: Mark task as completed
    Given I own task "task-1"
    When I complete "task-1"
    Then status changes to "completed"
    And completedAt timestamp is set
    And owner remains set

  Scenario: Auto-unblock tasks when dependency completes
    Given task B depends on task A
    And task A is pending
    When task A is completed
    Then task B's blockedBy is updated
    And if no other dependencies, status changes to "pending"

  Scenario: Complex dependency chain resolution
    Given task C depends on B, B depends on A
    When task A completes
    Then B is unblocked
    When B completes
    Then C is unblocked

  Scenario: Task completion removes from blockedBy of dependents
    Given task A is blocked by B and C
    When B completes
    Then A's blockedBy no longer includes B
```

## Files to Create

- `src/agents/tools/teams/task-complete.test.ts` - TaskComplete tests

## Test Requirements

1. Test successful completion
2. Test dependency unblocking
3. Test complex chains
4. Test blockedBy updates

## Verification

Run tests: `pnpm test src/agents/tools/teams/task-complete.test.ts`

Ensure all tests fail (RED) before implementation.
