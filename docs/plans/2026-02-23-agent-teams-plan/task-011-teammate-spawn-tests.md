# Task 011: TeammateSpawn Tool Tests

**Phase:** 2 (Team Lifecycle Tools)
**Status:** pending
**depends-on:** ["task-010-team-create.md"]

## Description

Create tests for the TeammateSpawn tool that creates a teammate session and adds it to the team. Use test doubles for session spawning and team operations.

## Files to Create

- `src/agents/tools/teams/teammate-spawn.test.ts` - TeammateSpawn tool tests

## Test Requirements

### Successful Spawning

1. Test spawns teammate with valid parameters
2. Test calls sessions-spawn tool with correct parameters
3. Test adds member to team ledger
4. Test stores team context in session state
5. Test returns teammate session information

### Custom Agent Type

1. Test spawns teammate with custom agent_type
2. Test passes agent_id to spawn function
3. Test uses default agent when not specified

### Model Override

1. Test spawns teammate with model override
2. Test passes model to spawn function
3. Test omits model when not provided

### Validation Errors

1. Test rejects spawn for non-existent team
2. Test validates team name format
3. Test validates teammate name

### Session State Integration

1. Test sets teamId in session state
2. Test sets teamRole as 'member'
3. Test stores team name for reference

### Mock Strategy

Mock `spawnSubagentDirect` and `getTeamManager`:
- Track spawn calls and parameters
- Return mock session keys
- Track member additions to ledger

## BDD Scenario References

- Feature 1: Team Lifecycle (Teammate Spawning scenarios)
- Feature 5: Team Lead Coordination (Scenario 16)

## Verification

Run tests: `pnpm test src/agents/tools/teams/teammate-spawn.test.ts`

Ensure all tests fail (RED) before implementation.