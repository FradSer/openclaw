# Task 007: teammate_spawn Tool

**Phase:** 2 (Tool Verification)
**Status:** complete
**depends-on:** []

## Description

Verify teammate_spawn tool creates teammate agents that join an existing team.

## Implementation Location

`src/agents/tools/teams/teammate-spawn.ts` (80 lines)

## BDD Scenario

```gherkin
Feature: teammate_spawn Tool
  As a team lead
  I want to spawn teammate agents
  So that they can work on team tasks

  Scenario: Spawn teammate successfully
    Given a team "alpha-squad" exists
    When I call teammate_spawn with name "researcher"
    Then a session key "agent:{id}:teammate:{uuid}" is generated
    And the teammate is added to team members
    And teammate has role "member"

  Scenario: Reject spawn for non-existent team
    Given no team "non-existent" exists
    When I call teammate_spawn for that team
    Then the operation fails with team not found error

  Scenario: Spawn with custom agent type
    When I call teammate_spawn with agent_type "researcher"
    Then the teammate's agentType is set accordingly

  Scenario: Spawn with custom model
    When I call teammate_spawn with model "anthropic/claude-opus-4-5"
    Then the teammate uses the specified model
```

## Tool Schema

```typescript
{
  team_name: string;     // Required
  name: string;          // Required: Display name
  agent_type?: string;   // Optional
  model?: string;        // Optional: Model override
}
```

## Output

```typescript
{
  teammateId: string;
  sessionKey: string; // agent:{id}:teammate:{uuid}
  status: "spawned";
}
```

## Verification

```bash
pnpm test src/agents/tools/teams/teammate-spawn.test.ts
```
