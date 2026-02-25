# Task 014: Inbox System

**Phase:** 3 (Integration Verification)
**Status:** complete
**depends-on:** []

## Description

Verify inbox system for JSONL-based message queues.

## Implementation Location

`src/teams/inbox.ts` (144 lines)

## BDD Scenario

```gherkin
Feature: Inbox System
  As a team member
  I want my messages stored in an inbox
  So that I can receive them on my next inference

  Scenario: Write message to inbox
    Given a team and recipient exist
    When writeInboxMessage is called
    Then message is appended to inbox/{sessionKey}/messages.jsonl
    And file has correct permissions (0600)

  Scenario: Read pending messages
    Given 3 messages exist in inbox
    When readInboxMessages is called
    Then all 3 messages are returned as parsed objects

  Scenario: Clear processed messages
    Given messages exist in inbox
    When clearInboxMessages is called
    Then messages.jsonl file is deleted

  Scenario: Handle empty inbox
    Given no messages exist
    When readInboxMessages is called
    Then an empty array is returned

  Scenario: Sanitize session key for path
    Given session key "agent:main:user@example.com"
    When inbox path is created
    Then path uses sanitized name without special characters
```

## Key Functions

- `sanitizeSessionKey(sessionKey)` - Remove dangerous characters
- `ensureInboxDirectory(teamName, teamsDir, sessionKey)` - Create inbox dir
- `writeInboxMessage(teamName, teamsDir, recipient, message)` - Append message
- `readInboxMessages(teamName, teamsDir, sessionKey)` - Read all messages
- `clearInboxMessages(teamName, teamsDir, sessionKey)` - Delete messages file
- `listMembers(teamName, teamsDir)` - List members for broadcast

## Session Key Sanitization

```typescript
function sanitizeSessionKey(sessionKey: string): string {
  return sessionKey
    .replace(/[./\\]/g, "_")
    .replace(/:/g, "_")
    .substring(0, 100);
}
```

## Directory Structure

```
~/.openclaw/teams/{team}/inbox/
└── {sanitized_session_key}/
    └── messages.jsonl
```

## Verification

```bash
pnpm test src/teams/inbox.test.ts
```
