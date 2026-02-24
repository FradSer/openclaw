# Task 005: Team Storage Implementation

**Phase:** 1 (Core Infrastructure)
**Status:** pending
**depends-on:** ["task-004-storage-tests.md"]

## Description

Implement team storage operations for file-based configuration management in `~/.openclaw/teams/`.

## BDD Scenario

```gherkin
Feature: Team Storage Implementation
  As a developer
  I want file-based team configuration
  So that team data persists across restarts

  # Must pass all scenarios from Task 004
  Scenario: Create a new team successfully
    Given a user requests to create a team named "new-feature-team"
    When the TeamCreate tool is invoked with valid parameters
    Then a new team directory is created at ~/.openclaw/teams/new-feature-team/
```

## Files to Create

- `src/teams/storage.ts` - Storage implementation

## Implementation Requirements

### Directory Structure

```
~/.openclaw/
├── teams/
│   ├── {team_name}/
│   │   ├── config.json          # Team configuration
│   │   ├── ledger.db            # SQLite task ledger
│   │   ├── ledger.db-shm        # WAL shared memory
│   │   ├── ledger.db-wal        # WAL log
│   │   └── inbox/
│   │       ├── {teammate_id}/   # Message queues
│   │       │   └── messages.jsonl
```

### Key Methods

- `getTeamDir(teamName: string)` - Get team directory path
- `createTeamDirectory(teamName: string)` - Create team directory
- `writeTeamConfig(teamName: string, config: TeamConfig)` - Write config
- `readTeamConfig(teamName: string)` - Read config
- `teamExists(teamName: string)` - Check if team exists
- `validateTeamName(name: string)` - Validate team name format
- `initializeInbox(teamName: string, memberId: string)` - Create inbox

### Validation

- Team name: 1-50 chars, alphanumeric, hyphen, underscore only
- No path traversal characters
- No duplicate team names

## Verification

Run tests: `pnpm test src/teams/storage.test.ts`

Ensure all tests pass (GREEN).
