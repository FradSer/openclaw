Feature: Team Lead Coordination
  As a team lead
  I want to discover team configuration, assign tasks to idle members, monitor progress, coordinate shutdown, and synthesize results
  So that multiple agents can collaborate effectively on complex tasks

  Background:
    Given the state directory is "/tmp/test-teams"
    And the team "coordination-team" exists
    And the team has a lead session "lead-session-001"

  Scenario: Team lead discovers team configuration
    Given team lead session exists
    When team lead queries team state
    Then team configuration is loaded
    And team ID is available
    And team name is available
    And team description is available

  Scenario: Team lead lists all members
    Given team has multiple members
    When team lead queries members
    Then all members are listed
    And each member has a name
    And each member has a role
    And each member has a session key

  Scenario: Team lead queries member status
    Given member "worker-1" is working on task
    When team lead checks member status
    Then member's current task is shown
    And member's lastActiveAt is visible

  Scenario: Team lead assigns task to idle member
    Given team lead has pending task "Write docs"
    And member "agent-001" is idle
    When team lead assigns task to member
    Then task is claimed by member
    And task status changes to 'claimed'

  Scenario: Task assignment by member ID order preference
    Given team has members "agent-001", "agent-002", "agent-003"
    And "agent-001" and "agent-003" are idle
    When team lead has pending task
    Then task is assigned to "agent-001"

  Scenario: Team lead monitors task completion
    Given member is working on task
    When member completes task
    Then team lead receives notification
    And task status updates to 'completed'

  Scenario: Team lead receives completion notification
    Given task is completed
    When next inference occurs
    Then completion info is in context
    And unblocked tasks are identified

  Scenario: Team lead unblocks dependent tasks
    Given task-A was blocking task-B
    When task-A is completed
    Then task-B becomes available
    And team lead can assign task-B

  Scenario: Team lead coordinates shutdown sequence
    Given team has active members
    When team lead initiates shutdown
    Then shutdown requests sent to all members
    And shutdown awaits all approvals

  Scenario: Team lead waits for all member approvals
    Given shutdown is pending
    And 2 of 3 members have approved
    When third member responds
    Then shutdown completes after approval

  Scenario: Team lead completes team deletion
    Given all members have approved shutdown
    When team lead finalizes shutdown
    Then team directory is deleted
    And team is removed from system

  Scenario: Team lead state persists across context compression
    Given team state is loaded
    When context is compressed
    Then team state is reloaded from file
    And team information remains available

  Scenario: Team lead knows about team after compression
    Given team lead experienced context compression
    When team lead has next inference
    Then team state is injected
    And lead knows team name
    And lead knows team members

  Scenario: Team lead maintains member roster in ground truth
    Given team has members with various statuses
    When team lead queries team state
    Then member roster is shown
    And active vs idle status is visible

  Scenario: Team lead handles member failure gracefully
    Given member stops responding
    When team lead detects failure
    Then failure is logged
    And team continues with remaining members

  Scenario: Team lead spawns replacement member
    Given member has failed
    When team lead spawns replacement
    Then new member is added to team
    And new member is assigned tasks from failed member

  Scenario: Team lead reports progress to user
    Given tasks are being completed
    When team lead has periodic updates
    Then progress is reported to user
    And completed task count is shown
    And remaining task count is shown

  Scenario: Team lead synthesizes results from members
    Given all members have completed work
    When team lead has final inference
    Then results are synthesized
    And summary is provided to user