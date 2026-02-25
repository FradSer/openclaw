# OpenClaw Agent Teams

## Overview

OpenClaw Agent Teams provides multi-agent coordination for parallel task execution with shared state, inter-agent messaging, and dependency management.

**IMPORTANT**: This feature integrates with OpenClaw's existing multi-agent infrastructure. Teammates are real Gateway sessions that communicate via the `agentToAgent` policy and `sessions_*` tools.

## Integration Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     OpenClaw Gateway                             │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                    Multi-Agent Layer                        ││
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         ││
│  │  │ Team Lead   │  │ Teammate 1  │  │ Teammate 2  │         ││
│  │  │ agent:main  │  │ agent:main  │  │ agent:main  │         ││
│  │  │ :main       │  │ :teammate:1 │  │ :teammate:2 │         ││
│  │  └─────────────┘  └─────────────┘  └─────────────┘         ││
│  │         │                │                │                 ││
│  │         └────────────────┼────────────────┘                 ││
│  │                          │                                  ││
│  │              sessions_send (agentToAgent)                   ││
│  └──────────────────────────┼──────────────────────────────────┘│
│                             │                                    │
│  ┌──────────────────────────┼──────────────────────────────────┐│
│  │              Team Coordination Layer                         ││
│  │  ┌────────────────┐  ┌────────────────┐                    ││
│  │  │ SQLite Ledger  │  │ Team Config    │                    ││
│  │  │ ~/.openclaw/   │  │ teams/{team}/  │                    ││
│  │  │ teams/{team}/  │  │ config.json    │                    ││
│  │  └────────────────┘  └────────────────┘                    ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

## When to Use What

```
┌──────────────────────────────────────┬────────────────────────────────────┐
│             Use Case                  │           Use Feature              │
├──────────────────────────────────────┼────────────────────────────────────┤
│ Multiple isolated agents, different   │ Multi-Agent Routing + bindings     │
│ channels (separate workspaces)        │ agents.list + bindings             │
├──────────────────────────────────────┼────────────────────────────────────┤
│ Agent A triggers Agent B for a task   │ sessions_spawn + sessions_send     │
│ (parent-child, ping-pong)             │ + agentToAgent policy              │
├──────────────────────────────────────┼────────────────────────────────────┤
│ Multiple agents work in parallel,     │ Agent Teams                        │
│ share task list, peer-to-peer         │ + sessions_* infrastructure        │
├──────────────────────────────────────┼────────────────────────────────────┤
│ Per-agent sandboxing and tools        │ agents.list[].sandbox              │
│                                       │ agents.list[].tools                │
└──────────────────────────────────────┴────────────────────────────────────┘
```

## Required Configuration

### 1. Enable agentToAgent for Bidirectional Communication

All team communication (Lead ↔ Teammate, Teammate ↔ Teammate) requires `agentToAgent`:

```json5
{
  tools: {
    agentToAgent: {
      enabled: true,
      allow: ["main", "*"], // Allow all team communication patterns
    },
  },
}
```

Communication patterns enabled:

- **Lead → Teammate**: Task assignment, shutdown requests
- **Teammate → Lead**: Completion reports, status updates, questions
- **Teammate → Teammate**: Coordination, findings sharing

### 2. Spawn Teammates as Real Sessions

Teammates must use the standard session key format and Gateway spawning:

```typescript
// Correct: Creates real Gateway session
const sessionKey = `agent:${agentId}:teammate:${crypto.randomUUID()}`;
await callGateway({
  method: "agent",
  params: {
    sessionKey,
    lane: "teammate",
    spawnedBy: parentSessionKey,
    prompt: teammateTask,
  },
});
```

### 3. Use sessions_send for Communication

Team messaging should leverage `agentToAgent` policy. The `send_message` tool enforces this policy:

```typescript
// send_message checks agentToAgent policy before delivery
// If policy is disabled or denies communication, returns error:
// "Agent-to-agent messaging is disabled. Set tools.agentToAgent.enabled=true"

// Same-agent communication (lead ↔ teammate) is always allowed
// Cross-agent communication requires agentToAgent.enabled=true

await send_message({
  team_name: "alpha-squad",
  type: "message",
  recipient: "agent:main:user:teammate:uuid",
  content: "Task assignment",
});
```

**Implementation Note**: The current `send_message` tool checks agentToAgent policy but stores messages in inbox files for context injection. Future versions may use `sessions_send` for Gateway-based delivery.

## Integration Points

### With Multi-Agent Routing

| Feature             | Team Integration                                     |
| ------------------- | ---------------------------------------------------- |
| `agents.list`       | Teammate `agentId` validates against list            |
| `bindings`          | Not used (teammates are spawned, not routed)         |
| Per-agent workspace | Teammates inherit lead's workspace or use `agentDir` |

### With agentToAgent Policy

| Feature   | Team Integration                          |
| --------- | ----------------------------------------- |
| `enabled` | Required for team communication           |
| `allow`   | Team members must be allowlisted          |
| Security  | All team messages go through policy check |

### With Subagent Infrastructure

| Feature                          | Team Integration                   |
| -------------------------------- | ---------------------------------- |
| `callGateway({method: "agent"})` | Used to spawn teammates            |
| `runSubagentAnnounceFlow`        | Teammate completion notifications  |
| Session lifecycle                | Teammates follow subagent patterns |

## Storage Structure

```
~/.openclaw/teams/
└── {team_name}/
    ├── config.json          # Team configuration
    ├── ledger.db            # SQLite task ledger (WAL mode)
    ├── ledger.db-shm
    ├── ledger.db-wal
    └── inbox/               # Optional: mailbox for context injection
        └── {session_key}/
            └── messages.jsonl
```

## Related Documentation

- [Architecture](./architecture.md) - Detailed system design
- [BDD Specifications](./bdd-specs.md) - Behavior-driven test scenarios
- [Best Practices](./best-practices.md) - Security and performance guidelines
- [Integration Guide](./integration.md) - How to integrate with existing infrastructure

## External References

- [Multi-Agent Routing](../../multi-agent-routing.md) - agents.list, bindings
- [Multi-Agent Sandbox & Tools](../../multi-agent-sandbox.md) - Per-agent security
- [Agent-to-Agent Communication](../../agent-to-agent.md) - sessions\_\* tools
