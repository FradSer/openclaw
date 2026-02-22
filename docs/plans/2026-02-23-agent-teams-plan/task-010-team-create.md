# Task 010: TeamCreate Tool Implementation

**Phase:** 2 (Team Lifecycle Tools)
**Status:** pending
**depends-on:** ["task-009-team-create-tests.md"]

## Description

Implement the TeamCreate tool that creates a new team with its configuration, directory structure, and SQLite ledger.

## Files to Create

- `src/agents/tools/teams/team-create.ts` - TeamCreate tool implementation

## Implementation Requirements

### Tool Definition

Create tool using AnyAgentTool pattern:

1. **Tool Name**: `team_create`

2. **Parameters** (using TypeBox schema):
   - `team_name`: string (1-50 chars, alphanumeric/hyphen/underscore) - Required
   - `description`: string - Optional
   - `agent_type`: string - Optional

3. **Execute Function**: Create team setup

### Implementation Steps

1. Validate team name format using validateTeamNameOrThrow
2. Check if team already exists (using teamDirectoryExists)
3. Generate UUID for team ID
4. Create team directory structure (using createTeamDirectory)
5. Initialize team config:
   - id: generated UUID
   - name: team_name
   - description: provided or undefined
   - agentType: provided or undefined
   - createdAt: current timestamp
   - updatedAt: current timestamp
   - status: 'active'
   - leadSessionKey: opts.agentSessionKey
6. Write team config using writeTeamConfig
7. Get or create TeamManager using getTeamManager
8. Add team lead as member to ledger
9. Return success response with team ID

### Response Format

```json
{
  "teamId": "uuid",
  "teamName": "team_name",
  "status": "active"
}
```

### Error Handling

- Throw ToolInputError for invalid team name
- Throw ToolInputError for duplicate team name
- Wrap file system and database errors with descriptive messages

## Constraints

- Use TypeBox for parameter validation
- All file operations use storage functions
- Use connection pool for manager access
- Sanitize team name for directory paths

## Verification

Run tests: `pnpm test src/agents/tools/teams/team-create.test.ts`

Ensure all tests pass (GREEN).