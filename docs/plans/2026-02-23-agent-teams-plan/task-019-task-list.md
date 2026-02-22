# Task 019: TaskList Tool Implementation

**Phase:** 3 (Task Management Tools)
**Status:** pending
**depends-on**: ["task-018-task-list-tests.md"]

## Description

Implement the TaskList tool that queries tasks from the team ledger with filtering options.

## Files to Create

- `src/agents/tools/teams/task-list.ts` - TaskList tool implementation

## Implementation Requirements

### Tool Definition

Create tool using AnyAgentTool pattern:

1. **Tool Name**: `task_list`

2. **Parameters** (using TypeBox schema):
   - `team_name`: string - Required
   - `status`: string - Optional ('pending', 'claimed', 'in_progress', 'completed', 'failed')
   - `owner`: string - Optional
   - `includeCompleted`: boolean - Optional (default: false)

3. **Execute Function**: List tasks

### Implementation Steps

1. Validate team name format using validateTeamNameOrThrow
2. Get TeamManager using getTeamManager
3. Get team config to verify team exists
4. Call manager.listTasks with options
5. Return tasks array in response

### Response Format

```json
[
  {
    "id": "uuid",
    "subject": "Task subject",
    "description": "Task description",
    "activeForm": "Tasking",
    "status": "pending",
    "owner": "session-key",
    "dependsOn": ["task-id-1"],
    "blockedBy": [],
    "metadata": {},
    "createdAt": 1234567890,
    "claimedAt": null,
    "completedAt": null
  }
]
```

### Error Handling

- Throw ToolInputError for invalid team name
- Handle empty team gracefully
- Wrap manager errors with descriptive messages

## Constraints

- Default to excluding completed tasks
- Sort results by createdAt descending
- Return empty array for no matches

## Verification

Run tests: `pnpm test src/agents/tools/teams/task-list.test.ts`

Ensure all tests pass (GREEN).