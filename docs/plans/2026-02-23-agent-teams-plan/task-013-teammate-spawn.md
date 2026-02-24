# Task 013: TeammateSpawn Tool Implementation

**Phase:** 2 (Team Lifecycle Tools)
**Status:** pending
**depends-on:** ["task-012-teammate-spawn-tests.md"]

## Description

Implement TeammateSpawn tool for spawning teammate agent sessions.

## BDD Scenario

```gherkin
Feature: TeammateSpawn Implementation
  As a team lead
  I want to spawn teammates
  So that I can coordinate agents

  # Must pass all scenarios from Task 012
  Scenario: Team lead spawns teammate
    Given an active team
    When spawn is requested
    Then teammate session is created
```

## Files to Create

- `src/agents/tools/teams/teammate-spawn.ts` - TeammateSpawn tool

## Implementation Requirements

### Input Parameters

```typescript
{
  team_name: string;           // Required: Team to join
  name: string;               // Required: Display name
  agent_id?: string;          // Optional: Agent type ID
  model?: string;             // Optional: Model override
}
```

### Tool Handler

- Validate team exists and is active
- Generate session key for teammate
- Add member to team roster
- Create inbox directory
- Return member ID and session info

## Verification

Run tests: `pnpm test src/agents/tools/teams/teammate-spawn.test.ts`

Ensure all tests pass (GREEN).
