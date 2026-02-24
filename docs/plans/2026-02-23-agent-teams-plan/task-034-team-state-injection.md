# Task 034: Team State Injection Implementation

**Phase:** 5 (Integration & Verification)
**Status:** pending
**depends-on:** ["task-033-team-state-injection-tests.md"]

## Description

Implement team state injection for context amnesia prevention.

## BDD Scenario

```gherkin
Feature: Team State Injection Implementation
  As a team lead
  I want team state persisted
  So that I remember after compression

  # Must pass all scenarios from Task 033
  Scenario: Team lead state persists across context compression
    Given team lead
    When context is built
    Then team state is injected
```

## Implementation Requirements

### Injection Format

```
=== TEAM STATE ===
Team: my-team
Active Members: lead, researcher-1, worker-1
Pending Tasks: 3
In Progress: 1
Completed: 5
====================
```

### Injection Points

- Before each Team Lead inference
- Query team state from manager
- Append to system prompt

## Verification

Run tests: `pnpm test src/teams/state-injection.test.ts`

Ensure all tests pass (GREEN).
