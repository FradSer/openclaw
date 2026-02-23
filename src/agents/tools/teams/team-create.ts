/**
 * TeamCreate Tool
 * Creates a new team with configuration, directory structure, and SQLite ledger
 */

import { randomUUID } from "node:crypto";
import { Type } from "@sinclair/typebox";
import { getTeamManager } from "../../../teams/pool.js";
import {
  createTeamDirectory,
  teamDirectoryExists,
  validateTeamNameOrThrow,
  writeTeamConfig,
} from "../../../teams/storage.js";
import type { AnyAgentTool } from "../common.js";
import { jsonResult, readStringParam } from "../common.js";

const TeamCreateSchema = Type.Object({
  team_name: Type.String({ minLength: 1, maxLength: 50 }),
  description: Type.Optional(Type.String()),
  agent_type: Type.Optional(Type.String()),
});

export function createTeamCreateTool(opts?: { agentSessionKey?: string }): AnyAgentTool {
  return {
    label: "Team Create",
    name: "team_create",
    description: "Creates a new team for multi-agent coordination with a shared task ledger.",
    parameters: TeamCreateSchema,
    execute: async (_toolCallId, args) => {
      const params = args as Record<string, unknown>;

      // Extract and validate parameters
      const teamName = readStringParam(params, "team_name", { required: true });
      const description = readStringParam(params, "description");
      const agentType = readStringParam(params, "agent_type");

      // Validate team name format
      validateTeamNameOrThrow(teamName);

      // Check for duplicate team
      const teamsDir = process.env.OPENCLAW_STATE_DIR || process.cwd();
      if (await teamDirectoryExists(teamsDir, teamName)) {
        return jsonResult({
          error: `Team '${teamName}' already exists. Please choose a different name.`,
        });
      }

      // Create team directory structure
      await createTeamDirectory(teamsDir, teamName);

      // Generate team ID
      const teamId = randomUUID();

      // Create team configuration
      const now = Date.now();
      const leadSessionKey = opts?.agentSessionKey ?? "unknown";
      const config = {
        team_name: teamName,
        id: teamId,
        description: description ?? "",
        agent_type: agentType ?? "general-purpose",
        lead: leadSessionKey,
        metadata: {
          createdAt: now,
          updatedAt: now,
          status: "active",
        },
      };

      // Write team config
      await writeTeamConfig(teamsDir, teamName, config);

      // Get team manager and add team lead as member
      const manager = getTeamManager(teamName, teamsDir);
      await manager.addMember({
        name: leadSessionKey,
        agentId: agentType ?? "general-purpose",
        agentType: "lead",
        status: "idle",
      });

      return jsonResult({
        teamId,
        teamName,
        status: "active",
        message: `Team '${teamName}' created successfully with ID ${teamId}`,
      });
    },
  };
}
