# Task 021: E2E Workflows

**Phase:** 4 (Quality Assurance)
**Status:** complete
**depends-on:** []

## Description

Verify end-to-end workflows work correctly.

## Implementation Location

`src/teams/e2e.test.ts`

## BDD Scenario

```gherkin
Feature: E2E Workflows
  As a user
  I want complete workflows to work
  So that teams function as designed

  Scenario: Complete team lifecycle
    Given I am a team lead
    When I create a team
    And I spawn teammates
    And we complete tasks
    And I shut down the team
    Then all resources are cleaned up

  Scenario: Parallel task execution
    Given a team with 3 teammates
    And 5 independent tasks exist
    When teammates claim tasks in parallel
    Then all 5 tasks are claimed
    And no conflicts occur

  Scenario: Dependency chain execution
    Given task A blocks B, B blocks C
    When A is completed
    Then B becomes available
    When B is completed
    Then C becomes available

  Scenario: Team communication flow
    Given researcher discovers an issue
    When researcher sends message to team-lead
    Then team-lead receives message in next inference
    And team-lead can respond

  Scenario: Graceful shutdown workflow
    Given a team is active
    When team_shutdown is called
    Then shutdown_request is broadcast
    When all members approve
    Then team is deleted
```

## Workflow Coverage

1. **Team Creation**: Create team, verify structure
2. **Member Management**: Spawn teammates, verify membership
3. **Task Distribution**: Create tasks, claim, complete
4. **Dependency Resolution**: Blocked tasks unlock correctly
5. **Messaging**: Direct and broadcast messages work
6. **Shutdown**: Graceful shutdown with approval

## Verification

```bash
pnpm test src/teams/e2e.test.ts
```
