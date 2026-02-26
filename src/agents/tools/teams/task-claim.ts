/**
 * TaskClaim Tool
 * Atomically claims tasks from the team ledger
 */

import { Type } from "@sinclair/typebox";
import { getTeamManager } from "../../../teams/pool.js";
import { getTeamsBaseDir, validateTeamNameOrThrow } from "../../../teams/storage.js";
import type { AnyAgentTool } from "../common.js";
import { jsonResult, readStringParam } from "../common.js";

const TaskClaimSchema = Type.Object({
  team_name: Type.String({ minLength: 1, maxLength: 50 }),
  task_id: Type.String(),
});

export function createTaskClaimTool(opts?: { agentSessionKey?: string }): AnyAgentTool {
  return {
    label: "Task Claim",
    name: "task_claim",
    description: "Atomically claims a task from the team ledger.",
    parameters: TaskClaimSchema,
    execute: async (_toolCallId, args) => {
      const params = args as Record<string, unknown>;

      // Extract and validate parameters
      const teamName = readStringParam(params, "team_name", { required: true });
      const taskId = readStringParam(params, "task_id", { required: true });

      // Validate team name
      validateTeamNameOrThrow(teamName);

      // Get team manager
      const teamsDir = getTeamsBaseDir();
      const manager = getTeamManager(teamName, teamsDir);

      // Claim task
      const sessionKey = opts?.agentSessionKey || "unknown";
      const result = manager.claimTask(taskId, sessionKey);

      if (result.success) {
        return jsonResult({
          taskId: result.taskId,
          status: "claimed",
          owner: sessionKey,
        });
      }

      return jsonResult({
        error: result.reason || "Failed to claim task",
        blockedBy: result.blockedBy,
      });
    },
  };
}
