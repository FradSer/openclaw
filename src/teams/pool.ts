/**
 * Connection Pooling for Team Manager
 * Manages TeamManager instances and their database connections
 */

import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import type { TaskWithComputed } from "./manager.js";
import { TeamManager } from "./manager.js";
import { getTeamsBaseDir } from "./storage.js";

/**
 * Connection cache for TeamManager instances
 */
const connectionCache = new Map<string, TeamManager>();

/**
 * Get or create a TeamManager for the given team
 */
export function getTeamManager(teamName: string, stateDir: string): TeamManager {
  if (!connectionCache.has(teamName)) {
    connectionCache.set(teamName, new TeamManager(teamName, stateDir));
  }
  return connectionCache.get(teamName)!;
}

/**
 * Close and remove a TeamManager from the cache
 */
export function closeTeamManager(teamName: string): void {
  const manager = connectionCache.get(teamName);
  if (manager) {
    manager.close();
    connectionCache.delete(teamName);
  }
}

/**
 * Close all cached TeamManager instances
 */
export function closeAll(): void {
  connectionCache.forEach((manager) => {
    manager.close();
  });
  connectionCache.clear();
}

/**
 * Resolve the state directory path
 * Uses OPENCLAW_STATE_DIR env var or defaults to ~/.openclaw
 */
export function resolveStateDir(): string {
  const override = process.env.OPENCLAW_STATE_DIR?.trim();
  if (override) {
    return override.startsWith("~")
      ? path.join(os.homedir(), override.slice(1))
      : path.resolve(override);
  }
  return path.join(os.homedir(), ".openclaw");
}

/**
 * List team directories that contain a config.json (i.e. valid teams).
 * Uses getTeamsBaseDir() — same resolution as all team tools.
 */
export function listTeamDirectories(): string[] {
  const teamsDir = getTeamsBaseDir();
  let entries: string[];
  try {
    entries = fs.readdirSync(teamsDir);
  } catch {
    return [];
  }
  return entries.filter((name) => {
    try {
      const configPath = path.join(teamsDir, name, "config.json");
      return fs.statSync(configPath).isFile();
    } catch {
      return false;
    }
  });
}

/**
 * Task with the originating team name attached.
 */
export interface CrossTeamTask extends TaskWithComputed {
  teamName: string;
}

/**
 * Find available tasks across all teams where the given agent is a member.
 * Uses getTeamsBaseDir() — same resolution as all team tools.
 */
export function findAvailableTasksAcrossTeams(sessionKey: string, limit = 10): CrossTeamTask[] {
  const teamsDir = getTeamsBaseDir();
  const teamNames = listTeamDirectories();
  const results: CrossTeamTask[] = [];

  for (const teamName of teamNames) {
    if (results.length >= limit) {
      break;
    }

    const manager = getTeamManager(teamName, teamsDir);
    const memberName = manager.getMemberName(sessionKey);

    // Skip teams where the agent is not a member
    if (!memberName) {
      continue;
    }

    const remaining = limit - results.length;
    const tasks = manager.findAvailableTask(remaining, memberName);

    for (const task of tasks) {
      results.push({ ...task, teamName });
    }
  }

  return results;
}
