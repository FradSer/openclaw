/**
 * Connection Pooling Tests
 * Tests for TeamManager connection caching and cleanup
 */

import os from "os";
import path from "path";
import { describe, it, expect, afterEach, vi } from "vitest";
import { TeamManager } from "./manager.js";
import { getTeamManager, closeTeamManager, closeAll, resolveStateDir } from "./pool.js";

// Mock the node:sqlite module
vi.mock("node:sqlite", () => {
  class MockDatabaseSync {
    private _path: string;
    private _isOpen: boolean = true;

    constructor(path: string) {
      this._path = path;
    }

    get path(): string {
      return this._path;
    }

    exec(_sql: string): void {
      // No-op for mock
    }

    pragma(_statement: string): void {
      // No-op for mock
    }

    close(): void {
      this._isOpen = false;
    }

    get isOpen(): boolean {
      return this._isOpen;
    }
  }

  return {
    default: MockDatabaseSync,
    DatabaseSync: MockDatabaseSync,
  };
});

// Mock fs module to avoid actual file system operations
vi.mock("node:fs", () => ({
  mkdirSync: () => {},
}));

describe("Connection Pooling", () => {
  const testStateDir = "/tmp/test-openclaw";
  const teamName1 = "test-team-1";
  const teamName2 = "test-team-2";

  afterEach(() => {
    closeAll();
  });

  describe("getTeamManager", () => {
    it("should return a new TeamManager for a new team name", () => {
      const manager = getTeamManager(teamName1, testStateDir);
      expect(manager).toBeInstanceOf(TeamManager);
    });

    it("should return the same TeamManager instance for the same team name", () => {
      const manager1 = getTeamManager(teamName1, testStateDir);
      const manager2 = getTeamManager(teamName1, testStateDir);
      expect(manager1).toBe(manager2);
    });

    it("should return different TeamManager instances for different team names", () => {
      const manager1 = getTeamManager(teamName1, testStateDir);
      const manager2 = getTeamManager(teamName2, testStateDir);
      expect(manager1).not.toBe(manager2);
    });

    it("should cache multiple TeamManager instances simultaneously", () => {
      const manager1 = getTeamManager(teamName1, testStateDir);
      const manager2 = getTeamManager(teamName2, testStateDir);
      const manager3 = getTeamManager(teamName1, testStateDir);

      expect(manager1).toBe(manager3);
      expect(manager1).not.toBe(manager2);
    });
  });

  describe("closeTeamManager", () => {
    it("should close and remove a TeamManager from the cache", () => {
      const manager = getTeamManager(teamName1, testStateDir);
      const closeSpy = vi.spyOn(manager, "close");

      closeTeamManager(teamName1);

      expect(closeSpy).toHaveBeenCalled();

      const newManager = getTeamManager(teamName1, testStateDir);
      expect(newManager).not.toBe(manager);
    });

    it("should not throw when closing a non-existent team", () => {
      expect(() => {
        closeTeamManager("non-existent-team");
      }).not.toThrow();
    });

    it("should only close the specified TeamManager", () => {
      const manager1 = getTeamManager(teamName1, testStateDir);
      const manager2 = getTeamManager(teamName2, testStateDir);
      const closeSpy1 = vi.spyOn(manager1, "close");
      const closeSpy2 = vi.spyOn(manager2, "close");

      closeTeamManager(teamName1);

      expect(closeSpy1).toHaveBeenCalled();
      expect(closeSpy2).not.toHaveBeenCalled();
    });
  });

  describe("closeAll", () => {
    it("should close all cached TeamManager instances", () => {
      const manager1 = getTeamManager(teamName1, testStateDir);
      const manager2 = getTeamManager(teamName2, testStateDir);
      const closeSpy1 = vi.spyOn(manager1, "close");
      const closeSpy2 = vi.spyOn(manager2, "close");

      closeAll();

      expect(closeSpy1).toHaveBeenCalled();
      expect(closeSpy2).toHaveBeenCalled();
    });

    it("should clear the cache after closing all managers", () => {
      getTeamManager(teamName1, testStateDir);
      getTeamManager(teamName2, testStateDir);

      closeAll();

      const newManager1 = getTeamManager(teamName1, testStateDir);
      const newManager1Again = getTeamManager(teamName1, testStateDir);

      expect(newManager1).toBe(newManager1Again);
      expect(newManager1).not.toBe(getTeamManager(teamName2, testStateDir));
    });

    it("should not throw when cache is empty", () => {
      expect(() => {
        closeAll();
      }).not.toThrow();
    });
  });

  describe("resolveStateDir", () => {
    it("should return the default state directory path", () => {
      const stateDir = resolveStateDir();
      expect(stateDir).toContain(".openclaw");
    });

    it("should use OPENCLAW_STATE_DIR environment variable if set", () => {
      const customPath = "/custom/openclaw/path";
      const originalEnv = process.env.OPENCLAW_STATE_DIR;
      process.env.OPENCLAW_STATE_DIR = customPath;

      try {
        const stateDir = resolveStateDir();
        // Use path.resolve to match platform-specific behavior
        expect(stateDir).toBe(path.resolve(customPath));
      } finally {
        if (originalEnv === undefined) {
          delete process.env.OPENCLAW_STATE_DIR;
        } else {
          process.env.OPENCLAW_STATE_DIR = originalEnv;
        }
      }
    });

    it("should expand tilde in custom path", () => {
      const originalEnv = process.env.OPENCLAW_STATE_DIR;
      process.env.OPENCLAW_STATE_DIR = "~/custom/path";

      try {
        const stateDir = resolveStateDir();
        // On Windows, short paths may contain ~ (e.g., RUNNER~1)
        // So we only check that the path starts with ~ was expanded to homedir
        expect(stateDir.startsWith(os.homedir())).toBe(true);
        expect(stateDir).toContain("custom");
      } finally {
        if (originalEnv === undefined) {
          delete process.env.OPENCLAW_STATE_DIR;
        } else {
          process.env.OPENCLAW_STATE_DIR = originalEnv;
        }
      }
    });

    it("should resolve relative paths to absolute", () => {
      const originalEnv = process.env.OPENCLAW_STATE_DIR;
      process.env.OPENCLAW_STATE_DIR = "./relative/path";

      try {
        const stateDir = resolveStateDir();
        expect(stateDir.startsWith(".")).toBe(false);
        expect(stateDir).toContain("relative");
      } finally {
        if (originalEnv === undefined) {
          delete process.env.OPENCLAW_STATE_DIR;
        } else {
          process.env.OPENCLAW_STATE_DIR = originalEnv;
        }
      }
    });

    it("should trim whitespace from environment variable", () => {
      const originalEnv = process.env.OPENCLAW_STATE_DIR;
      process.env.OPENCLAW_STATE_DIR = "  /custom/path  ";

      try {
        const stateDir = resolveStateDir();
        expect(stateDir).not.toContain(" ");
      } finally {
        if (originalEnv === undefined) {
          delete process.env.OPENCLAW_STATE_DIR;
        } else {
          process.env.OPENCLAW_STATE_DIR = originalEnv;
        }
      }
    });
  });
});
