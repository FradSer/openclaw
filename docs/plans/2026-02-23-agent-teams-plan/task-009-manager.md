# Task 009: Team Manager Implementation

**Phase:** 1 (Core Infrastructure)
**Status:** pending
**depends-on**: ["task-008-manager-tests.md"]

## Description

Implement Team Manager that coordinates all team-related operations.

## BDD Scenario

```gherkin
Feature: Team Manager Implementation
  As a developer
  I want unified team management
  So that all operations work together

  # Must pass all scenarios from Task 008
  Scenario: Create a new team successfully
    Given a user requests to create a team
    When TeamManager.createTeam is called
    Then all infrastructure is set up correctly
```

## Files to Create

- `src/teams/manager.ts` - Manager implementation

## Implementation Requirements

### Key Methods

- `createTeam(config: CreateTeamParams)` - Create new team
- `getTeam(teamName: string)` - Get team config
- `listTeams()` - List all teams
- `shutdownTeam(teamName: string)` - Shutdown team
- `deleteTeam(teamName: string)` - Delete team

### Integration

- Coordinate storage, ledger, and pool
- Handle errors gracefully
- Maintain consistency across operations

## Verification

Run tests: `pnpm test src/teams/manager.test.ts`

Ensure all tests pass (GREEN).
