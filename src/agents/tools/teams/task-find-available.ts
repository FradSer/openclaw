/**
 * TaskFindAvailable Tool
 * Queries available tasks that can be claimed from the team ledger.
 * When team_name is omitted, searches across all teams the agent belongs to.
 */

import { Type } from "@sinclair/typebox";
import { findAvailableTasksAcrossTeams, getTeamManager } from "../../../teams/pool.js";
import { getTeamsBaseDir, validateTeamNameOrThrow } from "../../../teams/storage.js";
import type { AnyAgentTool } from "../common.js";
import { jsonResult, readNumberParam, readStringParam } from "../common.js";

const TaskFindAvailableSchema = Type.Object({
  team_name: Type.Optional(Type.String({ minLength: 1, maxLength: 50 })),
  limit: Type.Optional(Type.Number({ default: 10 })),
});

export function createTaskFindAvailableTool(opts?: { agentSessionKey?: string }): AnyAgentTool {
  return {
    label: "Task Find Available",
    name: "task_find_available",
    description:
      "Finds available tasks that can be claimed. Returns tasks that are pending, not claimed, and have no unmet dependencies. When team_name is omitted, searches across all teams the agent belongs to.",
    parameters: TaskFindAvailableSchema,
    execute: async (_toolCallId, args) => {
      const params = args as Record<string, unknown>;

      const teamName = readStringParam(params, "team_name");
      const limit = readNumberParam(params, "limit") || 10;

      // Cross-team mode: no team_name provided
      if (!teamName) {
        const sessionKey = opts?.agentSessionKey;
        if (!sessionKey) {
          return jsonResult({ error: "No session key available for cross-team search." });
        }
        const tasks = findAvailableTasksAcrossTeams(sessionKey, limit);
        return jsonResult({
          tasks,
          count: tasks.length,
          mode: "cross-team",
        });
      }

      // Single-team mode
      validateTeamNameOrThrow(teamName);

      const teamsDir = getTeamsBaseDir();
      const manager = getTeamManager(teamName, teamsDir);

      const sessionKey = opts?.agentSessionKey;
      const memberName = sessionKey ? manager.getMemberName(sessionKey) : undefined;

      const tasks = manager.findAvailableTask(limit, memberName);

      return jsonResult({
        tasks,
        count: tasks.length,
        teamName,
      });
    },
  };
}
