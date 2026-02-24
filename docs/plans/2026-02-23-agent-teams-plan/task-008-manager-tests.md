# Task 008: Team Manager Tests

**Phase:** 1 (Core Infrastructure)
**Status:** pending
**depends-on:** ["task-005-storage.md", "task-007-connection-pool.md"]

## Description

Create tests for Team Manager that coordinates storage, ledger, and pool operations.

## BDD Scenario

```gherkin
Feature: Team Manager Coordination
  As a developer
  I want unified team operations
  So that team functionality works correctly

  # Feature 1: Team Lifecycle
  Scenario: Create a new team successfully
    Given a user requests to create a team named "new-feature-team"
    When the TeamManager creates the team
    Then the team directory is created
    And config is written to disk
    And ledger is initialized

  Scenario: Graceful team shutdown with no active members
    Given an active team "test-team" with no members
    When shutdown is requested
    Then team status changes to "shutdown"
    And cleanup is performed
```

## Files to Create

- `src/teams/manager.test.ts` - Manager tests

## Test Requirements

1. Test team creation workflow
2. Test team shutdown workflow
3. Test member management
4. Test task operations through manager

## Verification

Run tests: `pnpm test src/teams/manager.test.ts`

Ensure all tests fail (RED) before implementation.
