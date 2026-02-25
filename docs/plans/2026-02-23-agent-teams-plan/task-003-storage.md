# Task 003: Team Storage

**Phase:** 1 (Core Infrastructure)
**Status:** complete
**depends-on:** []

## Description

Verify filesystem operations for team directory management and configuration persistence.

## Implementation Location

`src/teams/storage.ts` (136 lines)

## BDD Scenario

```gherkin
Feature: Team Storage
  As a developer
  I want filesystem operations for team management
  So that team state persists across restarts

  Scenario: Create team directory structure
    Given a team name "alpha-squad"
    When createTeamDirectory is called
    Then ~/.openclaw/teams/alpha-squad/ directory exists
    And config.json file is created

  Scenario: Validate team name format
    Given a team name
    When validateTeamNameOrThrow is called
    Then names matching /^[a-z0-9-]{1,50}$/ pass
    And invalid names throw descriptive errors

  Scenario: Write and read team config
    Given a team directory exists
    When writeTeamConfig is called with config object
    Then config.json contains the serialized config
    And readTeamConfig returns the same object

  Scenario: Check team directory exists
    Given a team "existing-team" exists
    When teamDirectoryExists is called
    Then it returns true
    And for non-existent teams it returns false
```

## Key Functions

- `createTeamDirectory(stateDir, teamName)` - Create team directory
- `teamDirectoryExists(stateDir, teamName)` - Check existence
- `validateTeamNameOrThrow(name)` - Validate team name format
- `writeTeamConfig(stateDir, teamName, config)` - Write config.json
- `readTeamConfig(stateDir, teamName)` - Read config.json
- `getTeamConfigPath(stateDir, teamName)` - Get config path

## Team Name Validation

Valid names:

- `alpha-squad` - lowercase with hyphens
- `team_123` - underscores allowed
- `a` - minimum 1 character
- 50 chars max

Invalid names:

- `Alpha Squad` - spaces
- `team!` - special characters
- `` (empty)
- Over 50 characters

## Directory Structure

```
~/.openclaw/teams/
└── {team_name}/
    ├── config.json
    ├── ledger.db
    ├── ledger.db-shm
    ├── ledger.db-wal
    └── inbox/
```

## Verification

```bash
pnpm test src/teams/storage.test.ts
```
