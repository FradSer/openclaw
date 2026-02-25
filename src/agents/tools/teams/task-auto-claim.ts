/**
 * TaskAutoClaim Tool
 * Atomically finds and claims the next available task from the team ledger
 */

import { Type } from "@sinclair/typebox";
import { getTeamManager } from "../../../teams/pool.js";
import { validateTeamNameOrThrow } from "../../../teams/storage.js";
import type { AnyAgentTool } from "../common.js";
import { jsonResult, readStringParam } from "../common.js";

const TaskAutoClaimSchema = Type.Object({
  team_name: Type.String({ minLength: 1, maxLength: 50 }),
});

export function createTaskAutoClaimTool(opts?: { agentSessionKey?: string }): AnyAgentTool {
  return {
    label: "Task Auto Claim",
    name: "task_auto_claim",
    description:
      "Automatically finds and claims the next available task. Returns the claimed task or null if no tasks are available.",
    parameters: TaskAutoClaimSchema,
    execute: async (_toolCallId, args) => {
      const params = args as Record<string, unknown>;

      // Extract and validate parameters
      const teamName = readStringParam(params, "team_name", { required: true });

      // Validate team name
      validateTeamNameOrThrow(teamName);

      // Get team manager
      const teamsDir = process.env.OPENCLAW_STATE_DIR || process.cwd();
      const manager = getTeamManager(teamName, teamsDir);

      // Find next available task
      const availableTasks = manager.findAvailableTask(1);

      if (availableTasks.length === 0) {
        return jsonResult({
          claimed: false,
          task: null,
          message: "No available tasks to claim",
          teamName,
        });
      }

      const task = availableTasks[0];

      // Claim the task
      const sessionKey = opts?.agentSessionKey || "unknown";
      const result = manager.claimTask(task.id, sessionKey);

      if (result.success) {
        return jsonResult({
          claimed: true,
          task: {
            id: task.id,
            subject: task.subject,
            description: task.description,
            activeForm: task.activeForm,
            status: "in_progress",
            owner: sessionKey,
          },
          teamName,
        });
      }

      return jsonResult({
        claimed: false,
        task: null,
        error: result.reason || "Failed to claim task",
        teamName,
      });
    },
  };
}
