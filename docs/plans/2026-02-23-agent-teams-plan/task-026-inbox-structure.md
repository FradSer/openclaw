# Task 026: Inbox Directory Structure

**Phase:** 4 (Communication Tools)
**Status:** pending
**depends-on**: ["task-025-send-message.md"]

## Description

Create the inbox directory structure and helper functions for team message storage. This includes inbox initialization, session key sanitization, and message persistence.

## Files to Create

- `src/teams/inbox.ts` - Inbox structure and operations

## Implementation Requirements

### Directory Structure

Create inbox directory at: `~/.openclaw/teams/{team_name}/inbox/{session_key}/`

Each inbox contains:
- `messages.jsonl` - Message queue (one JSON object per line)

### Functions

1. `ensureInboxDirectory(teamDir: string, sessionKey: string): Promise<string>`
   - Creates inbox directory structure
   - Returns full path to inbox
   - Uses sanitizeSessionKey for session key

2. `sanitizeSessionKey(sessionKey: string): string`
   - Removes dangerous characters (., /, \)
   - Limits to 100 characters
   - Returns safe path component

3. `writeInboxMessage(inboxDir: string, message: TeamMessage): Promise<void>`
   - Appends message to messages.jsonl
   - Uses JSONL format (JSON object + newline)
   - Sets file mode to 0o600
   - Handles directory creation if needed

4. `readInboxMessages(inboxDir: string): Promise<TeamMessage[]>`
   - Reads messages.jsonl
   - Parses each line as JSON
   - Returns array of messages
   - Returns empty array if file doesn't exist

5. `clearInboxMessages(inboxDir: string): Promise<void>`
   - Deletes messages.jsonl
   - Handles ENOENT gracefully

### Security

- Always sanitize session keys for directory paths
- Use restricted file mode (0o600) for message files
- Validate team names to prevent path traversal

## Constraints

- Use fs.mkdir with recursive: true
- Use fs.appendFile for message writing
- Use fs.unlink for message clearing

## Verification

1. Create test file `src/teams/inbox.test.ts`
2. Test directory creation
3. Test message writing and reading
4. Test session key sanitization
5. Run tests: `pnpm test src/teams/inbox.test.ts`

## BDD Scenario References

- Feature 3: Mailbox Communication (Scenarios 18-19)