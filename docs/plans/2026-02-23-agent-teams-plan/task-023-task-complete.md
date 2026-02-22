# Task 023: TaskComplete Tool Implementation

**Phase:** 3 (Task Management Tools)
**Status:** pending
**depends-on**: ["task-022-task-complete-tests.md"]

## Description

Implement the TaskComplete tool that marks tasks as completed and unblocks dependent tasks.

## Files to Create

- `src/agents/tools/teams/task-complete.ts` - TaskComplete tool implementation

## Implementation Requirements

### Tool Definition

Create tool using AnyAgentTool pattern:

1. **Tool Name**: `task_complete`

2. **Parameters** (using TypeBox schema):
   - `team_name`: string - Required
   - `task_id`: string - Required

3. **Execute Function**: Complete task

### Implementation Steps

1. Validate team name format using validateTeamNameOrThrow
2. Get TeamManager using getTeamManager
3. Get team config to verify team exists
4. Call manager.completeTask with taskId and opts.agentSessionKey
5. Return success response

### Response Format

Success:
```json
{
  "taskId": "uuid",
  "status": "completed",
  "unblocked": ["task-id-1", "task-id-2"]
}
```

### Error Handling

- Throw ToolInputError for invalid team name
- Throw ToolInputError for non-existent task
- Throw ToolInputError if task not owned by session
- Wrap manager errors with descriptive messages

## Constraints

- Verify task ownership before completion
- Auto-unblock dependent tasks (handled by manager)
- Use agentSessionKey from tool options

## Verification

Run tests: `pnpm test src/agents/tools/teams/task-complete.test.ts`

Ensure all tests pass (GREEN).