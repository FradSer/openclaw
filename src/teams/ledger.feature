Feature: SQLite Ledger Schema

  Scenario: Enable WAL mode for better concurrency
    Given a new SQLite ledger database is created
    When the database is initialized
    Then WAL mode should be enabled for concurrent access

  Scenario: Create required schema tables
    Given a new SQLite ledger database is created
    When the database is initialized
    Then all required tables should exist
    And tables should have correct column structure

  Scenario: Handle database lifecycle
    Given an open SQLite ledger connection
    When the database is closed
    Then connection should be properly released
    And resources should be cleaned up

  Scenario: Support database reopening
    Given a closed SQLite ledger connection
    When the database is reopened
    Then all existing data should be accessible
    And WAL mode should still be enabled