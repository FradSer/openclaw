Feature: Team Storage Operations

  Scenario: Save team configuration
    Given a team configuration
    When saving the configuration to storage
    Then the configuration should be persisted to disk
    And should be readable on subsequent loads

  Scenario: Load team configuration
    Given a previously saved team configuration
    When loading the configuration
    Then the configuration should match the saved data

  Scenario: Create team directory structure
    Given a team name
    When creating the team directory
    Then the directory should be created
    And subdirectories for tasks and messages should exist

  Scenario: Validate team configuration
    Given a team configuration
    When validating the configuration
    Then required fields should be present
    And invalid values should be rejected

  Scenario: Atomic write operations
    Given a team configuration
    When writing to storage
    Then the write should be atomic
    And partial writes should not corrupt data

  Scenario: Handle concurrent access
    Given multiple concurrent operations
    When writing to storage
    Then operations should be serialized
    And no data corruption should occur