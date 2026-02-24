# Task 012: TeammateSpawn Tool Tests

**Phase:** 2 (Team Lifecycle Tools)
**Status:** pending
**depends-on:** ["task-011-team-create.md"]

## Description

Create tests for TeammateSpawn tool that spawns new teammate agent sessions.

## BDD Scenario

```gherkin
Feature: Teammate Spawning
  As a team lead
  I want to spawn teammates
  So that I can coordinate multiple agents

  # Feature 5: Team Lead Coordination
  Scenario: Team lead spawns teammate
    Given an active team "project-team"
    And team lead session is active
    When team lead requests to spawn "researcher-1"
    Then a new teammate session is created
    And member is added to team roster
    And inbox directory is created for the member
```

## Files to Create

- `src/agents/tools/teams/teammate-spawn.test.ts` - TeammateSpawn tests

## Test Requirements

1. Test successful teammate spawn
2. Test member added to roster
3. Test inbox creation
4. Test invalid team name
5. Test duplicate member name

## Verification

Run tests: `pnpm test src/agents/tools/teams/teammate-spawn.test.ts`

Ensure all tests fail (RED) before implementation.
