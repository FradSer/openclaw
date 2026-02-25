# Task 008: team_shutdown Tool

**Phase:** 2 (Tool Verification)
**Status:** complete
**depends-on:** []

## Description

Verify team_shutdown tool gracefully shuts down a team with approval protocol.

## Implementation Location

`src/agents/tools/teams/team-shutdown.ts` (107 lines)

## BDD Scenario

```gherkin
Feature: team_shutdown Tool
  As a team lead
  I want to gracefully shut down a team
  So that all members can finish their work

  Scenario: Request team shutdown
    Given a team "alpha-squad" exists with active members
    When I call team_shutdown for the team
    Then shutdown_request messages are sent to all members
    And team status becomes "shutdown"

  Scenario: Member approves shutdown
    Given a shutdown request is pending
    When a member sends shutdown_response with approve=true
    Then the member is marked as ready for shutdown

  Scenario: Member rejects shutdown
    Given a shutdown request is pending
    When a member sends shutdown_response with approve=false and reason
    Then the shutdown is paused with the rejection reason

  Scenario: Complete team shutdown
    Given all members have approved shutdown
    When team_shutdown completes
    Then team directories are cleaned up
```

## Tool Schema

```typescript
{
  team_name: string;     // Required
  reason?: string;       // Optional: Shutdown reason
}
```

## Output

```typescript
{
  status: "shutdown" | "pending";
  pendingMembers: string[];
  message: string;
}
```

## Shutdown Protocol

1. Lead sends `shutdown_request` via send_message
2. Members receive in context, wrap up work
3. Members send `shutdown_response` with approve flag
4. When all approve, team is deleted

## Verification

```bash
pnpm test src/agents/tools/teams/team-shutdown.test.ts
```
