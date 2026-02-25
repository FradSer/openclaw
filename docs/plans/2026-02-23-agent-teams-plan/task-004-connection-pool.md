# Task 004: Connection Pool

**Phase:** 1 (Core Infrastructure)
**Status:** complete
**depends-on:** []

## Description

Verify connection pooling for TeamManager instances to avoid repeated connection overhead.

## Implementation Location

`src/teams/pool.ts` (59 lines)

## BDD Scenario

```gherkin
Feature: Connection Pool
  As a developer
  I want cached TeamManager instances
  So that database connections are reused efficiently

  Scenario: Get or create cached manager
    Given the pool is empty
    When getTeamManager is called for "team-alpha"
    Then a new TeamManager is created and cached
    And subsequent calls return the same instance

  Scenario: Close specific team manager
    Given a manager for "team-alpha" is cached
    When closeTeamManager is called for "team-alpha"
    Then that manager is closed and removed from cache
    And other managers remain unaffected

  Scenario: Close all managers
    Given multiple managers are cached
    When closeAll is called
    Then all managers are closed
    And the cache is empty

  Scenario: Resolve state directory
    When resolveStateDir is called
    Then it returns OPENCLAW_STATE_DIR if set
    Or falls back to current working directory
```

## Key Functions

- `getTeamManager(teamName, stateDir)` - Get or create cached manager
- `closeTeamManager(teamName)` - Close and remove specific manager
- `closeAll()` - Close all cached managers
- `resolveStateDir()` - Get state directory path

## Implementation Pattern

```typescript
const connectionCache = new Map<string, TeamManager>();

export function getTeamManager(teamName: string, stateDir: string): TeamManager {
  const sanitized = sanitizeName(teamName);
  if (!connectionCache.has(sanitized)) {
    connectionCache.set(sanitized, new TeamManager(sanitized, stateDir));
  }
  return connectionCache.get(sanitized)!;
}
```

## Verification

```bash
pnpm test src/teams/pool.test.ts
```
