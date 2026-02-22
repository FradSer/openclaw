# Task 012: TeammateSpawn Tool Implementation

**Phase:** 2 (Team Lifecycle Tools)
**Status:** pending
**depends-on:** ["task-011-teammate-spawn-tests.md"]

## Description

Implement the TeammateSpawn tool that creates a new teammate session and adds it to the team as a member.

## Files to Create

- `src/agents/tools/teams/teammate-spawn.ts` - TeammateSpawn tool implementation

## Implementation Requirements

### Tool Definition

Create tool using AnyAgentTool pattern:

1. **Tool Name**: `teammate_spawn`

2. **Parameters** (using TypeBox schema):
   - `team_name`: string - Required
   - `name`: string - Required (teammate display name)
   - `agent_id`: string - Optional
   - `model`: string - Optional

3. **Execute Function**: Spawn teammate session

### Implementation Steps

1. Validate team name format using validateTeamNameOrThrow
2. Check if team exists (using teamDirectoryExists)
3. Get TeamManager using getTeamManager
4. Get team config to validate team is active
5. Call sessions-spawn tool with:
   - task: Task description mentioning joining the team
   - agentId: agent_id parameter or team config agentType
   - agentChannel: opts.agentChannel
   - agentAccountId: opts.agentAccountId
6. Get the spawned session key from response
7. Create TeamMember record:
   - sessionKey: spawned session key
   - agentId: agent_id parameter
   - name: name parameter
   - role: 'member'
   - joinedAt: current timestamp
8. Add member to ledger using addMember
9. Return success response with session info

### Response Format

```json
{
  "sessionId": "spawned-session-key",
  "agentId": "agent-type-id",
  "name": "teammate-name",
  "teamName": "team_name"
}
```

### Error Handling

- Throw ToolInputError for invalid team name
- Throw ToolInputError for non-existent team
- Wrap spawn errors with descriptive messages

## Constraints

- Use existing sessions-spawn mechanism
- Validate team exists before spawning
- Add member to ledger only after successful spawn
- Use connection pool for manager access

## Verification

Run tests: `pnpm test src/agents/tools/teams/teammate-spawn.test.ts`

Ensure all tests pass (GREEN).