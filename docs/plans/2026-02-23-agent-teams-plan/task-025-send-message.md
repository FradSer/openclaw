# Task 025: SendMessage Tool Implementation

**Phase:** 4 (Communication Tools)
**Status:** pending
**depends-on**: ["task-024-send-message-tests.md"]

## Description

Implement the SendMessage tool that sends messages between team members via inbox directories.

## Files to Create

- `src/agents/tools/teams/send-message.ts` - SendMessage tool implementation
- `src/teams/inbox.ts` - Inbox storage operations

## Implementation Requirements

### Tool Definition

Create tool using AnyAgentTool pattern:

1. **Tool Name**: `send_message`

2. **Parameters** (using TypeBox schema):
   - `team_name`: string - Required
   - `type`: 'message' | 'broadcast' | 'shutdown_request' | 'shutdown_response' - Required
   - `recipient`: string - Required for 'message' type
   - `content`: string - Required
   - `summary`: string - Optional (5-10 words)
   - `request_id`: string - Optional for shutdown types
   - `approve`: boolean - Optional for 'shutdown_response'
   - `reason`: string - Optional for 'shutdown_response'

3. **Execute Function**: Send message

### Inbox Storage Functions

Create inbox helper functions:

1. `writeInboxMessage(teamDir: string, message: TeamMessage): Promise<void>`
   - Creates inbox directory if needed
   - Writes message to recipient's messages.jsonl
   - Uses atomic append with mode 0o600
   - For broadcast, writes to all members except sender

2. `readPendingMessages(sessionKey: string, teamDir: string): Promise<TeamMessage[]>`
   - Reads messages.jsonl for session
   - Returns array of messages
   - Returns empty array if file doesn't exist

3. `clearProcessedMessages(sessionKey: string, teamDir: string): Promise<void>`
   - Deletes messages.jsonl after processing
   - Handles ENOENT gracefully

### Implementation Steps

1. Validate team name format using validateTeamNameOrThrow
2. Validate message type and required parameters
3. Validate content length (max 100KB)
4. Generate message ID using randomUUID
5. Generate summary if not provided
6. Create TeamMessage object
7. Get team directory path
8. Call writeInboxMessage to persist message
9. Return success response

### Response Format

```json
{
  "messageId": "uuid",
  "type": "message",
  "delivered": true
}
```

### Summary Generation

```typescript
function summarizeMessage(content: string, maxWords = 10): string {
  const words = content.trim().split(/\s+/);
  if (words.length <= maxWords) {
    return content;
  }
  return words.slice(0, maxWords).join(' ') + '...';
}
```

## Constraints

- Use sanitizeSessionKey for inbox directory paths
- Ensure broadcast excludes sender
- Validate type-specific required fields
- Use JSONL format (one JSON object per line)

## Verification

Run tests: `pnpm test src/agents/tools/teams/send-message.test.ts`

Ensure all tests pass (GREEN).