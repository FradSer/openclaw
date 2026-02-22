# Task 008: Connection Pooling

**Phase:** 1 (Core Infrastructure)
**Status:** pending
**depends-on:** ["task-007-manager.md"]

## Description

Implement connection pooling for TeamManager instances to reuse database connections and reduce overhead.

## Files to Create

- `src/teams/pool.ts` - Connection pool implementation

## Implementation Requirements

### Connection Cache

Implement a connection cache Map:

1. **getTeamManager(teamName: string, stateDir: string): TeamManager**
   - Check cache for existing manager
   - Create new manager if not cached
   - Return cached or new manager

2. **closeTeamManager(teamName: string): void**
   - Get manager from cache
   - Call manager.close()
   - Remove from cache

3. **closeAll(): void**
   - Iterate through all cached managers
   - Call close() on each
   - Clear cache

### State Directory Resolution

Implement state directory helper:

```typescript
function resolveStateDir(): string {
  return path.join(os.homedir(), '.openclaw');
}
```

## Constraints

- Use Map<string, TeamManager> for cache
- Provide cleanup mechanism
- Support multiple teams simultaneously

## Verification

1. Create test file `src/teams/pool.test.ts`
2. Test that manager is reused for same team
3. Test that different teams get different managers
4. Test that close() properly cleans up
5. Run tests: `pnpm test src/teams/pool.test.ts`