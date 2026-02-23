/**
 * TeammateSpawn Tool
 * Creates a teammate session and adds it to the team as a member
 */

import { randomUUID } from "node:crypto";
import { Type } from "@sinclair/typebox";
import { getTeamManager } from "../../../teams/pool.js";
import { teamDirectoryExists, validateTeamNameOrThrow } from "../../../teams/storage.js";
import type { AnyAgentTool } from "../common.js";
import { jsonResult, readStringParam } from "../common.js";

const TeammateSpawnSchema = Type.Object({
  team_name: Type.String({ minLength: 1, maxLength: 50 }),
  name: Type.String({ minLength: 1, maxLength: 100 }),
  agent_id: Type.Optional(Type.String()),
  model: Type.Optional(Type.String()),
});

export function createTeammateSpawnTool(_opts?: {
  agentSessionKey?: string;
  agentChannel?: unknown;
  agentAccountId?: string;
}): AnyAgentTool {
  return {
    label: "Teammate Spawn",
    name: "teammate_spawn",
    description: "Creates a new teammate agent and adds it to the team.",
    parameters: TeammateSpawnSchema,
    execute: async (_toolCallId, args) => {
      const params = args as Record<string, unknown>;

      // Extract and validate parameters
      const teamName = readStringParam(params, "team_name", { required: true });
      const name = readStringParam(params, "name", { required: true });
      const agentId = readStringParam(params, "agent_id");

      // Validate team name
      validateTeamNameOrThrow(teamName);

      // Check team exists
      const teamsDir = process.env.OPENCLAW_STATE_DIR || process.cwd();
      if (!(await teamDirectoryExists(teamsDir, teamName))) {
        return jsonResult({
          error: `Team '${teamName}' not found. Please create the team first.`,
        });
      }

      // Get team manager
      const manager = getTeamManager(teamName, teamsDir);
      const config = await manager.getTeamConfig();

      // Verify team is active
      if (config.metadata?.status !== "active") {
        return jsonResult({
          error: `Team '${teamName}' is not active (status: ${config.metadata?.status}).`,
        });
      }

      // Generate session key for the new teammate
      const sessionKey = randomUUID();

      // Add member to team ledger
      await manager.addMember({
        name,
        agentId: agentId ?? config.agent_type ?? "general-purpose",
        agentType: "member",
        status: "idle",
      });

      return jsonResult({
        sessionId: sessionKey,
        agentId: agentId ?? config.agent_type ?? "general-purpose",
        name,
        teamName,
      });
    },
  };
}
