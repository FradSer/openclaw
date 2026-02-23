# Agent Teams Documentation

## Overview

Agent Teams enable multiple AI agents to collaborate on complex tasks through a shared task ledger and mailbox protocol. Teams consist of a Team Lead and multiple Teammates working in parallel.

### When to Use Teams vs Single Agents

Use **Agent Teams** when:

- Task can be decomposed into independent parallel work
- Multiple agents need to coordinate on a shared goal
- Complex work requires different specialized agent types
- Tasks have dependencies requiring sequential execution

Use **Single Agents** when:

- Task is simple and straightforward
- Work is highly sequential with no parallel opportunities
- Coordination overhead would exceed benefits

### Team Capabilities

- Parallel task distribution and execution
- Automatic task claiming by idle teammates
- Dependency-aware task queuing
- Real-time peer-to-peer communication
- Graceful shutdown with member approval
- Context state persistence across context compression

## Creating Teams

Use the **TeamCreate** tool to create a new team:

```
TeamCreate tool
- team_name: string (required, 1-50 chars, alphanumeric/hyphen/underscore)
- description: string (optional, human-readable description)
- agent_type: string (optional, agent type for team lead)
```

### Team Naming Conventions

- Use lowercase letters, numbers, hyphens, and underscores
- 1-50 characters maximum
- Examples: `my-team`, `research-team-1`, `deployment_pipeline`

## Managing Teammates

Use the **TeammateSpawn** tool to add team members:

```
TeammateSpawn tool
- team_name: string (required)
- agent_type: string (required)
- name: string (optional, display name)
```

### Choosing Agent Types

Select agents based on task requirements:

- `general-purpose`: General development tasks
- `researcher`: Research and documentation
- `refactor:code-simplifier`: Code cleanup and optimization

## Task Management

### Creating Tasks

Use the **TaskCreate** tool to add work to the team ledger:

```
TaskCreate tool
- subject: string (required, max 200 chars)
- description: string (required, max 10000 chars)
- activeForm: string (optional, present continuous form, max 100 chars)
- dependsOn: string[] (optional, array of task IDs)
- metadata: Record<string, unknown> (optional, additional data)
```

### Task Dependencies

Tasks can depend on other tasks:

```typescript
// Task B depends on Task A
const taskB = await TaskCreate({
  subject: "Write API documentation",
  dependsOn: [taskAId],
  // ...
});
```

Dependent tasks remain blocked until their dependencies complete.

### Task Claiming Workflow

1. Team Lead creates tasks with `TaskCreate`
2. Idle teammates call `TaskList` to find available tasks
3. Teammate claims task with `TaskClaim` (atomic operation)
4. Teammate works on task and calls `TaskComplete`

### Task Status Flow

```
pending → claimed → in_progress → completed
           ↓
         failed
```

## Communication

### Direct Messages

Use **SendMessage** to send messages to specific teammates:

```
SendMessage tool
- team_name: string (required)
- type: "message" (required)
- recipient: string (required for message type)
- content: string (required, max 100KB)
- summary: string (optional, 5-10 word preview)
```

### Broadcasting

Broadcast messages to all team members:

```
SendMessage tool
- type: "broadcast" (required)
- team_name: string (required)
- content: string (required)
- summary: string (optional)
```

Broadcast excludes the sender.

### Shutdown Protocol

Request team shutdown:

```
SendMessage tool
- type: "shutdown_request" (required)
- recipient: string (required)
- content: string (required)
- request_id: string (generated unique ID)
```

Approve or reject:

```
SendMessage tool
- type: "shutdown_response" (required)
- recipient: string (required)
- approve: boolean (required)
- reason: string (optional if approve is true)
- request_id: string (must match original request)
```

## Best Practices

### Task Decomposition

- Break large tasks into 3-6 hour units
- Make tasks independent when possible
- Use dependencies only when necessary
- Prefer parallel tasks over sequential when possible

### Team Size Recommendations

- Small teams: 2-3 members for simple coordination
- Medium teams: 4-6 members for moderate complexity
- Large teams: 7-10 members for complex projects

### Avoiding Circular Dependencies

- Design dependency graphs as DAGs (directed acyclic graphs)
- Keep dependency chains short (< 5 tasks)
- Test task flow before spawning full team

### Communication Efficiency

- Use broadcasts sparingly (N messages per broadcast)
- Summarize long content for UI previews
- Use direct messages for coordination needs
- Avoid chatter - communicate through work results

## Example Workflow

```typescript
// 1. Create team
await TeamCreate({
  team_name: "my-team",
  description: "Web development team",
});

// 2. Spawn teammates
await TeammateSpawn({
  team_name: "my-team",
  agent_type: "researcher",
  name: "Docs Writer",
});

await TeammateSpawn({
  team_name: "my-team",
  agent_type: "general-purpose",
  name: "Backend Dev",
});

// 3. Create tasks with dependencies
const apiTask = await TaskCreate({
  subject: "Implement API endpoint",
  description: "Create REST API for user management",
});

const docsTask = await TaskCreate({
  subject: "Write API documentation",
  description: "Document the user management API",
  dependsOn: [apiTask.id],
});

// 4. Teammates claim and complete tasks
// Backend claims apiTask, completes it
// Docs Writer claims docsTask (unblocked after apiTask completes)

// 5. Shutdown team
await TeamShutdown({
  team_name: "my-team",
});
```

## Error Handling and Recovery

### Member Failure

If a member stops responding:

1. Team Lead detects inactivity via idle notifications
2. Team Lead spawns replacement member
3. Failed member's tasks are requeued
4. Team continues with remaining members

### Task Reassignment

Tasks claimed by failed members are automatically released after timeout.

### Shutdown Recovery

If shutdown fails:

1. Team Lead receives rejections
2. Team Lead can retry shutdown after addressing blockers
3. Partial shutdown leaves team active

## Resource Limits

- Max teams: 10
- Max members per team: 10
- Max tasks per team: 1000
- Max message size: 100KB
- Max task description: 10,000 characters
- Max task subject: 200 characters
