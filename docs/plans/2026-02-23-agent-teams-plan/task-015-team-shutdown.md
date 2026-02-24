# Task 015: TeamShutdown Tool Implementation

**Phase:** 2 (Team Lifecycle Tools)
**Status:** pending
**depends-on:** ["task-014-team-shutdown-tests.md"]

## Description

Implement TeamShutdown tool for graceful team shutdown with member approval.

## BDD Scenario

```gherkin
Feature: TeamShutdown Implementation
  As a team lead
  I want to shutdown teams gracefully
  So that work is saved

  # Must pass all scenarios from Task 014
  Scenario: Graceful shutdown requests member approval
    Given an active team with members
    When shutdown is requested
    Then approval is requested from all members
```

## Files to Create

- `src/agents/tools/teams/team-shutdown.ts` - TeamShutdown tool

## Implementation Requirements

### Input Parameters

```typescript
{
  team_name: string;           // Required: Team to shutdown
  reason?: string;            // Optional: Shutdown reason
}
```

### Shutdown Protocol

1. Send shutdown_request to all members
2. Wait for shutdown_response from each member
3. If all approve: complete shutdown
4. If any reject: cancel shutdown
5. Cleanup: delete team directory

### Message Types

- `shutdown_request` - Request approval from member
- `shutdown_response` - Member response with approve/reject

## Verification

Run tests: `pnpm test src/agents/tools/teams/team-shutdown.test.ts`

Ensure all tests pass (GREEN).
