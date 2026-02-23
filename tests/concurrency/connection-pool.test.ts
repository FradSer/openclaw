/**
 * Connection Pool Tests
 * Tests for TeamManager connection caching and lifecycle
 */

import { rmSync, mkdirSync } from "fs";
import { join } from "path";
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { getTeamManager, closeTeamManager, closeAll } from "../../src/teams/pool";

describe.concurrent("Connection Pool", () => {
  const testStateDir = join(process.cwd(), ".test-pool-temp");
  const teamName1 = "test-pool-team-1";
  const teamName2 = "test-pool-team-2";

  beforeEach(() => {
    try {
      mkdirSync(join(testStateDir, "teams", teamName1), { recursive: true });
      mkdirSync(join(testStateDir, "teams", teamName2), { recursive: true });
    } catch {
      // Directories may already exist
    }
  });

  afterEach(() => {
    closeAll();
    try {
      rmSync(join(testStateDir, "teams"), { recursive: true, force: true });
    } catch {
      // Cleanup may fail on Windows
    }
  });

  it("creates and caches TeamManager instance", () => {
    const manager1 = getTeamManager(teamName1, testStateDir);
    const manager2 = getTeamManager(teamName1, testStateDir);

    expect(manager1).toBeDefined();
    expect(manager1).toBe(manager2);
  });

  it("maintains separate instances for different teams", () => {
    const manager1 = getTeamManager(teamName1, testStateDir);
    const manager2 = getTeamManager(teamName2, testStateDir);

    expect(manager1).toBeDefined();
    expect(manager2).toBeDefined();
    expect(manager1).not.toBe(manager2);
  });

  it("closes specific TeamManager and removes from cache", () => {
    const manager = getTeamManager(teamName1, testStateDir);

    closeTeamManager(teamName1);

    const newManager = getTeamManager(teamName1, testStateDir);
    expect(newManager).not.toBe(manager);
  });

  it("closes all cached TeamManager instances", () => {
    getTeamManager(teamName1, testStateDir);
    getTeamManager(teamName2, testStateDir);

    closeAll();

    const newManager1 = getTeamManager(teamName1, testStateDir);
    const newManager2 = getTeamManager(teamName2, testStateDir);
    const newManager1Again = getTeamManager(teamName1, testStateDir);

    expect(newManager1).toBe(newManager1Again);
    expect(newManager1).not.toBe(newManager2);
  });
});
