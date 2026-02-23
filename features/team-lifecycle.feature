Feature: Team Lifecycle
  As a team lead
  I want to create teams, spawn teammates, and shutdown gracefully
  So that multiple agents can collaborate on complex tasks

  Scenario: Create a new team successfully
    Given I create a team with name "new-team" and description "Test team"
    When the TeamCreate tool is executed
    Then team directory "new-team" is created
    And team config file exists for "new-team"
    And SQLite ledger is initialized for "new-team"

  Scenario: Create team with custom agent type for team lead
    Given I specify agent type "researcher"
    When I create a team with name "research-team"
    Then agent type "researcher" is stored in team config

  Scenario: Create team with descriptive metadata
    Given I provide team description "Documentation team"
    When I create a team with name "doc-team"
    Then description is stored in team config

  Scenario: Attempt to create team with invalid name
    Given I attempt to create team with name "test@team"
    When the TeamCreate tool is executed
    Then tool returns validation error
    And team directory is not created

  Scenario: Attempt to create duplicate team
    Given team "existing-team" already exists
    When I attempt to create team with name "existing-team"
    Then tool returns error for duplicate name

  Scenario: Graceful team shutdown with no active members
    Given team "empty-team" exists with no members
    When the TeamShutdown tool is executed for "empty-team"
    Then team status is set to 'shutdown'
    And team directory is deleted

  Scenario: Graceful shutdown requests member approval
    Given team "active-team" has active members
    When the TeamShutdown tool is executed for "active-team"
    Then shutdown_request is sent to all members
    And shutdown is pending approval

  Scenario: Member approves shutdown request
    Given member "worker-1" receives shutdown request
    When member responds with shutdown_response (approve: true)
    Then member session terminates
    And team lead receives approval

  Scenario: Member rejects shutdown with reason
    Given member "worker-2" receives shutdown request
    When member responds with shutdown_response (approve: false, reason: "Working on task")
    Then team lead receives rejection
    And shutdown is aborted

  Scenario: Team shutdown fails with active members
    Given team "busy-team" has active members
    And not all members have approved shutdown
    When shutdown timeout is reached
    Then team directory is not deleted
    And team remains active

  Scenario: Team lead handles member going idle during shutdown
    Given shutdown is pending approval
    And member "worker-3" goes idle
    Then team lead receives idle notification
    And shutdown continues without waiting for idle member