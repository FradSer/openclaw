# Task 030: Message Injection Tests

**Phase:** 4 (Communication Tools)
**Status:** pending
**depends-on:** ["task-029-inbox.md"]

## Description

Create tests for message injection into agent context.

## BDD Scenario

```gherkin
Feature: Message Injection
  As a developer
  I want messages injected into context
  So that agents can see messages

  # Feature 3: Mailbox Communication
  Scenario: Message delivered only to intended recipient
    Given a message is sent to "agent-001"
    When "agent-001" receives the message
    Then "agent-002" does not see the message

  Scenario: Plain text output is NOT visible to teammates
    Given a teammate has output
    When another teammate queries messages
    Then only explicit messages are visible
    And tool output is not shared
```

## Files to Create

- `src/teams/context-injection.test.ts` - Context injection tests

## Test Requirements

1. Test message injection format
2. Test XML tag structure
3. Test recipient filtering

## Verification

Run tests: `pnpm test src/teams/context-injection.test.ts`

Ensure all tests fail (RED) before implementation.
