# Task 031: Message Injection Implementation

**Phase:** 4 (Communication Tools)
**Status:** pending
**depends-on:** ["task-030-message-injection-tests.md"]

## Description

Implement message injection into agent context.

## BDD Scenario

```gherkin
Feature: Message Injection Implementation
  As a developer
  I want message injection
  So that agents see messages

  # Must pass all scenarios from Task 030
  Scenario: Message delivered only to intended recipient
    Given messages exist
    When context is built
    Then only recipient messages are included
```

## Files to Create

- `src/teams/context-injection.ts` - Context injection implementation

## Implementation Requirements

### Message Format

```xml
<teammate-message teammate_id="researcher-1" type="message" summary="Found critical bug">
Message content here...
</teammate-message>
```

### Injection Points

- Before each agent inference
- Filter by recipient session key
- Include summary for UI preview

## Verification

Run tests: `pnpm test src/teams/context-injection.test.ts`

Ensure all tests pass (GREEN).
