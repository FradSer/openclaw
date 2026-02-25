# Task 005: Team Manager

**Phase:** 1 (Core Infrastructure)
**Status:** complete
**depends-on:** []

## Description

Verify TeamManager provides high-level orchestration for all team operations.

## Implementation Location

`src/teams/manager.ts` (838 lines)

## BDD Scenario

```gherkin
Feature: Team Manager
  As a developer
  I want unified team management
  So that all operations work together correctly

  Scenario: Create and retrieve tasks
    Given a TeamManager instance
    When createTask is called with subject and description
    Then a task is added to the ledger
    And listTasks includes the new task

  Scenario: Atomically claim a task
    Given a pending task exists
    When claimTask is called
    Then status becomes 'in_progress'
    And owner is set to the claiming agent
    And claimedAt timestamp is recorded

  Scenario: Reject claiming already claimed task
    Given a task with owner "agent-a"
    When claimTask is called by "agent-b"
    Then it returns failure with reason "Task already claimed"

  Scenario: Reject claiming blocked task
    Given a task with blockedBy containing other task IDs
    When claimTask is called
    Then it returns failure with blockedBy array

  Scenario: Complete task and unblock dependents
    Given task A blocks task B
    When task A is completed
    Then task B's blockedBy no longer contains A
    And task B becomes available for claiming

  Scenario: Add and list members
    Given a TeamManager instance
    When addMember is called with agent details
    Then the member appears in listMembers

  Scenario: Detect circular dependencies
    Given task A depends on B, B depends on C, C depends on A
    When detectCircularDependencies is called
    Then the cycle is detected and returned
```

## Key Methods

### Task Operations

- `createTask(subject, description, options)` - Create new task
- `listTasks()` - List all tasks
- `findAvailableTask(limit)` - Find claimable tasks
- `claimTask(taskId, agentName)` - Atomic task claim
- `completeTask(taskId)` - Mark complete, unblock dependents
- `updateTaskStatus(taskId, status)` - Update status
- `deleteTask(taskId)` - Remove task
- `addTaskDependency(taskId, dependsOnId)` - Add dependency

### Member Operations

- `addMember(name, agentId, agentType)` - Register member
- `listMembers()` - List all members
- `updateMemberActivity(name, status, currentTask)` - Update status
- `removeMember(name)` - Remove member

### Message Operations

- `storeMessage(message)` - Persist message
- `retrieveMessages(recipient)` - Get messages for recipient
- `markMessageDelivered(messageId)` - Mark as delivered
- `clearMessages()` - Clear all messages

### Utility

- `getTeamConfig()` - Read team configuration
- `getTeamState()` - Get complete state for injection
- `detectCircularDependencies()` - Find cycles in task graph
- `close()` - Release resources

## Verification

```bash
pnpm test src/teams/manager.test.ts
```
