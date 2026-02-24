# Task 028: Inbox Structure Tests

**Phase:** 4 (Communication Tools)
**Status:** pending
**depends-on:** ["task-027-send-message.md"]

## Description

Create tests for inbox structure and message persistence.

## BDD Scenario

```gherkin
Feature: Inbox Structure
  As a developer
  I want message inbox storage
  So that messages persist

  # Feature 3: Mailbox Communication scenarios (17-19)
  Scenario: Message persists if recipient offline
    Given a message is sent to "agent-001"
    And "agent-001" is not currently connected
    When "agent-001" comes online
    Then the message is available in their inbox

  Scenario: Message queue processed on next inference
    Given "agent-001" has pending messages in inbox
    When "agent-001" starts next inference
    Then messages are injected into context
    And messages are marked as delivered
```

## Files to Create

- `src/teams/inbox.test.ts` - Inbox tests

## Test Requirements

1. Test inbox directory creation
2. Test message file write
3. Test message persistence
4. Test message delivery status

## Verification

Run tests: `pnpm test src/teams/inbox.test.ts`

Ensure all tests fail (RED) before implementation.
