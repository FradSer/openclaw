/**
 * TaskList Tool
 * Queries tasks from the team ledger with filtering options
 */

import { Type } from "@sinclair/typebox";
import { getTeamManager } from "../../../teams/pool.js";
import { validateTeamNameOrThrow } from "../../../teams/storage.js";
import type { AnyAgentTool } from "../common.js";
import { jsonResult, readStringParam } from "../common.js";

const TaskListSchema = Type.Object({
  team_name: Type.String({ minLength: 1, maxLength: 50 }),
  status: Type.Optional(
    Type.Union([
      Type.Literal("pending"),
      Type.Literal("claimed"),
      Type.Literal("in_progress"),
      Type.Literal("completed"),
      Type.Literal("deleted"),
    ]),
  ),
  owner: Type.Optional(Type.String()),
  includeCompleted: Type.Optional(Type.Boolean()),
});

export function createTaskListTool(_opts?: { agentSessionKey?: string }): AnyAgentTool {
  return {
    label: "Task List",
    name: "task_list",
    description: "Lists tasks from the team ledger with optional filters.",
    parameters: TaskListSchema,
    execute: async (_toolCallId, args) => {
      const params = args as Record<string, unknown>;

      // Extract and validate parameters
      const teamName = readStringParam(params, "team_name", { required: true });
      const status = readStringParam(params, "status");
      const owner = readStringParam(params, "owner");
      const includeCompleted = params.includeCompleted === true;

      // Validate team name
      validateTeamNameOrThrow(teamName);

      // Get team manager
      const teamsDir = process.env.OPENCLAW_STATE_DIR || process.cwd();
      const manager = getTeamManager(teamName, teamsDir);

      // List tasks
      let tasks = manager.listTasks();

      // Apply filters
      if (status) {
        tasks = tasks.filter((t) => t.status === status);
      }

      if (owner) {
        tasks = tasks.filter((t) => t.owner === owner);
      }

      if (!includeCompleted) {
        tasks = tasks.filter((t) => t.status !== "completed" && t.status !== "deleted");
      }

      return jsonResult({
        tasks,
        count: tasks.length,
        teamName,
      });
    },
  };
}
