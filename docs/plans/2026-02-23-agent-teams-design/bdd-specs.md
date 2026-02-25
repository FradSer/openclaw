# Agent Teams BDD Specifications

This document defines the Behavior-Driven Development (BDD) specifications for the Agent Teams implementation. These scenarios are implemented in the test files under `src/teams/` and `src/tests/`.

## Feature 1: Team Lifecycle Management

### Scenarios

| #   | Scenario                                       | Test File                |
| --- | ---------------------------------------------- | ------------------------ |
| 1   | Create a new team successfully                 | `manager.test.ts`        |
| 2   | Reject team creation with invalid name         | `storage.test.ts`        |
| 3   | Reject team creation if name already exists    | `team-create.ts` tool    |
| 4   | Spawn a teammate into an existing team         | `teammate-spawn.ts` tool |
| 5   | Reject teammate spawn if team does not exist   | `teammate-spawn.ts` tool |
| 6   | Teammate gracefully processes shutdown request | `team-shutdown.ts` tool  |
| 7   | Team deletion cleans up directories            | `cleanup.test.ts`        |

### Key Behaviors

```gherkin
Feature: Team Lifecycle

  Scenario: Create a new team successfully
    Given I am an authenticated user with session key "agent:main:main"
    When I execute team_create with team_name "alpha-squad"
    Then a directory "~/.openclaw/teams/alpha-squad" is created
    And a file "config.json" exists with lead session key
    And a SQLite database "ledger.db" is initialized
    And the lead is registered as a team member

  Scenario: Reject team creation with invalid name
    Given I attempt to create a team
    When I provide team_name "invalid name!"
    Then the operation fails with validation error
    And error message contains "alphanumeric"

  Scenario: Spawn teammate into team
    Given a team "alpha-squad" exists
    When I execute teammate_spawn with name "researcher"
    Then a session key "agent:{id}:teammate:{uuid}" is generated
    And the teammate is added to members table
    And the teammate can access the team ledger
```

### Team Name Validation

```typescript
// Valid names
"alpha-squad"; // Lowercase with hyphens
"team_123"; // Underscores allowed
"a"; // Minimum 1 character
"team-with-long-name-up-to-50-chars"; // Max 50 chars

// Invalid names
"Alpha Squad"; // Spaces not allowed
"team!"; // Special characters not allowed
""; // Empty not allowed
"team-name-that-is-way-too-long-for-the-limit"; // Over 50 chars
```

## Feature 2: Task Ledger Operations

### Scenarios

| #   | Scenario                                   | Test File            |
| --- | ------------------------------------------ | -------------------- |
| 1   | Create a task with basic information       | `manager.test.ts`    |
| 2   | Create a task with dependencies            | `manager.test.ts`    |
| 3   | List all pending tasks                     | `manager.test.ts`    |
| 4   | Atomically claim a pending task            | `task-claim.test.ts` |
| 5   | Reject claiming an already claimed task    | `task-claim.test.ts` |
| 6   | Reject claiming a blocked task             | `manager.test.ts`    |
| 7   | Complete a task successfully               | `manager.test.ts`    |
| 8   | Auto-unblock dependent tasks on completion | `manager.test.ts`    |
| 9   | Delete a task                              | `manager.test.ts`    |
| 10  | Detect circular dependencies               | `manager.test.ts`    |

### Key Behaviors

```gherkin
Feature: Task Ledger

  Scenario: Atomically claim a pending task
    Given a team "alpha-squad" exists
    And a pending task "T1" exists with no owner
    When teammate "researcher" claims task "T1"
    Then the task status becomes "in_progress"
    And the task owner is set to "researcher"
    And the claimedAt timestamp is set

  Scenario: Reject claiming an already claimed task
    Given a task "T1" exists with owner "tester"
    When teammate "researcher" attempts to claim task "T1"
    Then the claim fails with error "Task already claimed by another agent"

  Scenario: Reject claiming a blocked task
    Given a task "T1" exists with status "completed"
    And a task "T2" exists with blockedBy containing "T1"
    When teammate "researcher" attempts to claim task "T2"
    Then the claim fails with error "Task has unmet dependencies"
    And the response includes blockedBy array

  Scenario: Auto-unblock dependent tasks on completion
    Given a task "T1" exists with status "in_progress"
    And a task "T2" exists with blockedBy containing "T1"
    When task "T1" is marked as completed
    Then task "T2"'s blockedBy array no longer contains "T1"
    And task "T2" becomes available for claiming
```

### Task Status Transitions

```
pending ──claim──> in_progress ──complete──> completed
   │                   │
   └──delete──────────>┴──> deleted
```

## Feature 3: Mailbox Communication

### Scenarios

