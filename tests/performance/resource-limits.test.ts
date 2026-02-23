/**
 * Resource Limits Enforcement Tests
 * Validates that resource limits are properly enforced for teams and operations
 * Based on OpenClaw Agent Teams Design (2026-02-23)
 */

import { describe, it, expect } from "vitest";
import {
  RESOURCE_LIMITS,
  checkTeamCount,
  checkMemberCount,
  checkTaskCount,
  validateMessageSize,
  validateTaskDescription,
  validateTaskSubject,
} from "../../src/teams/limits";

describe("Resource Limits Enforcement", () => {
  describe("Team count limit", () => {
    it("enforces maximum teams limit", () => {
      const limit = RESOURCE_LIMITS.MAX_TEAMS;
      expect(limit).toBe(10);

      const allowedAtLimit = checkTeamCount(limit - 1);
      const deniedAtLimit = checkTeamCount(limit);
      const deniedOverLimit = checkTeamCount(limit + 1);

      expect(allowedAtLimit).toBe(true);
      expect(deniedAtLimit).toBe(false);
      expect(deniedOverLimit).toBe(false);
    });

    it("allows creating up to maximum teams", () => {
      const maxTeams = RESOURCE_LIMITS.MAX_TEAMS;

      for (let i = 0; i < maxTeams; i++) {
        expect(checkTeamCount(i)).toBe(true);
      }
    });
  });

  describe("Member count limit", () => {
    it("allows adding up to maximum members", () => {
      const maxMembers = RESOURCE_LIMITS.MAX_MEMBERS_PER_TEAM;
      expect(maxMembers).toBe(10);

      const allowedAtLimit = checkMemberCount(maxMembers - 1);
      const deniedAtLimit = checkMemberCount(maxMembers);
      const deniedOverLimit = checkMemberCount(maxMembers + 1);

      expect(allowedAtLimit).toBe(true);
      expect(deniedAtLimit).toBe(false);
      expect(deniedOverLimit).toBe(false);
    });
  });

  describe("Task count limit", () => {
    it("enforces maximum tasks limit", () => {
      const maxTasks = RESOURCE_LIMITS.MAX_TASKS_PER_TEAM;
      expect(maxTasks).toBe(1000);

      const allowedAtLimit = checkTaskCount(maxTasks - 1);
      const deniedAtLimit = checkTaskCount(maxTasks);
      const deniedOverLimit = checkTaskCount(maxTasks + 1);

      expect(allowedAtLimit).toBe(true);
      expect(deniedAtLimit).toBe(false);
      expect(deniedOverLimit).toBe(false);
    });

    it("validates large task counts efficiently", () => {
      const taskCount = 500;
      expect(checkTaskCount(taskCount)).toBe(true);
    });
  });

  describe("Message size limit", () => {
    it("validates messages within size limit", () => {
      const shortMessage = "Hello team!";
      const result = validateMessageSize(shortMessage);
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it("rejects messages exceeding size limit", () => {
      const limit = RESOURCE_LIMITS.MAX_MESSAGE_SIZE;
      const longMessage = "x".repeat(limit + 1);

      const result = validateMessageSize(longMessage);
      expect(result.valid).toBe(false);
      expect(result.error).toContain(`exceeds limit of ${limit} bytes`);
    });

    it("validates messages at exact limit boundary", () => {
      const limit = RESOURCE_LIMITS.MAX_MESSAGE_SIZE;
      const message = "x".repeat(limit);

      const result = validateMessageSize(message);
      expect(result.valid).toBe(true);
    });

    it("validates UTF-8 message size correctly", () => {
      const message = "".repeat(25000);

      const byteLength = Buffer.byteLength(message, "utf8");
      const result = validateMessageSize(message);

      expect(byteLength).toBeLessThan(RESOURCE_LIMITS.MAX_MESSAGE_SIZE);
      expect(result.valid).toBe(true);
    });
  });

  describe("Task content limits", () => {
    it("validates task description length", () => {
      const maxDesc = RESOURCE_LIMITS.MAX_TASK_DESCRIPTION_LENGTH;
      expect(maxDesc).toBe(10000);

      const shortDesc = "Short description";
      const shortResult = validateTaskDescription(shortDesc);
      expect(shortResult.valid).toBe(true);

      const longDesc = "x".repeat(maxDesc + 1);
      const longResult = validateTaskDescription(longDesc);
      expect(longResult.valid).toBe(false);
      expect(longResult.error).toContain("exceeds limit");
    });

    it("validates task subject length", () => {
      const maxSubject = RESOURCE_LIMITS.MAX_TASK_SUBJECT_LENGTH;
      expect(maxSubject).toBe(200);

      const shortSubject = "Fix bug";
      const shortResult = validateTaskSubject(shortSubject);
      expect(shortResult.valid).toBe(true);

      const longSubject = "x".repeat(maxSubject + 1);
      const longResult = validateTaskSubject(longSubject);
      expect(longResult.valid).toBe(false);
      expect(longResult.error).toContain("exceeds limit");
    });

    it("validates at exact boundary", () => {
      const maxDesc = RESOURCE_LIMITS.MAX_TASK_DESCRIPTION_LENGTH;
      const boundaryDesc = "x".repeat(maxDesc);
      const boundaryResult = validateTaskDescription(boundaryDesc);
      expect(boundaryResult.valid).toBe(true);

      const maxSubject = RESOURCE_LIMITS.MAX_TASK_SUBJECT_LENGTH;
      const boundarySubject = "x".repeat(maxSubject);
      const subjectResult = validateTaskSubject(boundarySubject);
      expect(subjectResult.valid).toBe(true);
    });
  });

  describe("Combined resource constraints", () => {
    it("enforces all limits simultaneously", () => {
      const teamCount = 5;
      const memberCount = 5;
      const taskCount = 100;

      const teamsOk = checkTeamCount(teamCount);
      const membersOk = checkMemberCount(memberCount);
      const tasksOk = checkTaskCount(taskCount);

      expect(teamsOk).toBe(true);
      expect(membersOk).toBe(true);
      expect(tasksOk).toBe(true);

      const overTeamLimit = checkTeamCount(RESOURCE_LIMITS.MAX_TEAMS + 1);
      const overMemberLimit = checkMemberCount(RESOURCE_LIMITS.MAX_MEMBERS_PER_TEAM + 1);
      const overTaskLimit = checkTaskCount(RESOURCE_LIMITS.MAX_TASKS_PER_TEAM + 1);

      expect(overTeamLimit).toBe(false);
      expect(overMemberLimit).toBe(false);
      expect(overTaskLimit).toBe(false);
    });
  });
});
