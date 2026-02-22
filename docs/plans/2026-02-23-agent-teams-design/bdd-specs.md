# Agent Teams BDD Specifications

## Overview

This document consolidates all BDD scenarios for the Agent Teams MVP. Scenarios are organized by feature area and expressed in Gherkin (Given/When/Then) format.

**Total Scenarios:** 84
**Feature Files:** 5

## Testing Strategy

### Framework
- **Primary**: Vitest for unit/integration tests
- **BDD**: Cucumber/Gherkin-compatible scenarios for behavior validation

### Coverage Targets
- Unit tests: Individual components (SQLite operations, tool handlers)
- Integration tests: Tool interactions and protocol flow
- Concurrency tests: Race condition prevention and atomic operations
- E2E tests: Complete team lifecycle workflows

### Test Organization
```
src/teams/
├── tools/
│   ├── team-create.ts
│   ├── team-create.test.ts
│   ├── teammate-spawn.ts
│   ├── teammate-spawn.test.ts
│   ├── task-create.ts
│   ├── task-create.test.ts
│   ├── task-claim.ts
│   ├── task-claim.test.ts
│   ├── task-complete.ts
│   ├── task-complete.test.ts
│   ├── send-message.ts
│   └── send-message.test.ts
├── manager.ts
├── manager.test.ts
└── ...
```

## Feature 1: Team Lifecycle

### Scenarios: 11

| # | Scenario Description |
|---|---------------------|
| 1 | Create a new team successfully |
| 2 | Create team with custom agent type for team lead |
| 3 | Create team with descriptive metadata |
| 4 | Attempt to create team with invalid name |
| 5 | Attempt to create duplicate team |
| 6 | Graceful team shutdown with no active members |
| 7 | Graceful shutdown requests member approval |
| 8 | Member approves shutdown request |
| 9 | Member rejects shutdown with reason |
| 10 | Team shutdown fails with active members |
| 11 | Team lead handles member going idle during shutdown |

### Key Behaviors

- Team configuration stored at `~/.openclaw/teams/{team_name}/config.json`
- Task list directory at `~/.openclaw/teams/{team_name}/ledger.db`
- Shutdown protocol requires member approval via `shutdown_request`/`shutdown_response`
- Team lead waits for all member responses before completing shutdown

### Example Scenario

```gherkin
Scenario: Member approves shutdown request
  Given an active team "collaborative-team"
  And member "researcher-1" is active on the team
  When the team lead requests shutdown
  And member "researcher-1" receives the shutdown request
  And member "researcher-1" responds with approval
  Then member "researcher-1" terminates its process
  And member "researcher-1" sends a shutdown_response with approve: true
  And the team lead receives the approval confirmation
```

## Feature 2: Task Management

### Scenarios: 17

| # | Scenario Description |
|---|---------------------|
| 1 | Add a single task to the team |
| 2 | Add a task with active form |
| 3 | Add task with metadata |
| 4 | List all tasks in the team |
| 5 | List only pending tasks |
| 6 | Claim an available task |
| 7 | Claim task updates active form |
| 8 | Attempt to claim already claimed task |
| 9 | Atomic task claiming prevents race conditions |
| 10 | Mark task as completed |
| 11 | Add task with dependencies |
| 12 | List tasks blocked by dependencies |
| 13 | Auto-unblock tasks when dependency completes |
| 14 | Complex dependency chain resolution |
| 15 | Circular dependency detection and prevention |
| 16 | Task completion removes from blockedBy of dependents |
| 17 | Query tasks by metadata filters |

### Key Behaviors

- Tasks have immutable: `id`, `subject`, `description`, `dependsOn`
- Tasks have mutable: `status` (pending/claimed/in_progress/completed/failed), `owner`, `activeForm`
- Atomic claiming uses SQL UPDATE with WHERE clause
- `dependsOn` defines dependencies, `blockedBy` is computed and updated on completion
- Circular dependencies detected during task creation

### Example Scenario

```gherkin
Scenario: Atomic task claiming prevents race conditions
  Given a pending task with ID 5
  And two idle members "agent-fast" and "agent-slow"
  When both members attempt to claim the task simultaneously
  Then only one member successfully claims the task
  And the other member receives a conflict error
  And the task has exactly one owner assigned
  And no partial ownership states exist
```

## Feature 3: Mailbox Communication

### Scenarios: 19

| # | Scenario Description |
|---|---------------------|
| 1 | Send direct message to teammate |
| 2 | Message delivery is automatic |
| 3 | Message delivered only to intended recipient |
| 4 | Plain text output is NOT visible to teammates |
| 5 | Broadcast message to all teammates |
| 6 | Broadcast delivers to all N teammates |
| 7 | Broadcast excludes sender |
| 8 | Send shutdown request to member |
| 9 | Shutdown response with approval |
| 10 | Shutdown response with rejection and reason |
| 11 | Shutdown protocol includes request_id |
| 12 | Response matches request_id |
| 13 | Message summary provided for UI preview |
| 14 | Summary limited to 5-10 words |
| 15 | Idle notification sent to team lead |
| 16 | Team lead does not auto-respond to idle during shutdown |
| 17 | Peer DM visibility (summary only) |
| 18 | Message persists if recipient offline |
| 19 | Message queue processed on next inference |

### Key Behaviors

- Messages stored in `~/.openclaw/teams/{team}/inbox/{recipient}/messages.jsonl`
- Messages injected into context with XML tags: `<teammate-message teammate_id="" type="">`
- Plain tool output is NOT shared - must use SendMessage for peer communication
- Shutdown protocol uses request/response pattern with unique IDs

