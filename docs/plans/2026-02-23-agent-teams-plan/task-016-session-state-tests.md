# Task 016: Session State Tests

**Phase:** 2 (Team Lifecycle Tools)
**Status:** pending
**depends-on:** ["task-015-team-shutdown.md"]

## Description

Create tests for session state integration that tracks team membership for each session.

## BDD Scenario

```gherkin
Feature: Session State Integration
  As a developer
  I want sessions to track team membership
  So that agents know their team context

  # Feature 5: Team Lead Coordination
  Scenario: Session tracks team membership
    Given a session is created for a teammate
    When the session joins a team
    Then session stores teamId and teamRole
    And session can query team context
```

## Files to Create

- `src/teams/state-injection.test.ts` - Session state tests

## Test Requirements

1. Test session team membership tracking
2. Test team role storage
3. Test team context retrieval

## Verification

Run tests: `pnpm test src/teams/state-injection.test.ts`

Ensure all tests fail (RED) before implementation.
