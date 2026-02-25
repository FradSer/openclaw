# Task 001: TypeScript Types

**Phase:** 1 (Core Infrastructure)
**Status:** complete
**depends-on:** []

## Description

Verify TypeScript interfaces and types for teams, tasks, members, and messages match the SQLite schema and support all operations.

## Implementation Location

`src/teams/types.ts` (170 lines)

## BDD Scenario

```gherkin
Feature: TypeScript Type Definitions
  As a developer
  I want type-safe interfaces for team operations
  So that compile-time errors catch data mismatches

  Scenario: TeamConfig interface matches SQLite schema
    Given the TeamConfig interface is defined
    When I create a team config object
    Then it has id, name, description, agentType, createdAt, updatedAt, status, leadSessionKey
    And all fields have correct TypeScript types

  Scenario: Task interface supports all status values
    Given the Task interface is defined
    When I create a task with each status
    Then 'pending', 'claimed', 'in_progress', 'completed', 'failed' are all valid
    And TypeScript enforces only these values

  Scenario: TeamMessage supports all message types
    Given the TeamMessage interface is defined
    When I create messages of different types
    Then 'message', 'broadcast', 'shutdown_request', 'shutdown_response', 'idle' are valid
    And optional fields are properly typed

  Scenario: TeamMember interface supports roles
    Given the TeamMember interface is defined
    When I create a member
    Then role is restricted to 'lead' or 'member'
    And sessionKey is the primary key
```

## Defined Types

### TeamConfig

- `id: string` - UUID
- `name: string` - Path-safe identifier (1-50 chars)
- `description?: string`
- `agentType?: string`
- `createdAt: number` - Unix timestamp
- `updatedAt: number` - Unix timestamp
- `status: "active" | "shutdown"`
- `leadSessionKey: string`

### Task

- `id: string` - UUID
- `subject: string` - Max 200 chars
- `description: string` - Max 10000 chars
- `activeForm?: string`
- `status: "pending" | "claimed" | "in_progress" | "completed" | "failed"`
- `owner?: string`
- `dependsOn?: string[]`
- `blockedBy?: string[]`
- `metadata?: Record<string, unknown>`
- `createdAt: number`
- `claimedAt?: number`
- `completedAt?: number`

### TeamMember

- `sessionKey: string` - Primary key
- `agentId: string`
- `name?: string`
- `role: "lead" | "member"`
- `joinedAt: number`
- `lastActiveAt?: number`

### TeamMessage

- `id: string`
- `from: string`
- `to?: string`
- `type: "message" | "broadcast" | "shutdown_request" | "shutdown_response" | "idle"`
- `content: string` - Max 100KB
- `summary?: string`
- `requestId?: string`
- `approve?: boolean`
- `reason?: string`
- `timestamp: number`

### Supporting Types

- `TeamState` - Aggregated team state
- `TaskClaimResult` - Claim operation result
- `CreateTaskParams` - Task creation parameters
- `TaskListOptions` - Task query options

## Verification

```bash
pnpm test src/teams/types.test.ts
```

Ensure all type tests pass.
