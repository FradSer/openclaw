# Task 014: TeamShutdown Tool Tests

**Phase:** 2 (Team Lifecycle Tools)
**Status:** pending
**depends-on:** ["task-013-teammate-spawn.md"]

## Description

Create tests for TeamShutdown tool including graceful shutdown with member approval.

## BDD Scenario

```gherkin
Feature: Team Shutdown
  As a team lead
  I want to shutdown teams gracefully
  So that work is saved and members are notified

  # Feature 1: Team Lifecycle - 11 scenarios (6-11)
  Scenario: Graceful team shutdown with no active members
    Given an active team "test-team" with no active members
    When shutdown is requested
    Then team status changes to "shutdown"
    And cleanup is performed

  Scenario: Graceful shutdown requests member approval
    Given an active team "test-team" with member "researcher-1"
    When team lead requests shutdown
    Then shutdown_request is sent to "researcher-1"
    And team lead waits for responses

  Scenario: Member approves shutdown request
    Given an active team "collaborative-team"
    And member "researcher-1" is active on the team
    When the team lead requests shutdown
    And member "researcher-1" receives the shutdown request
    And member "researcher-1" responds with approval
    Then member "researcher-1" terminates its process
    And member "researcher-1" sends a shutdown_response with approve: true
    And the team lead receives the approval confirmation

  Scenario: Member rejects shutdown with reason
    Given shutdown request was sent
    When member responds with rejection and reason
    Then approval is set to false
    And reason is included in response
    And team lead handles rejection

  Scenario: Team shutdown fails with active members
    Given team has members that reject shutdown
    When all responses are received
    Then shutdown is cancelled
    And team remains active

  Scenario: Team lead handles member going idle during shutdown
    Given shutdown is in progress
    When member goes idle
    Then team lead tracks the idle state
    And shutdown waits for member response
```

## Files to Create

- `src/agents/tools/teams/team-shutdown.test.ts` - TeamShutdown tests

## Test Requirements

1. Test shutdown with no members
2. Test shutdown approval flow
3. Test shutdown rejection handling
4. Test idle member handling
5. Test cleanup on success

## Verification

Run tests: `pnpm test src/agents/tools/teams/team-shutdown.test.ts`

Ensure all tests fail (RED) before implementation.
