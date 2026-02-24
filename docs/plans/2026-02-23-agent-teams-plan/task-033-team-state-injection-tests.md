# Task 033: Team State Injection Tests

**Phase:** 5 (Integration & Verification)
**Status:** pending
**depends-on:** ["task-032-tool-registration.md"]

## Description

Create tests for team state injection to prevent context amnesia.

## BDD Scenario

```gherkin
Feature: Team State Injection
  As a team lead
  I want my team context persisted
  So that I remember my team after context compression

  # Feature 5: Team Lead Coordination scenarios (12-14)
  Scenario: Team lead state persists across context compression
    Given a team lead with active team
    When context is compressed
    Then team state is re-injected
    And team lead remembers team members

  Scenario: Team lead knows about team after compression
    Given team lead with members
    When context is rebuilt
    Then injected state includes member list
    And includes pending task count
```

## Files to Create

- `src/teams/state-injection.test.ts` - State injection tests (if not already existing)

## Test Requirements

1. Test team state injection format
2. Test member list inclusion
3. Test task count inclusion

## Verification

Run tests: `pnpm test src/teams/state-injection.test.ts`

Ensure all tests fail (RED) before implementation.
