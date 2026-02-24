# Task 022: TaskClaim Tool Tests

**Phase:** 3 (Task Management Tools)
**Status:** pending
**depends-on:** ["task-021-task-list.md"]

## Description

Create tests for TaskClaim tool with atomic operations and race condition prevention.

## BDD Scenario

```gherkin
Feature: Task Claiming
  As a team member
  I want to claim tasks
  So that work is assigned

  # Feature 2: Task Management scenarios (6-9)
  # Feature 4: Concurrency Control scenarios (9-12)
  Scenario: Claim an available task
    Given a pending task "task-1"
    And no member has claimed it
    When I attempt to claim "task-1"
    Then my session key is set as owner
    And task status changes to "claimed"
    And claimedAt timestamp is set

  Scenario: Claim task updates active form
    Given a pending task with activeForm "Implementing feature X"
    When I claim the task
    Then the task owner is updated
    And status is "claimed"

  Scenario: Attempt to claim already claimed task
    Given task "task-1" is claimed by "agent-001"
    When I attempt to claim "task-1"
    Then the claim fails
    And I receive conflict error
    And task owner remains "agent-001"

  Scenario: Atomic task claiming prevents race conditions
    Given a pending task with ID 5
    And two idle members "agent-fast" and "agent-slow"
    When both members attempt to claim the task simultaneously
    Then only one member successfully claims the task
    And the other member receives a conflict error
    And the task has exactly one owner assigned
    And no partial ownership states exist
```

## Files to Create

- `src/agents/tools/teams/task-claim.test.ts` - TaskClaim tests

## Test Requirements

1. Test successful claim
2. Test already claimed rejection
3. Test atomic operation
4. Test race condition prevention

## Verification

Run tests: `pnpm test src/agents/tools/teams/task-claim.test.ts`

Ensure all tests fail (RED) before implementation.
