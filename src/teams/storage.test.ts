/**
 * Team Storage Tests
 * BDD tests for team configuration and directory operations
 */

import * as fs from "fs/promises";
import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  validateTeamName,
  validateTeamNameOrThrow,
  getTeamDirectory,
  getTeamConfigPath,
  teamDirectoryExists,
  createTeamDirectory,
  writeTeamConfig,
  readTeamConfig,
  deleteTeamDirectory,
} from "./storage.js";

vi.mock("fs/promises");
vi.mock("path", () => ({
  join: vi.fn((...args: string[]) => args.join("/")),
}));

describe("Team Name Validation", () => {
  describe("Given a valid team name", () => {
    const validNames = [
      "my-team",
      "team-123",
      "team123",
      "test",
      "a",
      "team-with-multiple-hyphens",
    ];

    validNames.forEach((name) => {
      it(`When validating '${name}' Then it should be valid`, () => {
        expect(validateTeamName(name)).toBe(true);
      });
    });

    it("When validating with validateTeamNameOrThrow Then it should not throw", () => {
      expect(() => validateTeamNameOrThrow("my-team")).not.toThrow();
    });
  });

  describe("Given an invalid team name", () => {
    const invalidNames = [
      "",
      "my_team", // underscores are not allowed
      "MyTeam", // uppercase
      "my team", // spaces
      "my_team!", // special characters
      "my_team.",
      "my_team@",
      "my_team#",
      "my_team$",
      "my_team%",
      "my_team^",
      "my_team&",
      "my_team*",
      "my_team(",
      "my_team)",
      "my_team+",
      "my_team=",
      "my_team[",
      "my_team]",
      "my_team{",
      "my_team}",
      "my_team|",
      "my_team\\",
      "my_team:",
      "my_team;",
      "my_team'",
      'my_team"',
      "my_team<",
      "my_team>",
      "my_team,",
      "my_team?",
      "my_team/",
      "my_team~",
      "my_team`",
      "my_team\t",
      "my_team\n",
      "my_team\r",
      "__starts-with-underscores", // underscores not allowed
      "ends-with-underscores__", // underscores not allowed
    ];

    invalidNames.forEach((name) => {
      it(`When validating '${name}' Then it should be invalid`, () => {
        expect(validateTeamName(name)).toBe(false);
      });
    });

    it("When validating invalid name with validateTeamNameOrThrow Then it should throw", () => {
      expect(() => validateTeamNameOrThrow("MyTeam")).toThrow(
        "Invalid team name: MyTeam. Must contain only lowercase letters, numbers, and hyphens",
      );
    });

    it("When validating empty string with validateTeamNameOrThrow Then it should throw", () => {
      expect(() => validateTeamNameOrThrow("")).toThrow(
        "Invalid team name: . Must contain only lowercase letters, numbers, and hyphens",
      );
    });

    it("When validating with spaces Then it should throw", () => {
      expect(() => validateTeamNameOrThrow("my team")).toThrow();
    });
  });

  describe("Given edge case team names", () => {
    it("When validating single character Then it should be valid", () => {
      expect(validateTeamName("a")).toBe(true);
      expect(validateTeamName("1")).toBe(true);
    });

    it("When validating hyphen-only name Then it is valid per the regex", () => {
      expect(validateTeamName("-")).toBe(true);
      expect(validateTeamName("--")).toBe(true);
    });

    it("When validating name starting with hyphens Then it is valid per the regex", () => {
      expect(validateTeamName("--starts-with-hyphens")).toBe(true);
    });

    it("When validating name ending with hyphens Then it is valid per the regex", () => {
      expect(validateTeamName("ends-with-hyphens--")).toBe(true);
    });

    it("When validating underscore-only name Then it should be invalid", () => {
      expect(validateTeamName("_")).toBe(false);
      expect(validateTeamName("__")).toBe(false);
    });

    it("When validating name with underscore Then it should be invalid", () => {
      expect(validateTeamName("my_team")).toBe(false);
      expect(validateTeamName("__starts-with-underscores")).toBe(false);
      expect(validateTeamName("ends-with-underscores__")).toBe(false);
    });
  });
});

describe("Path Generation", () => {
  const teamsDir = "/path/to/teams";

  describe("Given a team name", () => {
    it("When getting team directory path Then it should return correct path", () => {
      const result = getTeamDirectory(teamsDir, "my-team");
      expect(result).toBe("/path/to/teams/my-team");
    });

    it("When getting team config path Then it should return correct path", () => {
      const result = getTeamConfigPath(teamsDir, "my-team");
      expect(result).toBe("/path/to/teams/my-team/config.json");
    });
  });
});

