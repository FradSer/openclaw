# Task 027: Message Injection Tests

**Phase:** 4 (Communication Tools)
**Status:** pending
**depends-on**: ["task-026-inbox-structure.md"]

## Description

Create tests for message injection into the agent context, including XML format generation and message processing.

## Files to Create

- `src/teams/context-injection.test.ts` - Message injection tests

## Test Requirements

### Message Injection

1. Test reads pending messages from inbox
2. Test generates XML tags for each message
3. Test includes teammate_id attribute
4. Test includes type attribute
5. Test includes summary when present
6. Test includes request_id when present
7. Test includes approve when present
8. Test clears processed messages after reading

### XML Format

1. Test generates <teammate-message> opening tag with attributes
2. Test includes content between tags
3. Test generates closing </teammate-message> tag
4. Test escapes XML special characters in content

### No Team Context

1. Test returns empty string when session has no teamId
2. Test returns empty string when team inbox is empty

### Multiple Messages

1. Test processes multiple messages in order
2. Test generates separate XML blocks for each message
3. Test clears all messages after processing

### Message Persistence

1. Test preserves messages if recipient offline
2. Test processes messages on next inference

### Mock Strategy

Mock inbox operations:
- Return mock message arrays
- Track clear operations
- Simulate empty inbox

## BDD Scenario References

- Feature 3: Mailbox Communication (Scenarios 2-3, 19)
  - Scenario 2: Message delivery is automatic
  - Scenario 3: Message delivered only to intended recipient
  - Scenario 19: Message queue processed on next inference

## Verification

Run tests: `pnpm test src/teams/context-injection.test.ts`

Ensure all tests fail (RED) before implementation.