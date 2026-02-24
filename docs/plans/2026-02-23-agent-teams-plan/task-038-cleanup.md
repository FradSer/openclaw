# Task 038: Cleanup Implementation

**Phase:** 5 (Integration & Verification)
**Status:** pending
**depends-on:** ["task-037-e2e-workflows.md"]

## Description

Implement cleanup for team resources when teams are deleted or sessions end.

## Implementation Requirements

### Cleanup Operations

1. Delete team directory when team is deleted
2. Clean up inbox directories when members leave
3. Close database connections on shutdown
4. Clean up temporary files

## Files to Create/Modify

- `src/teams/cleanup.ts` - Cleanup implementation
- Modify manager to call cleanup

## Verification

Run: `pnpm test src/teams/cleanup.test.ts`

Ensure cleanup tests pass.
