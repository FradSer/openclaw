# OpenClaw Agent Teams Implementation Plan

## Overview

This plan implements Claude Code-style multi-agent team orchestration in OpenClaw with a test-first BDD-driven approach. Each task explicitly maps to specific BDD scenarios from the design specification.

**Design Reference:** [Agent Teams Design](../2026-02-23-agent-teams-design/)

**Total Tasks:** 40
**BDD Scenarios:** 84 (mapped to tasks)

## Goal

Implement a complete multi-agent team system with:

- Team creation and lifecycle management
- Task ledger with atomic claiming and dependency resolution
- Mailbox protocol for agent-to-agent communication
- Concurrency control using SQLite WAL mode
- Team state injection for context amnesia prevention

## Architecture

```mermaid
graph TB
    subgraph User Interface
        U[User Message]
    end

    subgraph Gateway
        G[Gateway WebSocket Server]
        TL[Team Lead Session]
    end

    subgraph Team Storage
        DIR[~/.openclaw/teams/{team}/]
        CFG[config.json]
        DB[ledger.db SQLite]
        INBOX[inbox/]
    end

    subgraph Teammates
        TM1[Teammate 1 Session]
        TM2[Teammate 2 Session]
    end

    U --> G
    G --> TL
    TL -->|TeamCreate| DIR
    TL -->|TaskAdd| DB
    TM1 -->|TaskClaim| DB
    TM2 -->|TaskClaim| DB
    TL -->|SendMessage| INBOX
    INBOX --> TM1
    INBOX --> TM2
```

## Constraints

- **Language:** TypeScript (ESM), Node.js 22+
- **Package Manager:** pnpm
- **Database:** SQLite (node:sqlite) with WAL mode
- **Implementation:** Native OpenClaw tools (not skills/extensions)
- **Testing:** Vitest with BDD scenarios (84 total)
- **Test-First:** Red-Green-Refactor for all features
- **Isolation:** Unit tests must use test doubles for DB/network/third-party APIs

## BDD Feature Mapping

| Feature                | Scenarios | Tasks   |
| ---------------------- | --------- | ------- |
| Team Lifecycle         | 11        | 001-006 |
| Task Management        | 17        | 007-014 |
| Mailbox Communication  | 19        | 015-022 |
| Concurrency Control    | 19        | 023-028 |
| Team Lead Coordination | 18        | 029-034 |

## Execution Plan

### Phase 1: Core Infrastructure

- [Task 001: TypeScript Types](./task-001-types.md)
- [Task 002: SQLite Ledger Tests](./task-002-ledger-tests.md)
- [Task 003: SQLite Ledger Implementation](./task-003-ledger.md)
- [Task 004: Team Storage Tests](./task-004-storage-tests.md)
- [Task 005: Team Storage Implementation](./task-005-storage.md)
- [Task 006: Connection Pool Tests](./task-006-connection-pool-tests.md)
- [Task 007: Connection Pool Implementation](./task-007-connection-pool.md)
- [Task 008: Team Manager Tests](./task-008-manager-tests.md)
- [Task 009: Team Manager Implementation](./task-009-manager.md)

### Phase 2: Team Lifecycle Tools

- [Task 010: TeamCreate Tool Tests](./task-010-team-create-tests.md)
- [Task 011: TeamCreate Tool Implementation](./task-011-team-create.md)
- [Task 012: TeammateSpawn Tool Tests](./task-012-teammate-spawn-tests.md)
- [Task 013: TeammateSpawn Tool Implementation](./task-013-teammate-spawn.md)
- [Task 014: TeamShutdown Tool Tests](./task-014-team-shutdown-tests.md)
- [Task 015: TeamShutdown Tool Implementation](./task-015-team-shutdown.md)
- [Task 016: Session State Integration Tests](./task-016-session-state-tests.md)
- [Task 017: Session State Integration Implementation](./task-017-session-state.md)

### Phase 3: Task Management Tools

- [Task 018: TaskCreate Tool Tests](./task-018-task-create-tests.md)
- [Task 019: TaskCreate Tool Implementation](./task-019-task-create.md)
- [Task 020: TaskList Tool Tests](./task-020-task-list-tests.md)
- [Task 021: TaskList Tool Implementation](./task-021-task-list.md)
- [Task 022: TaskClaim Tool Tests](./task-022-task-claim-tests.md)
- [Task 023: TaskClaim Tool Implementation](./task-023-task-claim.md)
- [Task 024: TaskComplete Tool Tests](./task-024-task-complete-tests.md)
- [Task 025: TaskComplete Tool Implementation](./task-025-task-complete.md)

### Phase 4: Communication Tools

- [Task 026: SendMessage Tool Tests](./task-026-send-message-tests.md)
- [Task 027: SendMessage Tool Implementation](./task-027-send-message.md)
- [Task 028: Inbox Structure Tests](./task-028-inbox-tests.md)
- [Task 029: Inbox Structure Implementation](./task-029-inbox.md)
- [Task 030: Message Injection Tests](./task-030-message-injection-tests.md)
- [Task 031: Message Injection Implementation](./task-031-message-injection.md)

### Phase 5: Integration & Verification

- [Task 032: Tool Registration](./task-032-tool-registration.md)
- [Task 033: Team State Injection Tests](./task-033-team-state-injection-tests.md)
- [Task 034: Team State Injection Implementation](./task-034-team-state-injection.md)
- [Task 035: Concurrency Tests](./task-035-concurrency-tests.md)
- [Task 036: Security Tests](./task-036-security-tests.md)
- [Task 037: E2E Workflow Tests](./task-037-e2e-workflows.md)
- [Task 038: Cleanup Implementation](./task-038-cleanup.md)
- [Task 039: Performance Tests](./task-039-performance.md)
- [Task 040: Documentation](./task-040-documentation.md)

## Dependencies

This plan depends on:

- Existing OpenClaw session management system
- `node:sqlite` module availability
- Vitest testing framework
- Current tool infrastructure in `src/agents/tools/`

## Success Criteria

The implementation is complete when:

- All 84 BDD scenarios pass
- Atomic task claiming prevents race conditions
- Task dependencies resolve correctly
- Messages are delivered only to intended recipients
- Team state survives context compression
- Team shutdown requires member approval
- No path traversal vulnerabilities exist
