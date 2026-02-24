# Task 027: SendMessage Tool Implementation

**Phase:** 4 (Communication Tools)
**Status:** pending
**depends-on:** ["task-026-send-message-tests.md"]

## Description

Implement SendMessage tool for teammate communication.

## BDD Scenario

```gherkin
Feature: SendMessage Implementation
  As a team member
  I want to send messages
  So that communication works

  # Must pass all scenarios from Task 026
  Scenario: Send direct message to teammate
    Given a team with members
    When message is sent
    Then it is stored in recipient inbox
```

## Files to Create

- `src/agents/tools/teams/send-message.ts` - SendMessage tool

## Implementation Requirements

### Input Parameters

```typescript
{
  team_name: string;           // Required: Team context
  type: "message" | "broadcast" | "shutdown_request";
  recipient?: string;          // Required for message type
  content: string;             // Required: Message content
  request_id?: string;         // Required for shutdown_request
  approve?: boolean;           // Required for shutdown_response
  reason?: string;             // Optional: Reject reason
  summary?: string;            // Optional: 5-10 word summary
}
```

### Message Types

- `message` - Direct message to recipient
- `broadcast` - Message to all team members
- `shutdown_request` - Request member approval
- `shutdown_response` - Member response (via tool)

## Verification

Run tests: `pnpm test src/agents/tools/teams/send-message.test.ts`

Ensure all tests pass (GREEN).
