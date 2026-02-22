# OpenClaw Agent Teams Implementation Plan

## Overview

This plan implements Claude Code-style multi-agent team orchestration in OpenClaw. The implementation enables a Team Lead agent to coordinate multiple independent Teammate agents through a shared task ledger with SQLite-backed concurrency control and a mailbox protocol for peer-to-peer communication.

**Design Reference:** [Agent Teams Design](../2026-02-23-agent-teams-design/)

**Total Tasks:** 40
**Estimated Duration:** ~2 weeks

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

## Phase Structure

### Phase 1: Core Infrastructure (Tasks 001-008)
- TypeScript types definition
- SQLite ledger initialization
- Team storage management
- Team manager class

### Phase 2: Team Lifecycle Tools (Tasks 009-014)
- TeamCreate tool
- TeammateSpawn tool
- TeamShutdown tool
- Session state integration

### Phase 3: Task Management Tools (Tasks 015-023)
- TaskCreate tool
- TaskList tool
- TaskClaim tool (atomic)
- TaskComplete tool

### Phase 4: Communication Tools (Tasks 024-028)
- SendMessage tool
- Inbox directory structure
- Message injection into context

### Phase 5: Integration & Testing (Tasks 029-040)
- Tool registration
- Team state injection
- BDD test scenarios
- Concurrency tests
- E2E workflows

## Execution Plan

- [Task 001: TypeScript Types](./task-001-types.md)
- [Task 002: SQLite Ledger Initialization Tests](./task-002-ledger-tests.md)
- [Task 003: SQLite Ledger Implementation](./task-003-ledger.md)
- [Task 004: Team Storage Tests](./task-004-storage-tests.md)
- [Task 005: Team Storage Implementation](./task-005-storage.md)
- [Task 006: Team Manager Tests](./task-006-manager-tests.md)
- [Task 007: Team Manager Implementation](./task-007-manager.md)
- [Task 008: Connection Pooling](./task-008-connection-pool.md)
- [Task 009: TeamCreate Tool Tests](./task-009-team-create-tests.md)
- [Task 010: TeamCreate Tool Implementation](./task-010-team-create.md)
- [Task 011: TeammateSpawn Tool Tests](./task-011-teammate-spawn-tests.md)
- [Task 012: TeammateSpawn Tool Implementation](./task-012-teammate-spawn.md)
- [Task 013: TeamShutdown Tool Tests](./task-013-team-shutdown-tests.md)
- [Task 014: TeamShutdown Tool Implementation](./task-014-team-shutdown.md)
- [Task 015: Session State Integration](./task-015-session-state.md)
- [Task 016: TaskCreate Tool Tests](./task-016-task-create-tests.md)
- [Task 017: TaskCreate Tool Implementation](./task-017-task-create.md)
- [Task 018: TaskList Tool Tests](./task-018-task-list-tests.md)
- [Task 019: TaskList Tool Implementation](./task-019-task-list.md)
- [Task 020: TaskClaim Tool Tests](./task-020-task-claim-tests.md)
- [Task 021: TaskClaim Tool Implementation](./task-021-task-claim.md)
- [Task 022: TaskComplete Tool Tests](./task-022-task-complete-tests.md)
- [Task 023: TaskComplete Tool Implementation](./task-023-task-complete.md)
- [Task 024: SendMessage Tool Tests](./task-024-send-message-tests.md)
- [Task 025: SendMessage Tool Implementation](./task-025-send-message.md)
- [Task 026: Inbox Directory Structure](./task-026-inbox-structure.md)
- [Task 027: Message Injection Tests](./task-027-message-injection-tests.md)
- [Task 028: Message Injection Implementation](./task-028-message-injection.md)
- [Task 029: Tool Registration](./task-029-tool-registration.md)
- [Task 030: Team State Injection](./task-030-team-state-injection.md)
- [Task 031: Team Lifecycle BDD Tests](./task-031-team-lifecycle-bdd.md)
- [Task 032: Task Management BDD Tests](./task-032-task-management-bdd.md)
- [Task 033: Mailbox Communication BDD Tests](./task-033-mailbox-bdd.md)
- [Task 034: Concurrency Control Tests](./task-034-concurrency-tests.md)
- [Task 035: Team Lead Coordination Tests](./task-035-team-lead-tests.md)
- [Task 036: E2E Team Workflow Tests](./task-036-e2e-workflows.md)
- [Task 037: Security & Path Traversal Tests](./task-037-security-tests.md)
- [Task 038: Performance & Resource Limits](./task-038-performance.md)
- [Task 039: Cleanup & Maintenance](./task-039-cleanup.md)
- [Task 040: Documentation & Examples](./task-040-documentation.md)

## Verification Strategy

Each task includes verification steps that:
1. Run BDD scenarios via `pnpm test`
2. Verify atomic operations (task claiming, dependency resolution)
3. Test concurrency with parallel operations
4. Validate security (path traversal, team isolation)
5. Confirm team state persistence

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