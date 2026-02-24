# Task 029: Inbox Structure Implementation

**Phase:** 4 (Communication Tools)
**Status:** pending
**depends-on:** ["task-028-inbox-tests.md"]

## Description

Implement inbox structure for message persistence.

## BDD Scenario

```gherkin
Feature: Inbox Implementation
  As a developer
  I want inbox storage
  So that messages persist

  # Must pass all scenarios from Task 028
  Scenario: Message persists if recipient offline
    Given message is sent
    When recipient comes online
    Then message is available
```

## Files to Create

- `src/teams/inbox.ts` - Inbox implementation

## Implementation Requirements

### Directory Structure

```
~/.openclaw/teams/{team}/inbox/{member_id}/messages.jsonl
```

### Key Methods

- `createInbox(teamName: string, memberId: string)` - Create inbox
- `storeMessage(teamName: string, message: TeamMessage)` - Write message
- `getMessages(teamName: string, memberId: string)` - Read pending messages
- `markDelivered(teamName: string, memberId: string, messageId: string)` - Mark delivered

## Verification

Run tests: `pnpm test src/teams/inbox.test.ts`

Ensure all tests pass (GREEN).
