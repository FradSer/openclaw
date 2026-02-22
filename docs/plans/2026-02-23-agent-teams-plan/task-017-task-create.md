# Task 017: TaskCreate Tool Implementation

**Phase:** 3 (Task Management Tools)
**Status:** pending
**depends-on**: ["task-016-task-create-tests.md"]

## Description

Implement the TaskCreate tool that adds new tasks to the team ledger.

## Files to Create

- `src/agents/tools/teams/task-create.ts` - TaskCreate tool implementation

## Implementation Requirements

### Tool Definition

Create tool using AnyAgentTool pattern:

1. **Tool Name**: `task_create`

2. **Parameters** (using TypeBox schema):
   - `team_name`: string - Required
   - `subject`: string (1-200 chars) - Required
   - `description`: string (1-10000 chars) - Required
   - `activeForm`: string (max 100 chars) - Optional
   - `dependsOn`: array of strings - Optional
   - `metadata`: Record<string, unknown> - Optional

3. **Execute Function**: Create task

### Implementation Steps

1. Validate team name format using validateTeamNameOrThrow
2. Validate subject and description length
3. Get TeamManager using getTeamManager
4. Get team config to verify team exists
5. Call manager.createTask with parameters
6. Return success response with task ID

### Response Format

```json
{
  "taskId": "uuid",
  "teamName": "team_name",
  "status": "pending"
}
```

### Error Handling

- Throw ToolInputError for invalid team name
- Throw ToolInputError for validation failures
- Wrap manager errors with descriptive messages

## Constraints

- Use TypeBox for parameter validation
- Enforce character limits on subject and description
- Use manager for dependency resolution and circular detection

## Verification

Run tests: `pnpm test src/agents/tools/teams/task-create.test.ts`

Ensure all tests pass (GREEN).