describe("Team Directory Existence Check", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Given an existing team directory", () => {
    it("When checking if directory exists Then it should return true", async () => {
      vi.mocked(fs.access).mockResolvedValue(undefined);

      const result = await teamDirectoryExists("/teams", "my-team");

      expect(result).toBe(true);
      expect(fs.access).toHaveBeenCalledWith("/teams/my-team", expect.any(Number));
    });
  });

  describe("Given a non-existent team directory", () => {
    it("When checking if directory exists Then it should return false", async () => {
      vi.mocked(fs.access).mockRejectedValue(new Error("ENOENT"));

      const result = await teamDirectoryExists("/teams", "my-team");

      expect(result).toBe(false);
    });
  });
});

describe("Team Directory Creation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Given a valid team name", () => {
    it("When creating team directory Then it should create all required subdirectories", async () => {
      vi.mocked(fs.mkdir).mockResolvedValue(undefined);

      await createTeamDirectory("/teams", "my-team");

      expect(fs.mkdir).toHaveBeenCalledTimes(4);
      expect(fs.mkdir).toHaveBeenCalledWith("/teams/my-team", { recursive: true });
      expect(fs.mkdir).toHaveBeenCalledWith("/teams/my-team/tasks", { recursive: true });
      expect(fs.mkdir).toHaveBeenCalledWith("/teams/my-team/messages", { recursive: true });
      expect(fs.mkdir).toHaveBeenCalledWith("/teams/my-team/inbox", { recursive: true });
    });

    it("When creating team directory Then it should validate team name", async () => {
      vi.mocked(fs.mkdir).mockResolvedValue(undefined);

      await expect(createTeamDirectory("/teams", "my-team")).resolves.not.toThrow();
    });
  });

  describe("Given an invalid team name", () => {
    it("When creating team directory Then it should throw validation error", async () => {
      await expect(createTeamDirectory("/teams", "MyTeam")).rejects.toThrow(
        "Invalid team name: MyTeam",
      );
    });

    it("When creating team directory with spaces Then it should throw", async () => {
      await expect(createTeamDirectory("/teams", "my team")).rejects.toThrow();
    });
  });
});

describe("Team Configuration Write", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Given a team configuration", () => {
    const config = {
      id: "123e4567-e89b-12d3-a456-426614174000",
      name: "my-team",
      description: "Test team",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      status: "active" as const,
      leadSessionKey: "session-1",
    };

    it("When writing team config Then it should write to temp file first", async () => {
      vi.mocked(fs.writeFile).mockResolvedValue(undefined);
      vi.mocked(fs.rm).mockResolvedValue(undefined);

      await writeTeamConfig("/teams", "my-team", config);

      expect(fs.writeFile).toHaveBeenCalledWith(
        "/teams/my-team/config.json.tmp",
        JSON.stringify(config, null, 2),
        { mode: 0o600 },
      );
    });

    it("When writing team config Then it should write to final file", async () => {
      vi.mocked(fs.writeFile).mockResolvedValue(undefined);
      vi.mocked(fs.rm).mockResolvedValue(undefined);

      await writeTeamConfig("/teams", "my-team", config);

      expect(fs.writeFile).toHaveBeenCalledWith(
        "/teams/my-team/config.json",
        JSON.stringify(config, null, 2),
        { mode: 0o600 },
      );
    });

    it("When writing team config Then it should clean up temp file", async () => {
      vi.mocked(fs.writeFile).mockResolvedValue(undefined);
      vi.mocked(fs.rm).mockResolvedValue(undefined);

      await writeTeamConfig("/teams", "my-team", config);

      expect(fs.rm).toHaveBeenCalledWith("/teams/my-team/config.json.tmp");
    });

    it("When writing team config Then it should set correct file permissions", async () => {
      vi.mocked(fs.writeFile).mockResolvedValue(undefined);
      vi.mocked(fs.rm).mockResolvedValue(undefined);

      await writeTeamConfig("/teams", "my-team", config);

      const writeCalls = vi.mocked(fs.writeFile).mock.calls;
      expect(writeCalls[0][2]).toEqual({ mode: 0o600 });
      expect(writeCalls[1][2]).toEqual({ mode: 0o600 });
    });

    it("When writing team config Then it should validate team name", async () => {
      vi.mocked(fs.writeFile).mockResolvedValue(undefined);
      vi.mocked(fs.rm).mockResolvedValue(undefined);

      await expect(writeTeamConfig("/teams", "my-team", config)).resolves.not.toThrow();
    });
  });

  describe("Given an invalid team name", () => {
    const config = { id: "test", name: "invalid" };

    it("When writing team config Then it should throw validation error", async () => {
      await expect(writeTeamConfig("/teams", "MyTeam", config)).rejects.toThrow(
        "Invalid team name: MyTeam",
      );
    });
  });

  describe("Given temp file cleanup fails", () => {
    const config = { id: "test", name: "test-team" };

    it("When writing team config Then it should still complete", async () => {
      vi.mocked(fs.writeFile).mockResolvedValue(undefined);
      vi.mocked(fs.rm).mockRejectedValue(new Error("ENOENT"));

      await expect(writeTeamConfig("/teams", "my-team", config)).resolves.not.toThrow();
    });
  });
});

