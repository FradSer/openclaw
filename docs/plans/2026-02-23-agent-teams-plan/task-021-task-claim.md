# Task 021: TaskClaim Tool Implementation

**Phase:** 3 (Task Management Tools)
**Status:** pending
**depends-on**: ["task-020-task-claim-tests.md"]

## Description

Implement the TaskClaim tool that atomically claims tasks from the team ledger.

## Files to Create

- `src/agents/tools/teams/task-claim.ts` - TaskClaim tool implementation

## Implementation Requirements

### Tool Definition

Create tool using AnyAgentTool pattern:

1. **Tool Name**: `task_claim`

2. **Parameters** (using TypeBox schema):
   - `team_name`: string - Required
   - `task_id`: string - Required

3. **Execute Function**: Claim task

### Implementation Steps

1. Validate team name format using validateTeamNameOrThrow
2. Get TeamManager using getTeamManager
3. Get team config to verify team exists
4. Call manager.claimTask with taskId and opts.agentSessionKey
5. Handle claim result

### Response Format

Success:
```json
{
  "taskId": "uuid",
  "status": "claimed",
  "owner": "session-key"
}
```

Failure (already claimed):
```json
{
  "error": "Task already claimed",
  "taskId": "uuid"
}
```

### Error Handling

- Throw ToolInputError for invalid team name
- Throw ToolInputError for non-existent task
- Return conflict error for already claimed task
- Wrap manager errors with descriptive messages

## Constraints

- Use agentSessionKey from tool options for owner
- Atomic operation via SQL UPDATE with WHERE
- Retry on SQLITE_BUSY (handled by manager)

## Verification

Run tests: `pnpm test src/agents/tools/teams/task-claim.test.ts`

Ensure all tests pass (GREEN).