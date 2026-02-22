# Task 024: SendMessage Tool Tests

**Phase:** 4 (Communication Tools)
**Status:** pending
**depends-on**: ["task-023-task-complete.md"]

## Description

Create tests for the SendMessage tool that sends messages between team members. Use test doubles for file system operations and message persistence.

## Files to Create

- `src/agents/tools/teams/send-message.test.ts` - SendMessage tool tests

## Test Requirements

### Direct Message

1. Test sends direct message to specific recipient
2. Test writes message to recipient's inbox
3. Test generates unique message ID
4. Test sets message timestamp

### Broadcast

1. Test broadcasts message to all teammates
2. Test writes message to all member inboxes
3. Test excludes sender from broadcast recipients

### Message Types

1. Test sends 'message' type
2. Test sends 'broadcast' type
3. Test sends 'shutdown_request' type
4. Test sends 'shutdown_response' type

### Shutdown Protocol

1. Test includes requestId for shutdown_request
2. Test includes requestId for shutdown_response
3. Test includes approve boolean for shutdown_response
4. Test includes reason for rejected shutdown

### Message Summary

1. Test generates summary from content
2. Test limits summary to 5-10 words
3. Test includes summary in message

### Validation Errors

1. Test validates team name format
2. Test validates recipient session key
3. Test validates message type enum
4. Test validates content length (max 100KB)

### Mock Strategy

Mock file system operations:
- Track message writes to inbox directories
- Return mock message data for reads
- Simulate directory creation

## BDD Scenario References

- Feature 3: Mailbox Communication (Scenarios 1-6, 10-14, 18)
  - Scenario 1: Send direct message to teammate
  - Scenario 5: Broadcast message to all teammates
  - Scenario 8: Send shutdown request to member
  - Scenario 9: Shutdown response with approval
  - Scenario 10: Shutdown response with rejection and reason

## Verification

Run tests: `pnpm test src/agents/tools/teams/send-message.test.ts`

Ensure all tests fail (RED) before implementation.