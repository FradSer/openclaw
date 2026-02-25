# Task 020: Performance Tests

**Phase:** 4 (Quality Assurance)
**Status:** complete
**depends-on:** []

## Description

Verify system performs well under load.

## Implementation Location

`src/teams/performance.test.ts`

## BDD Scenario

```gherkin
Feature: Performance
  As a developer
  I want the system to perform well under load
  So that it can handle real-world usage

  Scenario: Create many tasks efficiently
    Given a team exists
    When 100 tasks are created
    Then operation completes in reasonable time
    And all tasks are queryable

  Scenario: Query large task list efficiently
    Given 1000 tasks exist
    When task_list is called
    Then results return in under 100ms

  Scenario: Handle large task descriptions
    Given a task with 10000 character description
    When task is created and retrieved
    Then description is preserved exactly

  Scenario: Checkpoint WAL file periodically
    Given many write operations occurred
    When checkpointWAL is called
    Then WAL file is consolidated
    And disk space is recovered
```

## Performance Expectations

| Operation              | Target  |
| ---------------------- | ------- |
| task_create            | < 10ms  |
| task_list (1000 tasks) | < 100ms |
| task_claim             | < 10ms  |
| send_message           | < 5ms   |

## Optimization Techniques

- Connection pooling via `pool.ts`
- WAL mode for concurrent reads
- Indexed queries on status, owner, createdAt
- Batch operations where possible

## Verification

```bash
pnpm test src/teams/performance.test.ts
```
