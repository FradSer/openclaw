/**
 * Connection Pooling for Team Manager
 * Manages TeamManager instances and their database connections
 */

import * as os from "node:os";
import * as path from "node:path";
import { TeamManager } from "./manager.js";

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
