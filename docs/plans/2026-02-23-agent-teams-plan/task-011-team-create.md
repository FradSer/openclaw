# Task 011: TeamCreate Tool Implementation

**Phase:** 2 (Team Lifecycle Tools)
**Status:** pending
**depends-on:** ["task-010-team-create-tests.md"]

## Description

Implement TeamCreate tool for creating new teams.

## BDD Scenario

```gherkin
Feature: TeamCreate Tool Implementation
  As a team lead
  I want to create teams
  So that I can coordinate agents

  # Must pass all scenarios from Task 010
  Scenario: Create a new team successfully
    Given a user requests to create a team
    When TeamCreate tool is invoked
    Then team is created with all configuration
```

## Files to Create

- `src/agents/tools/teams/team-create.ts` - TeamCreate tool

## Implementation Requirements

### Input Parameters

```typescript
{
  team_name: string;           // Required: Path-safe team identifier
  description?: string;       // Optional: Team description
  agent_type?: string;        // Optional: Agent type for team lead
}
```

### Tool Handler

- Validate team name format
- Check for duplicate team
- Create team directory structure
- Write config.json
- Initialize ledger.db
- Add lead as first member
- Return team ID and success confirmation

## Verification

Run tests: `pnpm test src/agents/tools/teams/team-create.test.ts`

Ensure all tests pass (GREEN).
