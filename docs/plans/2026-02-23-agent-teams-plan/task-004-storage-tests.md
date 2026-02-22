# Task 004: Team Storage Tests

**Phase:** 1 (Core Infrastructure)
**Status:** pending
**depends-on:** ["task-001-types.md"]

## Description

Create tests for team storage operations including config file persistence, team directory management, and config validation. Use test doubles for file system operations.

## Files to Create

- `src/teams/storage.test.ts` - Team storage tests

## Test Requirements

### Config File Operations

1. Test creates team config file at correct path
2. Test reads team config from file
3. Test updates team config
4. Test deletes team config
5. Test atomic write with temporary file pattern

### Directory Operations

1. Test creates team directory structure
2. Test creates inbox directory
3. Test validates team directory exists
4. Test deletes team directory

### Validation Tests

1. Test validates team name format (valid names pass)
2. Test rejects team name with special characters
3. Test rejects empty team name
4. Test rejects team name longer than 50 characters
5. Test rejects team name starting with dash or underscore

### Mock Strategy

Mock `node:fs/promises`:
- Track file operations (mkdir, writeFile, readFile, rm)
- Return mock config data for readFile
- Validate file paths for security

## BDD Scenario References

- Feature 1: Team Lifecycle (Scenarios 1-5)
  - Scenario 1: Create a new team successfully
  - Scenario 4: Attempt to create team with invalid name

## Verification

Run tests: `pnpm test src/teams/storage.test.ts`

Ensure all tests fail (RED) before implementation.