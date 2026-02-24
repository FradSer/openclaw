# Task 032: Tool Registration

**Phase:** 5 (Integration & Verification)
**Status:** pending
**depends-on:** ["task-027-send-message.md", "task-031-message-injection.md"]

## Description

Register all team tools with the OpenClaw tool system.

## Files to Modify

- `src/agents/tools/index.ts` - Tool registry

## Tools to Register

1. TeamCreate
2. TeammateSpawn
3. TeamShutdown
4. TaskCreate
5. TaskList
6. TaskClaim
7. TaskComplete
8. SendMessage

## Verification

Run: Verify all tools appear in tool list.

Ensure all tests pass (GREEN).
