# Task 028: Message Injection Implementation

**Phase:** 4 (Communication Tools)
**Status:** pending
**depends-on**: ["task-027-message-injection-tests.md"]

## Description

Implement message injection that converts pending inbox messages into XML tags for inclusion in the agent context.

## Files to Create

- `src/teams/context-injection.ts` - Message injection implementation

## Implementation Requirements

### Message Injection Function

1. `injectPendingMessages(session: SessionEntry, stateDir: string): Promise<string>`
   - Check if session has teamId
   - Get team directory path
   - Read pending messages using readInboxMessages
   - Generate XML for each message
   - Clear processed messages using clearInboxMessages
   - Return concatenated XML string

### XML Format Generation

```typescript
function messageToXml(message: TeamMessage): string {
  const fromName = resolveAgentName(message.from);
  const attrs = [`teammate_id="${fromName}"`, `type="${message.type}"`];

  if (message.summary) {
    attrs.push(`summary="${message.summary}"`);
  }
  if (message.requestId) {
    attrs.push(`request_id="${message.requestId}"`);
  }
  if (message.approve !== undefined) {
    attrs.push(`approve="${message.approve}"`);
  }
  if (message.reason) {
    attrs.push(`reason="${message.reason}"`);
  }

  const content = escapeXml(message.content);
  return `<teammate-message ${attrs.join(' ')}>\n${content}\n</teammate-message>\n`;
}
```

### XML Escaping

```typescript
function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
```

### Agent Name Resolution

```typescript
function resolveAgentName(sessionKey: string): string {
  // Look up agent name from session or members table
  // Fall back to session key if name not found
  return sessionKey;
}
```

## Constraints

- Only inject messages if session has teamId
- Clear messages after reading to prevent re-injection
- Escape XML special characters in content
- Use consistent formatting (newlines between tags)

## Verification

Run tests: `pnpm test src/teams/context-injection.test.ts`

Ensure all tests pass (GREEN).