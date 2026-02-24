# Task 010: TeamCreate Tool Tests

**Phase:** 2 (Team Lifecycle Tools)
**Status:** pending
**depends-on:** ["task-009-manager.md"]

## Description

Create tests for TeamCreate tool including team creation, validation, and error handling.

## BDD Scenario

```gherkin
Feature: Team Creation Tool
  As a team lead
  I want to create teams
  So that I can coordinate multiple agents

  # Feature 1: Team Lifecycle - 11 scenarios
  Scenario: Create a new team successfully
    Given a user requests to create a team named "new-feature-team"
    When the TeamCreate tool is invoked with valid parameters
    Then a new team directory is created at ~/.openclaw/teams/new-feature-team/
    And a config.json file is written with team metadata
    And a ledger.db SQLite database is initialized
    And the team lead is added as a member
    And the tool returns the team ID in the response

  Scenario: Create team with custom agent type for team lead
    Given a user requests to create a team with agent type "research-specialist"
    When the TeamCreate tool is invoked with the custom agent type
    Then the team config stores "research-specialist" as the agentType
    And the team lead session is associated with this agent type
    And default agent type is used if none is specified

  Scenario: Create team with descriptive metadata
    Given a user requests to create a team with description "Implement payment processing feature"
    When the TeamCreate tool is invoked with the description
    Then the team config stores the description in the metadata
    And the description is omitted from config if not provided

  Scenario: Attempt to create team with invalid name
    Given a user requests to create a team with name "invalid/name"
    When the TeamCreate tool is invoked
    Then the tool rejects the request with validation error
    And no team directory is created
    And the error message indicates invalid name format

  Scenario: Attempt to create duplicate team
    Given a team named "existing-team" already exists
    When a user requests to create another team with name "existing-team"
    Then the tool rejects the request with conflict error
    And no changes are made to existing team
    And the error message indicates team already exists
```

## Files to Create

- `src/agents/tools/teams/team-create.test.ts` - TeamCreate tool tests

## Test Requirements

1. Test successful team creation with all parameters
2. Test custom agent type handling
3. Test description storage
4. Test invalid name validation
5. Test duplicate team detection
6. Test error handling

## Verification

Run tests: `pnpm test src/agents/tools/teams/team-create.test.ts`

Ensure all tests fail (RED) before implementation.
