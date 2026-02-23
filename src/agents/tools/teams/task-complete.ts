/**
 * TaskComplete Tool
 * Marks tasks as completed and unblocks dependent tasks
 */

import { Type } from "@sinclair/typebox";
import { getTeamManager } from "../../../teams/pool.js";
import { validateTeamNameOrThrow } from "../../../teams/storage.js";
import type { AnyAgentTool } from "../common.js";
import { jsonResult, readStringParam } from "../common.js";

const TaskCompleteSchema = Type.Object({
  team_name: Type.String({ minLength: 1, maxLength: 50 }),
  task_id: Type.String(),
});

export function createTaskCompleteTool(opts?: { agentSessionKey?: string }): AnyAgentTool {
  return {
    label: "Task Complete",
    name: "task_complete",
    description: "Marks a task as completed and unblocks dependent tasks.",
    parameters: TaskCompleteSchema,
    execute: async (_toolCallId, args) => {
      const params = args as Record<string, unknown>;

      // Extract and validate parameters
      const teamName = readStringParam(params, "team_name", { required: true });
      const taskId = readStringParam(params, "task_id", { required: true });

      // Validate team name
      validateTeamNameOrThrow(teamName);

      // Get team manager
      const teamsDir = process.env.OPENCLAW_STATE_DIR || process.cwd();
      const manager = getTeamManager(teamName, teamsDir);

      // Complete task (handles ownership verification and unblocking)
      const sessionKey = opts?.agentSessionKey || "unknown";
      const result = manager.completeTask(taskId, sessionKey);

      return jsonResult({
        taskId,
        status: "completed",
        unblocked: result.unblocked || [],
      });
    },
  };
}
