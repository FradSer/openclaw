Feature: Task Management
  As a team member
  I want to create, claim, and complete tasks with dependencies
  So that work can be distributed and coordinated across the team

  Background:
    Given the state directory is "/tmp/test-teams"
    And the team "task-team" exists

  Scenario: Add a single task to the team
    When TaskCreate tool is called with subject "Write docs" and description "Create documentation"
    Then task is added to ledger
    And task ID is returned

  Scenario: Add a task with active form
    When TaskCreate tool is called with subject "Test API" and activeForm "Testing API endpoints"
    Then active form is stored in task

  Scenario: Add task with metadata
    When TaskCreate tool is called with subject "Fix bug" and metadata {"priority": "high"}
    Then metadata is stored as JSON in task

  Scenario: List all tasks in the team
    Given team has multiple tasks
    When TaskList tool is called without filters
    Then all tasks are returned
    And tasks are sorted by createdAt descending

  Scenario: List only pending tasks
    Given team has tasks in various statuses
    When TaskList tool is called with status: "pending"
    Then only pending tasks are returned

  Scenario: Claim an available task
    Given task with ID "task-1" has status 'pending'
    When TaskClaim tool is called with task_id: "task-1"
    Then task status changes to 'claimed'
    And task owner is set to claiming session
    And claimedAt timestamp is set

  Scenario: Claim task updates active form
    Given task has activeForm defined
    When task is claimed
    Then active form is applied to task display

  Scenario: Attempt to claim already claimed task
    Given task "task-1" is already claimed by "session-a"
    When TaskClaim tool is called for "session-b"
    Then claim returns conflict error
    And task ownership remains unchanged

  Scenario: Atomic task claiming prevents race conditions
    Given pending task with ID "task-5"
    And two idle members "agent-fast" and "agent-slow"
    When both members attempt to claim task simultaneously
    Then only one member successfully claims task
    And other member receives conflict error
    And task has exactly one owner assigned

  Scenario: Mark task as completed
    Given task "task-2" is claimed by session
    When TaskComplete tool is called
    Then task status changes to 'completed'
    And completedAt timestamp is set

  Scenario: Add task with dependencies
    Given task "task-a" already exists
    When TaskCreate is called with dependsOn: ["task-a"]
    Then new task has dependsOn set
    And new task has blockedBy set to ["task-a"]
    And new task status is 'pending'

  Scenario: List tasks blocked by dependencies
    Given tasks with various dependency states
    When TaskList is called
    Then blocked tasks are identified correctly
    And blockedBy array reflects actual dependencies

  Scenario: Auto-unblock tasks when dependency completes
    Given task "task-x" depends on "task-y"
    And "task-x" is blocked with status 'pending'
    When "task-y" is marked as completed
    Then "task-x" is removed from blockedBy
    And "task-x" status changes to 'pending'

  Scenario: Complex dependency chain resolution
    Given tasks: task-1 -> task-2 -> task-3 (depends on)
    And all tasks are blocked
    When task-1 is completed
    Then task-2 is unblocked
    And task-3 remains blocked
    When task-2 is completed
    Then task-3 is unblocked

  Scenario: Circular dependency detection and prevention
    Given task-A already exists
    And task-B depends on task-A
    When TaskCreate is called for task-C depending on task-A depending on task-C
    Then creation is rejected with circular dependency error

  Scenario: Task completion removes from blockedBy of dependents
    Given task-D depends on task-E and task-F
    And task-D blockedBy is ["task-E", "task-F"]
    When task-E is completed
    Then task-D blockedBy is ["task-F"]
    When task-F is completed
    Then task-D blockedBy is []

  Scenario: Query tasks by metadata filters
    Given tasks have various metadata values
    When TaskList is queried for specific metadata
    Then only matching tasks are returned