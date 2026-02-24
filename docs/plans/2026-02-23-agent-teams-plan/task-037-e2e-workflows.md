# Task 037: E2E Workflow Tests

**Phase:** 5 (Integration & Verification)
**Status:** pending
**depends-on:** ["task-036-security-tests.md"]

## Description

Create end-to-end tests for complete team workflows.

## E2E Workflows

### Complete Team Lifecycle

```gherkin
Scenario: Complete team lifecycle
  Given user creates a team
  When team lead spawns 2 teammates
  And tasks are created
  And teammates claim and complete tasks
  And messages are exchanged
  And team is shut down
  Then all operations complete successfully
```

### Parallel Task Work

```gherkin
Scenario: Multiple teammates work in parallel
  Given team with 3 teammates
  When 5 tasks are created
  And teammates claim available tasks
  Then tasks are distributed across teammates
  And no task is claimed twice
```

## Verification

Run: `pnpm test:e2e`

Ensure all E2E tests pass.
