/**
 * TeamCreate Tool
 * Creates a new team with configuration, directory structure, and SQLite ledger
 * Checks agentToAgent policy configuration for team communication
 */

import { randomUUID } from "node:crypto";
import { Type } from "@sinclair/typebox";
import { loadConfig } from "../../../config/config.js";
import { getTeamManager } from "../../../teams/pool.js";
import {
  createTeamDirectory,
  teamDirectoryExists,
  validateTeamNameOrThrow,
  writeTeamConfig,
} from "../../../teams/storage.js";
import type { AnyAgentTool } from "../common.js";
import { jsonResult, readStringParam } from "../common.js";
import { createAgentToAgentPolicy } from "../sessions-access.js";

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

      // Check agentToAgent policy configuration
      const cfg = loadConfig();
      const a2aPolicy = createAgentToAgentPolicy(cfg);
      const warnings: string[] = [];

      if (!a2aPolicy.enabled) {
        warnings.push(
          "WARNING: tools.agentToAgent is not enabled. Team communication will be restricted to same-agent messages only. Set tools.agentToAgent.enabled=true for full team communication.",
        );
      } else if (!a2aPolicy.matchesAllow("*")) {
        warnings.push(
          "NOTE: tools.agentToAgent.allow does not include '*'. Some cross-agent team communication may be restricted.",
        );
      }

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

      // Build response message
      let message = `Team '${teamName}' created successfully with ID ${teamId}`;
      if (warnings.length > 0) {
        message += `\n\n${warnings.join("\n\n")}`;
      }

      return jsonResult({
        teamId,
        teamName,
        status: "active",
        message,
        warnings: warnings.length > 0 ? warnings : undefined,
      });
    },
  };
}
