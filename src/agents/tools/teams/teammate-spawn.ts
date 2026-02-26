/**
 * TeammateSpawn Tool
 * Creates a teammate session and adds it to the team as a member
 * Uses session key format: agent:teammate-{name}:main
 * Creates independent agent directory at {teamsDir}/{teamName}/agents/{name}/agent
 * Creates workspace directory at {teamsDir}/{teamName}/agents/{name}/workspace
 */

import { randomUUID } from "node:crypto";
import { mkdir } from "node:fs/promises";
import { Type } from "@sinclair/typebox";
import { callGateway } from "../../../gateway/call.js";
import { getTeamManager } from "../../../teams/pool.js";
import {
  getTeamsBaseDir,
  teamDirectoryExists,
  validateTeamNameOrThrow,
} from "../../../teams/storage.js";
import { registerTeammateTeam } from "../../agent-scope.js";
import { AGENT_LANE_TEAMMATE } from "../../lanes.js";
import {
  buildTeammateAgentId,
  buildTeammateSessionKey,
  resolveTeammateAgentDir,
  sanitizeTeammateName,
} from "../../teammate-scope.js";
import type { AnyAgentTool } from "../common.js";
import { jsonResult, readStringParam } from "../common.js";

const TeammateSpawnSchema = Type.Object({
  team_name: Type.String({ minLength: 1, maxLength: 50 }),
  name: Type.String({ minLength: 1, maxLength: 100 }),
  agent_id: Type.Optional(Type.String()),
  model: Type.Optional(Type.String()),
});

export function createTeammateSpawnTool(opts?: {
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
      const modelParam = readStringParam(params, "model");

      // Validate team name
      validateTeamNameOrThrow(teamName);

      // Check team exists
      const teamsDir = getTeamsBaseDir();
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

      // Sanitize name for use in agent ID
      const sanitizedName = sanitizeTeammateName(name);
      const teammateAgentId = buildTeammateAgentId(sanitizedName);
      const sessionKey = buildTeammateSessionKey(sanitizedName);

      // Resolve and create independent agent directory
      const agentDir = resolveTeammateAgentDir(teamsDir, teamName, sanitizedName);

      // Resolve workspace directory for teammate (within team structure)
      const workspaceDir = `${teamsDir}/${teamName}/agents/${sanitizedName}/workspace`;

      // Resolve sessions directory for teammate (within team structure)
      const sessionsDir = `${teamsDir}/${teamName}/agents/${sanitizedName}/sessions`;

      // Create Gateway session for the teammate
      try {
        // Create independent agent directory structure
        await mkdir(agentDir, { recursive: true });
        // Create workspace directory for teammate
        await mkdir(workspaceDir, { recursive: true });
        // Create sessions directory for teammate
        await mkdir(sessionsDir, { recursive: true });

        // Register teammate team mapping for workspace resolution
        registerTeammateTeam(sanitizedName, teamName, teamsDir);

        // Set model if provided
        if (modelParam) {
          await callGateway({
            method: "sessions.patch",
            params: { key: sessionKey, model: modelParam },
            timeoutMs: 10_000,
          });
        }

        // Create the agent session with initial context
        const initialMessage = [
          `[Team Context] You are "${name}", a teammate in team "${teamName}".`,
          "",
          "Available team tools:",
          "- task_list: Find available tasks to work on",
          "- task_claim: Claim a task for yourself",
          "- task_complete: Mark a claimed task as complete",
          "- send_message: Send messages to teammates (direct or broadcast)",
          "- inbox: Check for new messages from teammates",
          "",
          "Workflow:",
          "1. Call task_list to find pending tasks",
          "2. Call task_claim to claim a task you want to work on",
          "3. Do the work required for the task",
          "4. Call task_complete when done",
          "5. **IMPORTANT: After completing a task, use send_message to notify the team leader of your results**",
          "6. Repeat or wait for messages from teammates",
          "",
          "When woken up with a 'new message from teammate' prompt, check your inbox immediately.",
          `Your session key: ${sessionKey}`,
          `Team leader session key: ${opts?.agentSessionKey || "unknown"}`,
        ].join("\n");

        const idempotencyKey = randomUUID();
        const response = await callGateway<{ runId: string }>({
          method: "agent",
          params: {
            message: initialMessage,
            sessionKey,
            deliver: false,
            lane: AGENT_LANE_TEAMMATE,
            spawnedBy: opts?.agentSessionKey,
            idempotencyKey,
          },
          timeoutMs: 10_000,
        });

        const runId = response?.runId;

        // Add member to team ledger with session key
        await manager.addMember({
          name,
          sessionKey,
          agentId: teammateAgentId,
          agentType: "member",
          status: "idle",
        });

        return jsonResult({
          teammateId: sanitizedName,
          sessionKey,
          runId,
          agentId: teammateAgentId,
          name,
          teamName,
          status: "spawned",
          agentDir,
          workspaceDir,
          sessionsDir,
          leaderSessionKey: opts?.agentSessionKey,
          message: `Teammate '${name}' spawned with session key: ${sessionKey}`,
        });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        return jsonResult({
          error: `Failed to spawn teammate: ${errorMessage}`,
          sessionKey,
        });
      }
    },
  };
}
