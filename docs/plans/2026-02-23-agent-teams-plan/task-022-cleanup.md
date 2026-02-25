# Task 022: Cleanup Operations

**Phase:** 4 (Quality Assurance)
**Status:** complete
**depends-on:** []

## Description

Verify cleanup and maintenance operations work correctly.

## Implementation Location

`src/teams/cleanup.ts` (247 lines)

## BDD Scenario

```gherkin
Feature: Cleanup Operations
  As a developer
  I want cleanup operations to work
  So that disk space is managed

  Scenario: Clean up old inbox messages
    Given inbox messages older than TTL exist
    When cleanupOldMessages is called
    Then old messages are deleted
    And recent messages are preserved

  Scenario: Archive completed tasks
    Given completed tasks older than retention exist
    When archiveCompletedTasks is called
    Then old tasks are archived or deleted

  Scenario: Clean up inactive teams
    Given teams inactive for N days exist
    When cleanupInactiveTeams is called
    Then inactive teams are removed

  Scenario: Checkpoint WAL file
    Given WAL file has accumulated changes
    When checkpointWAL is called
    Then WAL is consolidated into main database

  Scenario: Get team storage stats
    When getTeamStats is called
    Then total size, task count, message count are returned
```

## Key Functions

- `cleanupOldMessages(teamName, maxAge)` - Remove old inbox messages
- `archiveCompletedTasks(teamName, maxAge)` - Archive old tasks
- `cleanupInactiveTeams(stateDir, maxAge)` - Remove inactive teams
- `checkpointWAL(teamName)` - Force WAL checkpoint
- `getTeamStats(teamName)` - Get storage statistics

## WAL Checkpoint

```typescript
db.exec("PRAGMA wal_checkpoint(TRUNCATE)");
```

## Retention Configuration

| Resource        | Default TTL |
| --------------- | ----------- |
| Inbox messages  | 24 hours    |
| Completed tasks | 7 days      |
| Inactive teams  | 30 days     |

## Verification

```bash
pnpm test src/teams/cleanup.test.ts
```
