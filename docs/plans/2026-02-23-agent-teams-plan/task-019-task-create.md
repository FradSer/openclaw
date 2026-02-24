# Task 019: TaskCreate Tool Implementation

**Phase:** 3 (Task Management Tools)
**Status:** pending
**depends-on:** ["task-018-task-create-tests.md"]

## Description

Implement TaskCreate tool for adding tasks to the team ledger.

## BDD Scenario

```gherkin
Feature: TaskCreate Implementation
  As a team member
  I want to create tasks
  So that work can be tracked

  # Must pass all scenarios from Task 018
  Scenario: Add a single task to the team
    Given a team exists
    When task creation is requested
    Then task is created with unique ID
```

## Files to Create

- `src/agents/tools/teams/task-create.ts` - TaskCreate tool

## Implementation Requirements

### Input Parameters

```typescript
{
  team_name: string;           // Required: Team to add task to
  subject: string;             // Required: Task subject
  description: string;         // Required: Task description
  activeForm?: string;         // Optional: Present continuous form
  dependsOn?: string[];        // Optional: Task ID dependencies
  metadata?: Record<string, unknown>; // Optional: Additional metadata
}
```

### Validation

- Subject: 1-200 characters
- Description: 1-10000 characters
- Active form: max 100 characters
- Dependencies: must exist in same team
- Detect circular dependencies

## Verification

Run tests: `pnpm test src/agents/tools/teams/task-create.test.ts`

Ensure all tests pass (GREEN).
