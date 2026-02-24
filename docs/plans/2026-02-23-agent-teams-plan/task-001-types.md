# Task 001: TypeScript Types

**Phase:** 1 (Core Infrastructure)
**Status:** pending
**depends-on:** []

## Description

Define TypeScript interfaces and types for teams, tasks, members, and messages. These types are the foundation for all team-related operations and must match the SQLite schema exactly.

## BDD Scenario

This task supports all 84 BDD scenarios across 5 features. Types must support:

```gherkin
Feature: TypeScript Type Definitions
  As a developer
  I want type-safe interfaces for team operations
  So that compile-time errors catch data mismatches

  # Feature 1: Team Lifecycle (11 scenarios)
  Scenario: TeamConfig interface matches SQLite schema
    Given the TeamConfig interface is defined
    When I create a team config object
    Then it has id, name, description, agentType, createdAt, updatedAt, status, leadSessionKey
    And all fields have correct TypeScript types

  # Feature 2: Task Management (17 scenarios)
  Scenario: Task interface supports all status values
    Given the Task interface is defined
    When I create a task with each status
    Then 'pending', 'claimed', 'in_progress', 'completed', 'failed' are all valid
    And TypeScript enforces only these values

  # Feature 3: Mailbox Communication (19 scenarios)
  Scenario: TeamMessage supports all message types
    Given the TeamMessage interface is defined
    When I create messages of different types
    Then 'message', 'broadcast', 'shutdown_request', 'shutdown_response', 'idle' are valid
    And optional fields are properly typed

  # Feature 4: Concurrency Control (19 scenarios)
  Scenario: TaskClaimResult supports atomic claim operations
    Given the TaskClaimResult interface is defined
    When a task claim operation completes
    Then success boolean and error fields are properly typed

  # Feature 5: Team Lead Coordination (18 scenarios)
  Scenario: TeamState supports team coordination
    Given the TeamState interface is defined
    When querying aggregated team state
    Then all member and task count fields are properly typed
```

## Files to Create

- `src/teams/types.ts` - Core type definitions

## Implementation Requirements

### TeamConfig Interface

- `id: string` - UUID
- `name: string` - Path-safe team identifier (1-50 chars, alphanumeric/hyphen/underscore)
- `description?: string` - Human-readable description
- `agentType?: string` - Agent type for team lead
- `createdAt: number` - Unix timestamp
- `updatedAt: number` - Unix timestamp
- `status: 'active' | 'shutdown'`
- `leadSessionKey: string` - Session key of team lead

### Task Interface

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

### TeamMember Interface

- `sessionKey: string` - Primary key
- `agentId: string` - Agent type ID
- `name?: string` - Display name
- `role: 'lead' | 'member'`
- `joinedAt: number` - Unix timestamp
- `lastActiveAt?: number` - Unix timestamp

### TeamMessage Interface

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

### Supporting Types

- `TeamState` - Aggregated team state for injection
- `TaskClaimResult` - Result of task claim attempt
- `CreateTaskParams` - Parameters for creating a task
- `TaskListOptions` - Options for listing tasks

## Constraints

- Use strict TypeScript types
- No `any` types
- Export all types for use across the teams subsystem
- Ensure types are serializable for JSON persistence

## Verification

Run tests: `pnpm test src/teams/types.test.ts`

Ensure all type tests pass.
