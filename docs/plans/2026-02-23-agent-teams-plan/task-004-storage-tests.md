# Task 004: Team Storage Tests

**Phase:** 1 (Core Infrastructure)
**Status:** pending
**depends-on:** ["task-001-types.md"]

## Description

Create tests for team storage operations including directory creation, config file management, and team directory structure.

## BDD Scenario

```gherkin
Feature: Team Storage Operations
  As a developer
  I want reliable file-based team storage
  So that team configuration persists correctly

  # Feature 1: Team Lifecycle scenarios
  Scenario: Create a new team successfully
    Given a user requests to create a team named "new-feature-team"
    When the TeamCreate tool is invoked with valid parameters
    Then a new team directory is created at ~/.openclaw/teams/new-feature-team/
    And a config.json file is written with team metadata
    And a ledger.db SQLite database is initialized
    And the team lead is added as a member
    And the tool returns the team ID in the response

  Scenario: Attempt to create duplicate team
    Given a team named "existing-team" already exists
    When a user requests to create another team with name "existing-team"
    Then the tool rejects the request with conflict error
    And no changes are made to existing team

  Scenario: Attempt to create team with invalid name
    Given a user requests to create a team with name "invalid/name"
    When the TeamCreate tool is invoked
    Then the tool rejects the request with validation error
    And no team directory is created
```

## Files to Create

- `src/teams/storage.test.ts` - Storage operation tests

## Test Requirements

1. Test team directory creation
2. Test config file write/read
3. Test duplicate team detection
4. Test invalid name validation
5. Test directory structure

## Verification

Run tests: `pnpm test src/teams/storage.test.ts`

Ensure all tests fail (RED) before implementation.