### Example Scenario

```gherkin
Scenario: Atomic task claiming prevents race conditions
  Given a pending task with ID 5
  And two idle members "agent-fast" and "agent-slow"
  When both members attempt to claim the task simultaneously
  Then only one member successfully claims the task
  And the other member receives a conflict error
  And the task has exactly one owner assigned
  And no partial ownership states exist
```

## Feature 4: Concurrency Control

### Scenarios: 19

| # | Scenario Description |
|---|---------------------|
| 1 | WAL mode enables concurrent reads during writes |
| 2 | Multiple readers access DB during single write |
| 3 | Write operation blocks other writers |
| 4 | Lock levels: SHARED, RESERVED, PENDING, EXCLUSIVE |
| 5 | BEGIN CONCURRENT for optimistic concurrency |
| 6 | CONCURRENT rollback on conflict |
| 7 | Checkpoint starvation prevention |
| 8 | Configurable WAL checkpoint threshold |
| 9 | Atomic task claiming prevents race conditions |
| 10 | UPDATE with WHERE returns row count |
| 11 | Zero rows affected = task already claimed |
| 12 | Transaction isolation level SERIALIZABLE for claim |
| 13 | Retry logic on SQLITE_BUSY error |
| 14 | Maximum retry attempts |
| 15 | Exponential backoff between retries |
| 16 | Deadlock prevention with consistent ordering |
| 17 | Transaction timeout |
| 18 | Connection pooling handles concurrent agents |
| 19 | Connection reuse within same session |

### Key Behaviors

- SQLite WAL mode: one writer, multiple readers
- Atomic claim: `UPDATE tasks SET owner=?, claimedAt=? WHERE id=? AND status='pending' AND owner IS NULL`
- SQLITE_BUSY handled with retry logic (max 5 attempts, exponential backoff)
- Checkpoint threshold prevents WAL file growth

### Example Scenario

```gherkin
Scenario: Atomic task claiming prevents race conditions
  Given a pending task with ID 5
  And two idle members "agent-fast" and "agent-slow"
  When both members attempt to claim the task simultaneously
  Then only one member successfully claims the task
  And the other member receives a conflict error
  And the task has exactly one owner assigned
  And no partial ownership states exist
```

## Feature 5: Team Lead Coordination

### Scenarios: 18

| # | Scenario Description |
|---|---------------------|
| 1 | Team lead discovers team configuration |
| 2 | Team lead lists all members |
| 3 | Team lead queries member status |
| 4 | Team lead assigns task to idle member |
| 5 | Task assignment by member ID order preference |
| 6 | Team lead monitors task completion |
| 7 | Team lead receives completion notification |
| 8 | Team lead unblocks dependent tasks |
| 9 | Team lead coordinates shutdown sequence |
| 10 | Team lead waits for all member approvals |
| 11 | Team lead completes team deletion |
| 12 | Team lead state persists across context compression |
| 13 | Team lead knows about team after compression |
| 14 | Team lead maintains member roster in ground truth |
| 15 | Team lead handles member failure gracefully |
| 16 | Team lead spawns replacement member |
| 17 | Team lead reports progress to user |
| 18 | Team lead synthesizes results from members |

### Key Behaviors

- Team lead injects team state as "ground truth" before each inference
- Team state survives context compression
- Team lead assigns tasks preferring members by ID order (lower first)
- Team lead handles member failures by spawning replacements

### Example Scenario

```gherkin
Scenario: Team lead assigns task to idle member
  Given a team lead with two members
  And member "agent-001" is idle
  And member "agent-002" is working on another task
  When team lead has a pending task "Write documentation"
  Then team lead assigns task to "agent-001"
  And task status changes to "claimed"
  And task owner is set to "agent-001"
```

## Implementation Checklist

### Phase 1: Core Infrastructure
- [ ] Create `src/teams/manager.ts` for SQLite operations
- [ ] Create `src/config/teams/store.ts` for team config persistence
- [ ] Define TypeScript types for teams, tasks, members, messages
- [ ] Implement WAL mode configuration
- [ ] Implement connection pooling

### Phase 2: Team Tools
- [ ] Implement `TeamCreate` tool
- [ ] Implement `TeammateSpawn` tool
- [ ] Implement `TeamShutdown` tool
- [ ] Add team fields to SessionEntry type

### Phase 3: Task Tools
- [ ] Implement `TaskCreate` tool
- [ ] Implement `TaskList` tool
- [ ] Implement `TaskClaim` tool (atomic)
- [ ] Implement `TaskComplete` tool (with unblock logic)

### Phase 4: Communication Tools
- [ ] Implement `SendMessage` tool
- [ ] Implement inbox directory structure
- [ ] Implement message injection into context
- [ ] Implement shutdown protocol

### Phase 5: Testing
- [ ] Write unit tests for SQLite operations
- [ ] Write integration tests for tool interactions
- [ ] Write concurrency tests for race conditions
- [ ] Implement BDD step definitions for all 84 scenarios

## References

- Full feature files: `/Users/FradSer/Developer/FradSer/openclaw/features/*.feature`
- Research summary: `/Users/FradSer/Developer/FradSer/openclaw/features/RESEARCH_SUMMARY.md`
- Feature index: `/Users/FradSer/Developer/FradSer/openclaw/features/FEATURE_INDEX.md`