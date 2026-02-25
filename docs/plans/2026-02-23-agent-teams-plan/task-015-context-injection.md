# Task 015: Context Injection

**Phase:** 3 (Integration Verification)
**Status:** complete
**depends-on:** []

## Description

Verify message to XML conversion for LLM context injection.

## Implementation Location

`src/teams/context-injection.ts` (96 lines)

## BDD Scenario

```gherkin
Feature: Context Injection
  As a teammate agent
  I want pending messages injected into my context
  So that I can receive team communications

  Scenario: Format message as XML
    Given a TeamMessage with type "message"
    When formatMessageAsXml is called
    Then output is valid XML with <teammate-message> tag
    And tag includes teammate_id, type, summary attributes

  Scenario: Escape XML content
    Given message content contains "<script>alert('xss')</script>"
    When formatMessageAsXml is called
    Then content is properly escaped
    And XML structure is not broken

  Scenario: Format multiple messages
    Given 3 pending messages
    When formatMessagesForInjection is called
    Then all messages are formatted as separate XML tags

  Scenario: Include shutdown protocol attributes
    Given a shutdown_request message
    When formatMessageAsXml is called
    Then request_id attribute is included
```

## XML Output Format

```xml
<teammate-message teammate_id="researcher-1" type="message" summary="Found critical bug">
Found a critical security vulnerability in the auth module at src/auth/jwt.ts:42.
The token expiration check is bypassed when using admin claims.
</teammate-message>
```

## Shutdown Protocol Format

```xml
<teammate-message teammate_id="team-lead" type="shutdown_request" request_id="abc-123">
Task complete, wrapping up the session
</teammate-message>

<teammate-message teammate_id="researcher-1" type="shutdown_response" request_id="abc-123" approve="true">
</teammate-message>
```

## Key Functions

- `formatMessageAsXml(message)` - Convert single message
- `formatMessagesForInjection(messages)` - Convert all messages
- `escapeXml(content)` - Escape special characters

## Verification

```bash
pnpm test src/teams/context-injection.test.ts
```
