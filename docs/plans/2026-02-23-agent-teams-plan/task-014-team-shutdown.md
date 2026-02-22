# Task 014: TeamShutdown Tool Implementation

**Phase:** 2 (Team Lifecycle Tools)
**Status:** pending
**depends-on**: ["task-013-team-shutdown-tests.md"]

## Description

Implement the TeamShutdown tool that initiates graceful team shutdown with member approval protocol.

## Files to Create

- `src/agents/tools/teams/team-shutdown.ts` - TeamShutdown tool implementation

## Implementation Requirements

### Tool Definition

Create tool using AnyAgentTool pattern:

1. **Tool Name**: `team_shutdown`

2. **Parameters** (using TypeBox schema):
   - `team_name`: string - Required
   - `reason`: string - Optional (shutdown reason)

3. **Execute Function**: Initiate shutdown sequence

### Implementation Steps

1. Validate team name format using validateTeamNameOrThrow
2. Check if team exists (using teamDirectoryExists)
3. Get TeamManager using getTeamManager
4. Get team config to verify status is 'active'
5. List all members using listMembers
6. Filter for active members (role === 'member', not idle)

If no active members:
- Update team config status to 'shutdown'
- Delete team directory using deleteTeamDirectory
- Close team manager using closeTeamManager
- Return success response

If active members exist:
- Generate unique requestId using randomUUID
- Send shutdown_request message to each member via SendMessage
- Wait for responses (this is initiated, responses handled asynchronously)
- Return pending shutdown status with requestId

Shutdown completion is handled when all members respond with approve=true via SendMessage with type='shutdown_response'.

### Response Format

Immediate (no members):
```json
{
  "teamId": "team-id",
  "status": "shutdown",
  "deleted": true
}
```

Pending (with members):
```json
{
  "teamId": "team-id",
  "status": "pending_shutdown",
  "requestId": "uuid",
  "pendingApprovals": ["member-key-1", "member-key-2"]
}
```

### Shutdown Response Handling

Shutdown responses are handled via SendMessage with type='shutdown_response':
- Track responses by requestId
- When all members approve, complete shutdown
- If any member rejects, report rejection reason

## Constraints

- Only team lead can initiate shutdown
- Require approval from all active members
- Delete team directory only after successful shutdown
- Close manager connection

## Verification

Run tests: `pnpm test src/agents/tools/teams/team-shutdown.test.ts`

Ensure all tests pass (GREEN).