describe("Team Configuration Read", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Given a stored team configuration", () => {
    const config = {
      id: "123e4567-e89b-12d3-a456-426614174000",
      name: "my-team",
      description: "Test team",
      createdAt: 1234567890,
      updatedAt: 1234567890,
      status: "active" as const,
      leadSessionKey: "session-1",
    };

    it("When reading team config Then it should parse and return the config", async () => {
      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(config, null, 2));

      const result = await readTeamConfig("/teams", "my-team");

      expect(result).toEqual(config);
      expect(fs.readFile).toHaveBeenCalledWith("/teams/my-team/config.json", "utf-8");
    });
  });

  describe("Given an invalid team name", () => {
    it("When reading team config Then it should throw validation error", async () => {
      await expect(readTeamConfig("/teams", "MyTeam")).rejects.toThrow("Invalid team name: MyTeam");
    });
  });

  describe("Given a non-existent config file", () => {
    it("When reading team config Then it should propagate file error", async () => {
      vi.mocked(fs.readFile).mockRejectedValue(new Error("ENOENT"));

      await expect(readTeamConfig("/teams", "my-team")).rejects.toThrow("ENOENT");
    });
  });

  describe("Given invalid JSON in config file", () => {
    it("When reading team config Then it should throw parse error", async () => {
      vi.mocked(fs.readFile).mockResolvedValue("invalid json");

      await expect(readTeamConfig("/teams", "my-team")).rejects.toThrow();
    });
  });
});

describe("Team Directory Deletion", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Given an existing team directory", () => {
    it("When deleting team directory Then it should remove directory recursively", async () => {
      vi.mocked(fs.rm).mockResolvedValue(undefined);

      await deleteTeamDirectory("/teams", "my-team");

      expect(fs.rm).toHaveBeenCalledWith("/teams/my-team", {
        recursive: true,
        force: true,
      });
    });

    it("When deleting team directory Then it should validate team name", async () => {
      vi.mocked(fs.rm).mockResolvedValue(undefined);

      await expect(deleteTeamDirectory("/teams", "my-team")).resolves.not.toThrow();
    });
  });

  describe("Given an invalid team name", () => {
    it("When deleting team directory Then it should throw validation error", async () => {
      await expect(deleteTeamDirectory("/teams", "MyTeam")).rejects.toThrow(
        "Invalid team name: MyTeam",
      );
    });
  });

  describe("Given a non-existent team directory", () => {
    it("When deleting team directory Then it should use force flag to succeed", async () => {
      vi.mocked(fs.rm).mockResolvedValue(undefined);

      await expect(deleteTeamDirectory("/teams", "my-team")).resolves.not.toThrow();

      expect(fs.rm).toHaveBeenCalledWith("/teams/my-team", {
        recursive: true,
        force: true,
      });
    });
  });
});

describe("End-to-End Storage Operations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Given a complete team lifecycle", () => {
    it("When creating, writing, reading, and deleting Then operations should complete successfully", async () => {
      const config = {
        id: "123e4567-e89b-12d3-a456-426614174000",
        name: "my-team",
        description: "Test team",
        createdAt: 1234567890,
        updatedAt: 1234567890,
        status: "active" as const,
        leadSessionKey: "session-1",
      };

      // Create directory
      vi.mocked(fs.mkdir).mockResolvedValue(undefined);
      await createTeamDirectory("/teams", "my-team");
      expect(fs.mkdir).toHaveBeenCalled();

      // Write config
      vi.mocked(fs.writeFile).mockResolvedValue(undefined);
      vi.mocked(fs.rm).mockResolvedValue(undefined);
      await writeTeamConfig("/teams", "my-team", config);
      expect(fs.writeFile).toHaveBeenCalledTimes(2);

      // Read config
      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(config, null, 2));
      const readConfig = await readTeamConfig("/teams", "my-team");
      expect(readConfig).toEqual(config);

      // Delete directory
      vi.mocked(fs.rm).mockResolvedValue(undefined);
      await deleteTeamDirectory("/teams", "my-team");
      expect(fs.rm).toHaveBeenCalled();
    });
  });
});
