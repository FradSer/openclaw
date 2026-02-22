# Task 009: TeamCreate Tool Tests

**Phase:** 2 (Team Lifecycle Tools)
**Status:** pending
**depends-on:** ["task-008-connection-pool.md"]

## Description

Create tests for the TeamCreate tool including team creation, validation, and error handling. Use test doubles for storage and ledger operations.

## Files to Create

- `src/agents/tools/teams/team-create.test.ts` - TeamCreate tool tests

## Test Requirements

### Successful Team Creation

1. Test creates new team with valid parameters
2. Test creates team directory structure
3. Test writes team config file
4. Test initializes SQLite ledger
5. Test adds team lead as member
6. Test returns team ID in response

### Custom Agent Type

1. Test creates team with custom agent type
2. Test stores agent type in config
3. Test uses default agent type when not specified

### Metadata

1. Test creates team with description
2. Test stores description in config
3. Test omits description when not provided

### Validation Errors

1. Test rejects invalid team name format
2. Test rejects duplicate team name
3. Test validates team name length (1-50 chars)
4. Test rejects empty team name
5. Test rejects team name with path traversal characters

### Error Handling

1. Test handles file system errors gracefully
2. Test handles database errors gracefully
3. Test returns appropriate error messages

### Mock Strategy

Mock `getTeamManager`, `createTeamDirectory`, `writeTeamConfig`:
- Track function calls and parameters
- Return mock team IDs
- Simulate errors for error case testing

## BDD Scenario References

- Feature 1: Team Lifecycle (Scenarios 1-5)
  - Scenario 1: Create a new team successfully
  - Scenario 2: Create team with custom agent type for team lead
  - Scenario 3: Create team with descriptive metadata
  - Scenario 4: Attempt to create team with invalid name
  - Scenario 5: Attempt to create duplicate team

## Verification

Run tests: `pnpm test src/agents/tools/teams/team-create.test.ts`

Ensure all tests fail (RED) before implementation.