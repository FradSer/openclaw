# Task 006: team_create Tool

**Phase:** 2 (Tool Verification)
**Status:** complete
**depends-on:** []

## Description

Verify team_create tool initializes team with configuration, directory structure, and SQLite ledger.

## Implementation Location

`src/agents/tools/teams/team-create.ts` (92 lines)

## BDD Scenario

```gherkin
Feature: team_create Tool
  As a team lead
  I want to create a new team
  So that I can coordinate multiple agents

  Scenario: Create team successfully
    Given I have a valid session key
    When I call team_create with team_name "alpha-squad"
    Then team directory ~/.openclaw/teams/alpha-squad/ is created
    And config.json is written with my session as lead
    And ledger.db is initialized
    And I am registered as a team member with role "lead"

  Scenario: Reject invalid team name
    When I call team_create with team_name "Invalid Name!"
    Then the operation fails with validation error
    And no files are created

  Scenario: Reject duplicate team name
    Given a team "alpha-squad" already exists
    When I call team_create with team_name "alpha-squad"
    Then the operation fails with error "Team 'alpha-squad' already exists"

  Scenario: Create team with optional parameters
    When I call team_create with description and agent_type
    Then config.json includes the provided values
```

## Tool Schema

```typescript
{
  team_name: string;     // Required: 1-50 chars, alphanumeric/hyphen
  description?: string;  // Optional
  agent_type?: string;   // Optional: Default "general-purpose"
}
```

## Output

```typescript
{
  teamId: string; // UUID
  teamName: string;
  status: "active";
  message: string;
}
```

## Verification

```bash
pnpm test src/agents/tools/teams/team-create.test.ts
```
