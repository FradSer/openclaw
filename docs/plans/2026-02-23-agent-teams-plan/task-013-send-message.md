# Task 013: send_message Tool

**Phase:** 2 (Tool Verification)
**Status:** complete
**depends-on:** []

## Description

Verify send_message tool sends messages between team members via inbox directories.

## Implementation Location

`src/agents/tools/teams/send-message.ts` (128 lines)

## BDD Scenario

```gherkin
Feature: send_message Tool
  As a team member
  I want to send messages to other members
  So that we can coordinate our work

  Scenario: Send direct message
    Given a team "alpha-squad" exists with member "researcher"
    When I call send_message with type "message" to "researcher"
    Then the message is written to inbox/researcher/messages.jsonl
    And message includes from, type, content, timestamp

  Scenario: Broadcast to all members
    Given a team with 3 members exists
    When I call send_message with type "broadcast"
    Then all members except sender receive the message
    And each gets their own inbox entry

  Scenario: Send shutdown request
    When I call send_message with type "shutdown_request"
    Then message includes request_id
    And recipient receives the request

  Scenario: Send shutdown response
    Given a shutdown request with request_id exists
    When I call send_message with type "shutdown_response"
    Then message includes request_id and approve flag
    And optional reason if rejected

  Scenario: Reject message without recipient for type "message"
    When I call send_message with type "message" without recipient
    Then the operation fails with "recipient is required"
```

## Tool Schema

```typescript
{
  team_name: string;     // Required
  type: "message" | "broadcast" | "shutdown_request" | "shutdown_response";
  recipient?: string;    // Required for "message" type
  content: string;       // Required: Max 100KB
  summary?: string;      // Optional: Max 50 chars
  request_id?: string;   // Required for shutdown protocol
  approve?: boolean;     // Required for shutdown_response
  reason?: string;       // Optional: Rejection reason
}
```

## Output

```typescript
{
  messageId: string;
  type: string;
  delivered: boolean;
}
```

## Message Types

| Type                | Description                  |
| ------------------- | ---------------------------- |
| `message`           | Direct message to recipient  |
| `broadcast`         | To all members except sender |
| `shutdown_request`  | Request graceful shutdown    |
| `shutdown_response` | Approve/reject shutdown      |

## Verification

```bash
pnpm test src/agents/tools/teams/send-message.test.ts
```