| #   | Scenario                                   | Test File                   |
| --- | ------------------------------------------ | --------------------------- |
| 1   | Send a direct message to a teammate        | `inbox.test.ts`             |
| 2   | Broadcast a message to all teammates       | `send-message.test.ts`      |
| 3   | Reject message if recipient does not exist | `send-message.test.ts`      |
| 4   | Inject pending messages into context       | `context-injection.test.ts` |
| 5   | Clear inbox after context injection        | `inbox.test.ts`             |
| 6   | Team lead sends shutdown request           | `team-shutdown.test.ts`     |
| 7   | Teammate sends shutdown response           | `team-shutdown.test.ts`     |

### Key Behaviors

```gherkin
Feature: Mailbox Communication

  Scenario: Send a direct message
    Given a team "alpha-squad" exists
    And teammate "researcher" is active
    When teammate "tester" sends message to "researcher"
    Then the message is written to inbox/researcher/messages.jsonl
    And the message includes sender, type, content, timestamp

  Scenario: Broadcast to all teammates
    Given a team with 3 members exists
    When team lead broadcasts a message
    Then each member (except sender) receives the message in their inbox
    And the message type is "broadcast"

  Scenario: Context injection
    Given teammate "researcher" has 2 pending messages
    When "researcher" begins its next inference cycle
    Then messages are formatted as <teammate-message> XML tags
    And tags are prepended to the system prompt context
    And the messages.jsonl file is deleted after injection
```

### Message Types

```typescript
type MessageType =
  | "message" // Direct message
  | "broadcast" // To all members
  | "shutdown_request" // Request graceful shutdown
  | "shutdown_response" // Approve/reject shutdown
  | "idle"; // Status update
```

### XML Message Format

```xml
<teammate-message
  teammate_id="researcher-1"
  type="message"
  summary="Found critical bug in auth module">
  Found a critical security vulnerability in the auth module.
</teammate-message>
```

## Feature 4: Concurrency and Load

### Scenarios

| #   | Scenario                                    | Test File             |
| --- | ------------------------------------------- | --------------------- |
| 1   | Handle concurrent task claims               | `performance.test.ts` |
| 2   | Handle SQLite BUSY errors with retry        | `manager.test.ts`     |
| 3   | Handle rapid message writing                | `performance.test.ts` |
| 4   | Resolve dependency graphs without deadlocks | `manager.test.ts`     |
| 5   | Checkpoint WAL file periodically            | `cleanup.test.ts`     |

### Key Behaviors

```gherkin
Feature: Concurrency

  Scenario: Handle concurrent task claims
    Given a pending task "T1" exists
    When 10 teammates attempt to claim "T1" simultaneously
    Then exactly one teammate successfully claims the task
    And 9 teammates receive "already claimed" error

  Scenario: Handle SQLite BUSY errors
    Given the database is locked by another transaction
    When a teammate attempts to update a task
    Then SQLITE_BUSY error is caught
    And operation is retried with exponential backoff
    And operation succeeds on retry

  Scenario: Dependency graph resolution
    Given task A depends on B
    And task B depends on C
    And task C is completed
    Then task B becomes available
    And when B completes, task A becomes available
    And no deadlocks occur
```

## Feature 5: Security

### Scenarios

| #   | Scenario                                     | Test File          |
| --- | -------------------------------------------- | ------------------ |
| 1   | Validate team name to prevent path traversal | `security.test.ts` |
| 2   | Sanitize session keys for inbox paths        | `inbox.test.ts`    |
| 3   | Enforce message size limits                  | `limits.test.ts`   |
| 4   | Enforce team member limits                   | `limits.test.ts`   |

### Key Behaviors

```gherkin
Feature: Security

  Scenario: Prevent path traversal in team names
    When I attempt to create team with name "../../../etc/passwd"
    Then the operation fails with validation error
    And no files are created outside ~/.openclaw/teams/

  Scenario: Sanitize session keys for inbox paths
    Given session key "agent:main:user@example.com"
    When inbox directory is created
    Then the path uses sanitized name "agent_main_user_example_com"
    And no path separators are present

  Scenario: Enforce message size limit
    When I send a message larger than 100KB
    Then the operation fails with size limit error
```

## Test Files Reference

| Test File                   | Coverage                         |
| --------------------------- | -------------------------------- |
| `manager.test.ts`           | Core operations, dependencies    |
| `ledger.test.ts`            | SQLite operations, schema        |
| `inbox.test.ts`             | Message storage, retrieval       |
| `storage.test.ts`           | Directory management, validation |
| `pool.test.ts`              | Connection caching               |
| `limits.test.ts`            | Resource limits                  |
| `cleanup.test.ts`           | Maintenance operations           |
| `context-injection.test.ts` | Message to XML conversion        |
| `state-injection.test.ts`   | Team state formatting            |
| `security.test.ts`          | Path traversal, validation       |
| `performance.test.ts`       | Concurrency, load                |
| `e2e.test.ts`               | End-to-end workflows             |

## Running Tests

```bash
# Run all team tests
pnpm test src/teams/

# Run specific test file
pnpm test src/teams/manager.test.ts

# Run BDD scenarios
pnpm test src/tests/bdd-team-*.test.ts
```
