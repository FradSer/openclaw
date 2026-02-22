# Task 029: Tool Registration

**Phase:** 5 (Integration & Testing)
**Status:** pending
**depends-on**: ["task-028-message-injection.md"]

## Description

Register all team tools in the OpenClaw tool factory so they are available to agents. This includes team creation, task management, and communication tools.

## Files to Modify

- `src/agents/openclaw-tools.ts` - Add team tools to createOpenClawTools function

## Implementation Requirements

### Import Team Tools

Import all team tool factory functions:

```typescript
import { createTeamCreateTool } from './tools/teams/team-create.js';
import { createTeammateSpawnTool } from './tools/teams/teammate-spawn.js';
import { createTeamShutdownTool } from './tools/teams/team-shutdown.js';
import { createTaskCreateTool } from './tools/teams/task-create.js';
import { createTaskListTool } from './tools/teams/task-list.js';
import { createTaskClaimTool } from './tools/teams/task-claim.js';
import { createTaskCompleteTool } from './tools/teams/task-complete.js';
import { createSendMessageTool } from './tools/teams/send-message.js';
```

### Register Tools

Add team tools to the tools array in createOpenClawTools:

```typescript
const tools: AnyAgentTool[] = [
  // ... existing tools ...

  // Team tools
  createTeamCreateTool({
    agentSessionKey: opts?.agentSessionKey,
  }),
  createTeammateSpawnTool({
    agentSessionKey: opts?.agentSessionKey,
    agentChannel: opts?.agentChannel,
    agentAccountId: opts?.agentAccountId,
  }),
  createTeamShutdownTool({
    agentSessionKey: opts?.agentSessionKey,
  }),
  createTaskCreateTool({
    agentSessionKey: opts?.agentSessionKey,
  }),
  createTaskListTool({
    agentSessionKey: opts?.agentSessionKey,
  }),
  createTaskClaimTool({
    agentSessionKey: opts?.agentSessionKey,
  }),
  createTaskCompleteTool({
    agentSessionKey: opts?.agentSessionKey,
  }),
  createSendMessageTool({
    agentSessionKey: opts?.agentSessionKey,
  }),
];
```

## Constraints

- Pass agentSessionKey to all tools for ownership verification
- Pass agentChannel and agentAccountId to spawning tools
- Maintain tool array order consistency

## Verification

1. Run all tests: `pnpm test`
2. Verify tools are listed in agent tool inventory
3. Verify tools have correct descriptions and parameters