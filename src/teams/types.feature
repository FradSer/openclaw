Feature: Team Types Definition

  Scenario: Define core team configuration types
    Given a team configuration is needed
    When types are defined for TeamConfig, TeamMember, Task, TeamMessage, TeamState, TaskClaimResult
    Then the types should capture all essential team and task management properties

  Scenario: TeamConfig type structure
    Given a team configuration
    Then it should include team name, description, and agent type
    And it should support lead assignment and metadata

  Scenario: TeamMember type structure
    Given a team member
    Then it should include name, agentId, agentType, and status
    And it should track task ownership

  Scenario: Task type structure
    Given a task in the team
    Then it should include subject, description, status, owner, and blocking relationships
    And it should support metadata and active form

  Scenario: TeamMessage type structure
    Given a message between team members
    Then it should include type, sender, recipient, content, and timestamps
    And it should support various message types

  Scenario: TeamState type structure
    Given a team state
    Then it should include members, tasks, messages, and current configuration
    And it should track team lifecycle status

  Scenario: TaskClaimResult type structure
    Given a task claim operation result
    Then it should indicate success or failure
    And provide reason for failure when applicable