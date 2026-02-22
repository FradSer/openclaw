# Task 007: Team Manager Implementation

**Phase:** 1 (Core Infrastructure)
**Status:** pending
**depends-on:** ["task-006-manager-tests.md"]

## Description

Implement the TeamManager class that orchestrates team storage and ledger operations. This is the central coordinator for all team-related operations.

## Files to Create

- `src/teams/manager.ts` - Team manager implementation

## Implementation Requirements

### TeamManager Class

Create a `TeamManager` class with:

1. **Constructor**: `constructor(teamName: string, stateDir: string)`
   - Validates team name
   - Creates ledger instance
   - Loads team config

2. **Task Operations**

   - `createTask(params: CreateTaskParams): Promise<string>`
     - Generates UUID for task
     - Validates task limits (max 1000 per team)
     - Validates description length (max 10000 chars)
     - Computes blockedBy from dependsOn (queries existing tasks)
     - Detects circular dependencies
     - Inserts task into ledger with status 'pending'
     - Returns task ID

   - `listTasks(options?: TaskListOptions): Promise<Task[]>`
     - Query tasks with optional filters (status, owner)
     - Include completed tasks if requested
     - Return tasks sorted by createdAt (newest first)

   - `claimTask(taskId: string, sessionKey: string): Promise<TaskClaimResult>`
     - Use atomic UPDATE with WHERE clause
     - Retry on SQLITE_BUSY (max 5 attempts, exponential backoff)
     - Return success/failure result

   - `completeTask(taskId: string, sessionKey: string): Promise<void>`
     - Verify task is owned by sessionKey
     - Update status to 'completed'
     - Find tasks blocked by this task
     - Remove from blockedBy for each dependent
     - Unblock dependent if no remaining dependencies

   - `updateTaskStatus(taskId: string, status: string, sessionKey: string): Promise<void>`
     - Verify task ownership
     - Update status field
     - Update timestamps (claimedAt, completedAt) as appropriate

3. **Member Operations**

   - `addMember(member: TeamMember): Promise<void>`
     - Insert member into ledger
     - Validate member count (max 10 per team)

   - `listMembers(): Promise<TeamMember[]>`
     - Query all members
     - Return sorted by joinedAt

   - `updateMemberActivity(sessionKey: string): Promise<void>`
     - Update lastActiveAt timestamp

4. **Team State**

   - `getTeamState(): Promise<TeamState>`
     - Load team config
     - Load members
     - Query task counts by status
     - Return aggregated state

5. **Close**

   - `close(): void`
     - Close ledger connection

### Dependency Resolution Logic

Implement circular dependency detection:
```typescript
function detectCircularDependency(taskId: string, dependsOn: string[], allTasks: Task[]): boolean {
  function hasCycle(current: string, visited: Set<string>): boolean {
    if (visited.has(current)) return true;
    visited.add(current);
    const deps = allTasks.find(t => t.id === current)?.dependsOn ?? [];
    for (const dep of deps) {
      if (dep === taskId) return true;
      if (hasCycle(dep, new Set(visited))) return true;
    }
    return false;
  }
  return hasCycle(taskId, new Set());
}
```

## Constraints

- All database operations use prepared statements
- Implement retry logic for SQLITE_BUSY
- Validate all input parameters
- Enforce resource limits

## Verification

Run tests: `pnpm test src/teams/manager.test.ts`

Ensure all tests pass (GREEN).