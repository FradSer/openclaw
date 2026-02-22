# Task 032: Task Management BDD Tests

**Phase:** 5 (Integration & Testing)
**Status:** pending
**depends-on**: ["task-031-team-lifecycle-bdd.md"]

## Description

Implement BDD scenarios for Task Management feature including task creation, claiming, completion, and dependency resolution.

## Files to Create

- `features/task-management.feature` - Gherkin feature file
- `tests/bdd/task-management.steps.ts` - Step definitions

## Scenario Implementation

Implement the following scenarios:

1. **Add a single task to the team**
   - Given team exists with tasks table initialized
   - When TaskCreate tool is called with subject and description
   - Then task is added to ledger
   - And task ID is returned

2. **Add a task with active form**
   - Given task parameters include activeForm
   - When TaskCreate tool is called
   - Then active form is stored in task

3. **Add task with metadata**
   - Given task parameters include metadata object
   - When TaskCreate tool is called
   - Then metadata is stored as JSON in task

4. **List all tasks in the team**
   - Given team has multiple tasks
   - When TaskList tool is called without filters
   - Then all tasks are returned
   - And tasks are sorted by createdAt descending

5. **List only pending tasks**
   - Given team has tasks in various statuses
   - When TaskList tool is called with status: "pending"
   - Then only pending tasks are returned

6. **Claim an available task**
   - Given task with ID "task-1" has status 'pending'
   - When TaskClaim tool is called with task_id: "task-1"
   - Then task status changes to 'claimed'
   - And task owner is set to claiming session
   - And claimedAt timestamp is set

7. **Claim task updates active form**
   - Given task has activeForm defined
   - When task is claimed
   - Then active form is applied to task display

8. **Attempt to claim already claimed task**
   - Given task "task-1" is already claimed by "session-a"
   - When TaskClaim tool is called for "session-b"
   *Then claim returns conflict error
   - And task ownership remains unchanged

9. **Atomic task claiming prevents race conditions**
   - Given pending task with ID "task-5"
   - And two idle members "agent-fast" and "agent-slow"
   - When both members attempt to claim task simultaneously
   - Then only one member successfully claims task
   - And other member receives conflict error
   - And task has exactly one owner assigned

10. **Mark task as completed**
    - Given task "task-2" is claimed by session
    - When TaskComplete tool is called
    - Then task status changes to 'completed'
    - And completedAt timestamp is set

11. **Add task with dependencies**
    - Given task "task-a" already exists
    - When TaskCreate is called with dependsOn: ["task-a"]
    - Then new task has dependsOn set
    - And new task has blockedBy set to ["task-a"]
    - And new task status is 'pending'

12. **List tasks blocked by dependencies**
    - Given tasks with various dependency states
    - When TaskList is called
    - Then blocked tasks are identified correctly
    - And blockedBy array reflects actual dependencies

13. **Auto-unblock tasks when dependency completes**
    - Given task "task-x" depends on "task-y"
    - And "task-x" is blocked with status 'pending'
    - When "task-y" is marked as completed
    - Then "task-x" is removed from blockedBy
    - And "task-x" status changes to 'pending' (available)

14. **Complex dependency chain resolution**
    - Given tasks: task-1 -> task-2 -> task-3 (depends on)
    - And all tasks are blocked
    - When task-1 is completed
    - Then task-2 is unblocked
    - And task-3 remains blocked
    - When task-2 is completed
    - Then task-3 is unblocked

15. **Circular dependency detection and prevention**
    - Given task-A already exists
    - And task-B depends on task-A
    - When TaskCreate is called for task-C depending on task-A depending on task-C
    *Then creation is rejected with circular dependency error

16. **Task completion removes from blockedBy of dependents**
    - Given task-D depends on task-E and task-F
    - And task-D blockedBy is ["task-E", "task-F"]
    - When task-E is completed
    - Then task-D blockedBy is ["task-F"]
    - When task-F is completed
    - Then task-D blockedBy is []

17. **Query tasks by metadata filters**
    - Given tasks have various metadata values
    - When TaskList is queried for specific metadata
    *Then only matching tasks are returned

## Verification

Run BDD tests: `pnpm test tests/bdd/task-management.steps.ts`

Ensure all 17 scenarios pass.