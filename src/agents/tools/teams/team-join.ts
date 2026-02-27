/**
 * TeamJoin Tool
 * Allows a pre-existing standalone agent to join an existing team
 * without spawning a new container. Upsert-safe via saveMember.
 */

import { Type } from "@sinclair/typebox";
import { getTeamManager } from "../../../teams/pool.js";
import {
  getTeamsBaseDir,
  teamDirectoryExists,
  validateTeamNameOrThrow,
} from "../../../teams/storage.js";
import { resolveAgentIdFromSessionKey } from "../../agent-scope.js";
import type { AnyAgentTool } from "../common.js";
import { jsonResult, readStringParam } from "../common.js";

const TeamJoinSchema = Type.Object({
  team_name: Type.String({ minLength: 1, maxLength: 50 }),
  member_name: Type.String({ minLength: 1, maxLength: 100 }),
});

export function createTeamJoinTool(opts?: { agentSessionKey?: string }): AnyAgentTool {
  return {
    label: "Team Join",
    name: "team_join",
    description:
      "Joins an existing team as a member without spawning a new container. Use this when a standalone agent needs to participate in a team.",
    parameters: TeamJoinSchema,
    execute: async (_toolCallId, args) => {
      const params = args as Record<string, unknown>;

      const teamName = readStringParam(params, "team_name", { required: true });
      const memberName = readStringParam(params, "member_name", { required: true });

      validateTeamNameOrThrow(teamName);

      const teamsDir = getTeamsBaseDir();
      if (!(await teamDirectoryExists(teamsDir, teamName))) {
        return jsonResult({
          error: `Team '${teamName}' not found. Please create the team first.`,
        });
      }

      const manager = getTeamManager(teamName, teamsDir);
      const config = await manager.getTeamConfig();

      if (config.metadata?.status !== "active") {
        return jsonResult({
          error: `Team '${teamName}' is not active (status: ${config.metadata?.status}).`,
        });
      }

      const sessionKey = opts?.agentSessionKey || "unknown";
      const agentId = resolveAgentIdFromSessionKey(sessionKey);

      await manager.addMember({
        name: memberName,
        sessionKey,
        agentId,
        agentType: "member",
        status: "idle",
      });

      return jsonResult({
        teamName,
        memberName,
        sessionKey,
        agentId,
        status: "joined",
        message: `Successfully joined team '${teamName}' as '${memberName}'.`,
      });
    },
  };
}
