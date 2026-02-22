# Task 001: TypeScript Types

**Phase:** 1 (Core Infrastructure)
**Status:** pending
**depends-on:** []

## Description

Define TypeScript interfaces and types for teams, tasks, members, and messages. These types are used throughout the teams subsystem and must provide type safety for all team-related operations.

## Files to Create

- `src/teams/types.ts` - Core type definitions

## Implementation Requirements

### Team Types

Define the following interfaces:

1. **TeamConfig**: Team configuration persisted to file
   - `id: string` - UUID
   - `name: string` - Path-safe team identifier (1-50 chars, alphanumeric/hyphen/underscore)
   - `description?: string` - Human-readable description
   - `agentType?: string` - Agent type for team lead
   - `createdAt: number` - Unix timestamp
   - `updatedAt: number` - Unix timestamp
   - `status: 'active' | 'shutdown'`
   - `leadSessionKey: string` - Session key of team lead

2. **TeamMember**: Team member in SQLite
   - `sessionKey: string` - Primary key
   - `agentId: string` - Agent type ID
   - `name?: string` - Display name
   - `role: 'lead' | 'member'`
   - `joinedAt: number` - Unix timestamp
   - `lastActiveAt?: number` - Unix timestamp

3. **Task**: Task in SQLite ledger
   - `id: string` - UUID
   - `subject: string` - Task subject (max 200 chars)
   - `description: string` - Task description (max 10000 chars)
   - `activeForm?: string` - Present continuous form (max 100 chars)
   - `status: 'pending' | 'claimed' | 'in_progress' | 'completed' | 'failed'`
   - `owner?: string` - Session key of claiming agent
   - `dependsOn?: string[]` - Dependency task IDs
   - `blockedBy?: string[]` - Computed blocking task IDs
   - `metadata?: Record<string, unknown>` - Additional metadata
   - `createdAt: number` - Unix timestamp
   - `claimedAt?: number` - Unix timestamp
   - `completedAt?: number` - Unix timestamp

4. **TeamMessage**: Message for agent-to-agent communication
   - `id: string` - UUID
   - `from: string` - Sender session key
   - `to?: string` - Recipient session key (optional for broadcast)
   - `type: 'message' | 'broadcast' | 'shutdown_request' | 'shutdown_response' | 'idle'`
   - `content: string` - Message content (max 100KB)
   - `summary?: string` - 5-10 word summary for UI preview
   - `requestId?: string` - For shutdown protocol
   - `approve?: boolean` - For shutdown_response
   - `reason?: string` - For shutdown_response reject
   - `timestamp: number` - Unix timestamp

5. **TeamState**: Aggregated team state for injection
   - `id: string` - Team ID
   - `name: string` - Team name
   - `description?: string` - Team description
   - `status: 'active' | 'shutdown'`
   - `members: TeamMember[]`
   - `pendingTaskCount: number`
   - `inProgressTaskCount: number`
   - `completedTaskCount: number`

6. **TaskClaimResult**: Result of task claim attempt
   - `success: boolean`
   - `taskId: string`
   - `error?: string`

## Constraints

- Use strict TypeScript types
- No `any` types
- Export all types for use across the teams subsystem
- Ensure types are serializable for JSON persistence

## Verification

1. Create test file `src/teams/types.test.ts`
2. Test that all types are properly exported
3. Verify type safety with sample instantiations
4. Run tests: `pnpm test src/teams/types.test.ts`

## BDD Scenario References

This task provides the type foundation for all subsequent scenarios.