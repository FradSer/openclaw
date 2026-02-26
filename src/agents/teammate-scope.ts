/**
 * Teammate Agent Scope Utilities
 * Provides utilities for managing teammate agent identities and directories
 */

import { join } from "node:path";

/**
 * Teammate agent ID prefix
 */
export const TEAMMATE_AGENT_ID_PREFIX = "teammate-";

/**
 * Check if an agent ID is a teammate agent
 * Teammate agent IDs start with "teammate-"
 */
export function isTeammateAgentId(agentId: string): boolean {
  return agentId.startsWith(TEAMMATE_AGENT_ID_PREFIX);
}

/**
 * Parse teammate name from agent ID
 * Returns undefined if not a valid teammate agent ID
 *
 * @example
 * parseTeammateName("teammate-researcher") // "researcher"
 * parseTeammateName("main") // undefined
 */
export function parseTeammateName(agentId: string): string | undefined {
  if (!isTeammateAgentId(agentId)) {
    return undefined;
  }
  return agentId.slice(TEAMMATE_AGENT_ID_PREFIX.length);
}

/**
 * Build teammate agent ID from name
 * Sanitizes the name to ensure valid agent ID format
 *
 * @example
 * buildTeammateAgentId("researcher") // "teammate-researcher"
 */
export function buildTeammateAgentId(name: string): string {
  const sanitizedName = sanitizeTeammateName(name);
  return `${TEAMMATE_AGENT_ID_PREFIX}${sanitizedName}`;
}

/**
 * Sanitize teammate name for use in agent ID
 * - Lowercase
 * - Replace spaces and special chars with hyphens
 * - Remove consecutive hyphens
 * - Limit length
 */
export function sanitizeTeammateName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .substring(0, 50);
}

/**
 * Resolve teammate agent directory path
 * Structure: {teamsDir}/{teamName}/agents/{name}/agent
 *
 * @param teamsDir - Base teams directory (e.g., ~/.openclaw/teams)
 * @param teamName - Team name
 * @param teammateName - Teammate name (without prefix)
 */
export function resolveTeammateAgentDir(
  teamsDir: string,
  teamName: string,
  teammateName: string,
): string {
  const sanitizedName = sanitizeTeammateName(teammateName);
  return join(teamsDir, teamName, "agents", sanitizedName, "agent");
}

/**
 * Build teammate session key
 * Format: agent:teammate-{name}:main
 *
 * This format:
 * - Uses "main" suffix like regular agents (not subagent)
 * - Team association is implicit via agent directory location
 * - Teammate ID is simply "teammate-{name}" (unique within team context)
 */
export function buildTeammateSessionKey(teammateName: string): string {
  const sanitized = sanitizeTeammateName(teammateName);
  const agentId = buildTeammateAgentId(sanitized);
  return `agent:${agentId}:main`;
}

/**
 * Check if two session keys belong to teammates in the same team
 * This is a simplified check - it compares the teammate prefixes
 */
export function areTeammatesInSameTeam(sessionKey1: string, sessionKey2: string): boolean {
  // Both must be teammate session keys
  const agentId1 = extractAgentIdFromSessionKey(sessionKey1);
  const agentId2 = extractAgentIdFromSessionKey(sessionKey2);

  if (!agentId1 || !agentId2) {
    return false;
  }

  // Both must be teammate agents
  return isTeammateAgentId(agentId1) && isTeammateAgentId(agentId2);
}

/**
 * Extract agent ID from session key
 * Session key format: agent:{agentId}:{session}
 */
function extractAgentIdFromSessionKey(sessionKey: string): string | undefined {
  const parts = sessionKey.split(":");
  if (parts.length < 3 || parts[0] !== "agent") {
    return undefined;
  }
  // Handle agent IDs that might contain colons (e.g., teammate-name:uuid format)
  return parts.slice(1, -1).join(":");
}
