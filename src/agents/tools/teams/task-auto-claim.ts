/**
 * TaskAutoClaim Tool
 * Atomically finds and claims the next available task from the team ledger.
 * When team_name is omitted, searches across all teams the agent belongs to.
 */

import { Type } from "@sinclair/typebox";
import { findAvailableTasksAcrossTeams, getTeamManager } from "../../../teams/pool.js";
import { getTeamsBaseDir, validateTeamNameOrThrow } from "../../../teams/storage.js";
import type { AnyAgentTool } from "../common.js";
import { jsonResult, readStringParam } from "../common.js";

const TaskAutoClaimSchema = Type.Object({
  team_name: Type.Optional(Type.String({ minLength: 1, maxLength: 50 })),
});

export function createTaskAutoClaimTool(opts?: { agentSessionKey?: string }): AnyAgentTool {
  return {
    label: "Task Auto Claim",
    name: "task_auto_claim",
    description:
      "Automatically finds and claims the next available task. Returns the claimed task or null if no tasks are available. When team_name is omitted, searches across all teams the agent belongs to.",
    parameters: TaskAutoClaimSchema,
    execute: async (_toolCallId, args) => {
      const params = args as Record<string, unknown>;

      const teamName = readStringParam(params, "team_name");
      const sessionKey = opts?.agentSessionKey || "unknown";

      // Cross-team mode: no team_name provided
      if (!teamName) {
        const crossTeamTasks = findAvailableTasksAcrossTeams(sessionKey, 1);

        if (crossTeamTasks.length === 0) {
          return jsonResult({
            claimed: false,
            task: null,
            message: "No available tasks to claim across any team",
            mode: "cross-team",
          });
        }

        const found = crossTeamTasks[0];
        const teamsDir = getTeamsBaseDir();
        const manager = getTeamManager(found.teamName, teamsDir);
        const memberName = manager.getMemberName(sessionKey);

        const result = manager.claimTask(found.id, sessionKey, memberName);

        if (result.success) {
          return jsonResult({
            claimed: true,
            task: {
              id: found.id,
              subject: found.subject,
              description: found.description,
              activeForm: found.activeForm,
              status: "in_progress",
              owner: sessionKey,
            },
            teamName: found.teamName,
            mode: "cross-team",
          });
        }

        return jsonResult({
          claimed: false,
          task: null,
          error: result.reason || "Failed to claim task",
          teamName: found.teamName,
          mode: "cross-team",
        });
      }

      // Single-team mode
      validateTeamNameOrThrow(teamName);

      const teamsDir = getTeamsBaseDir();
      const manager = getTeamManager(teamName, teamsDir);

      const memberName = manager.getMemberName(sessionKey);

      const availableTasks = manager.findAvailableTask(1, memberName);

      if (availableTasks.length === 0) {
        return jsonResult({
          claimed: false,
          task: null,
          message: "No available tasks to claim",
          teamName,
        });
      }

      const task = availableTasks[0];

      const result = manager.claimTask(task.id, sessionKey, memberName);

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
