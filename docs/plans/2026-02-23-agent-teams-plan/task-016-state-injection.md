# Task 016: Team State Injection

**Phase:** 3 (Integration Verification)
**Status:** complete
**depends-on:** []

## Description

Verify team state injection for context amnesia prevention.

## Implementation Location

`src/teams/state-injection.ts` (68 lines)

## BDD Scenario

```gherkin
Feature: Team State Injection
  As a team lead
  I want team state injected into my context
  So that I remember team status after context compression

  Scenario: Format team state for injection
    Given a team with members and tasks
    When formatTeamState is called
    Then output includes team name and status
    And includes member names and their statuses
    And includes task counts by status

  Scenario: Inject state for team lead
    Given I am a team lead
    When injectTeamState is called
    Then team state is prepended to system prompt
    And state is bounded by clear delimiters

  Scenario: Do not inject for regular members
    Given I am a regular team member
    When injectTeamState is called
    Then no state is injected
```

## State Output Format

```
=== TEAM STATE ===
Team: alpha-squad
Status: active
Members: researcher (working), tester (idle)
Pending Tasks: 3
In Progress: 1
Completed: 2
==================
```

## Key Functions

- `formatTeamState(teamState)` - Format state as text
- `injectTeamState(session, teamState)` - Inject into context

## Purpose

Prevents context amnesia for team leads:

- After context compression, lead still knows team composition
- Can make informed decisions about task distribution
- Understands current workload without re-querying

## Verification

```bash
pnpm test src/teams/state-injection.test.ts
```
