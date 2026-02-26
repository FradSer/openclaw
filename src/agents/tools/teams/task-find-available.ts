/**
 * TaskFindAvailable Tool
 * Queries available tasks that can be claimed from the team ledger
 */

import { Type } from "@sinclair/typebox";
import { getTeamManager } from "../../../teams/pool.js";
import { getTeamsBaseDir, validateTeamNameOrThrow } from "../../../teams/storage.js";
import type { AnyAgentTool } from "../common.js";
import { jsonResult, readNumberParam, readStringParam } from "../common.js";

const TaskFindAvailableSchema = Type.Object({
  team_name: Type.String({ minLength: 1, maxLength: 50 }),
  limit: Type.Optional(Type.Number({ default: 10 })),
});

export function createTaskFindAvailableTool(_opts?: { agentSessionKey?: string }): AnyAgentTool {
  return {
    label: "Task Find Available",
    name: "task_find_available",
    description:
      "Finds available tasks that can be claimed. Returns tasks that are pending, not claimed, and have no unmet dependencies.",
    parameters: TaskFindAvailableSchema,
    execute: async (_toolCallId, args) => {
      const params = args as Record<string, unknown>;

      // Extract and validate parameters
      const teamName = readStringParam(params, "team_name", { required: true });
      const limit = readNumberParam(params, "limit") || 10;

      // Validate team name
      validateTeamNameOrThrow(teamName);

      // Get team manager
      const teamsDir = getTeamsBaseDir();
      const manager = getTeamManager(teamName, teamsDir);

      // Find available tasks
      const tasks = manager.findAvailableTask(limit);

      return jsonResult({
        tasks,
        count: tasks.length,
        teamName,
      });
    },
  };
}
