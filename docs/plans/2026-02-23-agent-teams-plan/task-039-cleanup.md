# Task 039: Cleanup & Maintenance

**Phase:** 5 (Integration & Testing)
**Status:** pending
**depends-on**: ["task-038-performance.md"]

## Description

Implement cleanup and maintenance functions for old messages, inactive teams, completed tasks, and temporary files.

## Files to Create

- `src/teams/cleanup.ts` - Cleanup functions

## Implementation Requirements

### Message Cleanup

1. `cleanupOldMessages(teamName: string, maxAge?: number): Promise<void>`
   - Remove messages older than maxAge (default 24 hours)
   - Keep recent messages
   - Run periodically or on-demand

### Task Cleanup

2. `archiveCompletedTasks(teamName: string, maxAge?: number): Promise<void>`
   - Move completed tasks older than maxAge to archive
   - Default age: 30 days
   - Keep recent completed tasks for reference

### Inactive Team Cleanup

3. `cleanupInactiveTeams(stateDir: string, maxAge?: number): Promise<string[]>`
   - Identify teams inactive for maxAge (default 7 days)
   - Delete inactive team directories
   - Return list of cleaned team names

### Connection Cleanup

4. `closeAllManagers(): void`
   - Close all cached team manager connections
   - Clear connection cache

### WAL Checkpoint

5. `checkpointWAL(teamName: string): Promise<void>`
   - Execute WAL checkpoint
   - Prevent WAL file growth

## Verification

1. Create test file `src/teams/cleanup.test.ts`
2. Test message cleanup
3. Test task archiving
4. Test inactive team cleanup
5. Run tests: `pnpm test src/teams/cleanup.test.ts`

## Usage

Cleanup functions can be:
- Called periodically via cron
- Triggered manually via admin tool
- Integrated into team shutdown process