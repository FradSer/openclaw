# Task 017: Tool Registration

**Phase:** 3 (Integration Verification)
**Status:** complete
**depends-on:** []

## Description

Verify team tools are registered in OpenClaw's tool system.

## Implementation Location

`src/agents/openclaw-tools.ts` (lines 176-207)

## BDD Scenario

```gherkin
Feature: Tool Registration
  As a developer
  I want team tools registered in the tool system
  So that agents can use them

  Scenario: All team tools are registered
    Given OpenClaw tools are loaded
    When I query available tools
    Then team_create is available
    And teammate_spawn is available
    And team_shutdown is available
    And task_create is available
    And task_list is available
    And task_claim is available
    And task_complete is available
    And send_message is available

  Scenario: Tools use correct naming convention
    Given team tools are registered
    When I inspect tool names
    Then all names use snake_case format
```

## Registered Tools

| Tool Name             | Description            |
| --------------------- | ---------------------- |
| `team_create`         | Create new team        |
| `teammate_spawn`      | Spawn teammate agent   |
| `team_shutdown`       | Graceful shutdown      |
| `task_create`         | Add task to ledger     |
| `task_list`           | Query tasks            |
| `task_claim`          | Claim task atomically  |
| `task_complete`       | Complete task          |
| `task_find_available` | Find claimable tasks   |
| `task_auto_claim`     | Auto-claim next task   |
| `send_message`        | Send/broadcast message |

## Registration Pattern

```typescript
import { createTeamCreateTool } from "./tools/teams/team-create.js";

// In openclaw-tools.ts
{
  name: "team_create",
  // ... tool definition
}
```

## Verification

```bash
pnpm test src/agents/openclaw-tools.test.ts
```
