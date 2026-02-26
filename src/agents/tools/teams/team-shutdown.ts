/**
 * TeamShutdown Tool
 * Initiates graceful team shutdown with member approval protocol
 */

import { randomUUID } from "node:crypto";
import { rm } from "node:fs/promises";
import { join } from "node:path";
import { Type } from "@sinclair/typebox";
import { getTeamManager, closeTeamManager } from "../../../teams/pool.js";
import {
  deleteTeamDirectory,
  getTeamDirectory,
  getTeamsBaseDir,
  readTeamConfig,
  teamDirectoryExists,
  validateTeamNameOrThrow,
  writeTeamConfig,
} from "../../../teams/storage.js";
import type { AnyAgentTool } from "../common.js";
import { jsonResult, readStringParam } from "../common.js";

const TeamShutdownSchema = Type.Object({
  team_name: Type.String({ minLength: 1, maxLength: 50 }),
  reason: Type.Optional(Type.String()),
});

/**
 * Clean up teammate agent directories
 * Removes {teamsDir}/{teamName}/agents/ directory
 */
async function cleanupTeammateAgentDirs(teamsDir: string, teamName: string): Promise<void> {
  const teamDir = getTeamDirectory(teamsDir, teamName);
  const agentsDir = join(teamDir, "agents");
  try {
    await rm(agentsDir, { recursive: true, force: true });
  } catch {
    // Ignore errors - directory may not exist
  }
}

export function createTeamShutdownTool(opts?: { agentSessionKey?: string }): AnyAgentTool {
  return {
    label: "Team Shutdown",
    name: "team_shutdown",
    description: "Initiates graceful team shutdown with member approval.",
    parameters: TeamShutdownSchema,
    execute: async (_toolCallId, args) => {
      const params = args as Record<string, unknown>;

      // Extract and validate parameters
      const teamName = readStringParam(params, "team_name", { required: true });
      const reason = readStringParam(params, "reason");

      // Validate team name
      validateTeamNameOrThrow(teamName);

      // Check team exists
      const teamsDir = getTeamsBaseDir();
      if (!(await teamDirectoryExists(teamsDir, teamName))) {
        return jsonResult({
          error: `Team '${teamName}' not found.`,
        });
      }

      // Get team manager
      const manager = getTeamManager(teamName, teamsDir);
      const config = (await readTeamConfig(teamsDir, teamName)) as {
        id: string;
        metadata?: { status: string };
      };

      // List members
      const members = manager.listMembers();
      const activeMembers = members.filter(
        (m): m is typeof m & { status: "working" } => m.status === "working",
      );

      // Has active members - send shutdown request
      const requestId = randomUUID();
      const pendingApprovals = activeMembers.map((m) => m.sessionKey);

      if (activeMembers.length === 0) {
        // No active members - can shutdown immediately
        const updatedConfig = { ...config, metadata: { ...config.metadata, status: "shutdown" } };
        await writeTeamConfig(teamsDir, teamName, updatedConfig);
        // Clean up teammate agent directories before deleting team directory
        await cleanupTeammateAgentDirs(teamsDir, teamName);
        await deleteTeamDirectory(teamsDir, teamName);
        closeTeamManager(teamName);

        return jsonResult({
          teamId: config.id,
          teamName,
          status: "shutdown",
          deleted: true,
        });
      }

      // Send shutdown_request to each member (via SendMessage)
      // Note: This is simplified - actual implementation would use SendMessage tool
      for (const member of activeMembers) {
        manager.storeMessage({
          id: requestId,
          from: opts?.agentSessionKey || "Team Lead",
          to: member.sessionKey,
          type: "shutdown_request",
          sender: opts?.agentSessionKey || "Team Lead",
          recipient: member.sessionKey,
          content: reason || "Team shutdown requested",
          requestId,
          timestamp: Date.now(),
        });
      }

      return jsonResult({
        teamId: config.id,
        teamName,
        status: "pending_shutdown",
        requestId,
        pendingApprovals,
        message: `Shutdown request sent to ${activeMembers.length} member(s). Waiting for approval.`,
      });
    },
  };
}
