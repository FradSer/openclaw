# Task 026: SendMessage Tool Tests

**Phase:** 4 (Communication Tools)
**Status:** pending
**depends-on:** ["task-025-task-complete.md"]

## Description

Create tests for SendMessage tool including direct messages, broadcasts, and shutdown protocol.

## BDD Scenario

```gherkin
Feature: Message Sending
  As a team member
  I want to send messages to teammates
  So that we can communicate

  # Feature 3: Mailbox Communication - 19 scenarios
  Scenario: Send direct message to teammate
    Given a team exists with members "agent-001" and "agent-002"
    When a user requests to send message "Please review the PR" to "agent-001"
    Then the message is stored in agent-001's inbox
    And the message includes summary "Requesting PR review"
    And the tool returns success confirmation
    And plain text output is NOT visible to teammates

  Scenario: Broadcast message to all teammates
    Given a team exists with 3 members
    When a user requests to broadcast message "Standup meeting in 5 minutes"
    Then the message is delivered to all 3 members
    And the sender is excluded from recipients
    And each delivery includes summary "Standup in 5 min"
    And the tool returns count of 3 successful deliveries

  Scenario: Send shutdown request to member
    Given a team exists with member "agent-001"
    When a user requests to send shutdown request with ID "req-123"
    Then the shutdown request is sent to "agent-001"
    And the message type is "shutdown_request"
    And the request ID "req-123" is included

  Scenario: Shutdown response with approval
    Given a shutdown request was sent with ID "req-123"
    When member "agent-001" responds with approval
    Then the response has type "shutdown_response"
    And approve is set to true
    And request ID matches "req-123"

  Scenario: Shutdown response with rejection and reason
    Given a shutdown request was sent with ID "req-123"
    When member "agent-001" responds with rejection and reason "Still working on task #5"
    Then the response has type "shutdown_response"
    And approve is set to false
    And request ID matches "req-123"
    And reason is stored and returned to team lead

  Scenario: Message summary provided for UI preview
    Given a message is sent
    When the recipient views their inbox
    Then summaries are displayed in UI
    And summary is limited to 5-10 words
```

## Files to Create

- `src/agents/tools/teams/send-message.test.ts` - SendMessage tests

## Test Requirements

1. Test direct message delivery
2. Test broadcast to all members
3. Test shutdown request/response
4. Test summary validation

## Verification

Run tests: `pnpm test src/agents/tools/teams/send-message.test.ts`

Ensure all tests fail (RED) before implementation.
