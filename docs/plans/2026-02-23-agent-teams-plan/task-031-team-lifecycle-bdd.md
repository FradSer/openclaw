# Task 031: Team Lifecycle BDD Tests

**Phase:** 5 (Integration & Testing)
**Status:** pending
**depends-on**: ["task-030-team-state-injection.md"]

## Description

Implement BDD scenarios for Team Lifecycle feature using a BDD testing framework. These scenarios validate the complete team creation, spawning, and shutdown workflows.

## Files to Create

- `features/team-lifecycle.feature` - Gherkin feature file
- `tests/bdd/team-lifecycle.steps.ts` - Step definitions

## Scenario Implementation

Implement the following scenarios from the design:

1. **Create a new team successfully**
   - Given user creates team "test-team"
   - When TeamCreate tool is called with valid parameters
   - Then team directory is created
   - And team config file exists
   - And SQLite ledger is initialized

2. **Create team with custom agent type for team lead**
   - Given user specifies agent type "researcher"
   - When TeamCreate tool is called with agent_type parameter
   - Then agent type is stored in team config

3. **Create team with descriptive metadata**
   - Given user provides team description
   - When TeamCreate tool is called with description parameter
   - Then description is stored in team config

4. **Attempt to create team with invalid name**
   - Given user provides invalid team name "test@team"
   - When TeamCreate tool is called
   - Then tool returns validation error
   - And team directory is not created

5. **Attempt to create duplicate team**
   - Given team "existing-team" already exists
   - When TeamCreate tool is called with same name
   - Then tool returns error for duplicate name

6. **Graceful team shutdown with no active members**
   - Given team "empty-team" exists with no members
   - When TeamShutdown tool is called
   - Then team status is set to 'shutdown'
   - And team directory is deleted

7. **Graceful shutdown requests member approval**
   - Given team "active-team" has active members
   - When TeamShutdown tool is called
   - Then shutdown_request is sent to all members
   - And shutdown is pending approval

8. **Member approves shutdown request**
   - Given member "worker-1" receives shutdown request
   - When member responds with shutdown_response (approve: true)
   - Then member session terminates
   - And team lead receives approval

9. **Member rejects shutdown with reason**
   - Given member "worker-2" receives shutdown request
   - When member responds with shutdown_response (approve: false, reason: "Working on task")
   - Then team lead receives rejection
   - And shutdown is aborted

10. **Team shutdown fails with active members**
    - Given team "busy-team" has active members
    - And not all members have approved shutdown
    - When shutdown timeout is reached
    - Then team directory is not deleted
    - And team remains active

11. **Team lead handles member going idle during shutdown**
    - Given shutdown is pending approval
    - And member "worker-3" goes idle
    - Then team lead receives idle notification
    - And shutdown continues without waiting for idle member

## Test Implementation

Use a BDD framework compatible with Vitest (e.g., @cucumber/cucumber with Vitest adapter, or custom Gherkin-like tests with `describe`/`it`).

## Verification

Run BDD tests: `pnpm test tests/bdd/team-lifecycle.steps.ts`

Ensure all 11 scenarios pass.