/**
 * Resource Limits Tests
 * Tests for enforcing resource limits
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
} from "../../teams/limits.js";

describe("Resource Limits", () => {
  describe("Team count limits", () => {
    it("allows team count below limit", () => {
      expect(checkTeamCount(5)).toBe(true);
      expect(checkTeamCount(9)).toBe(true);
      expect(checkTeamCount(10)).toBe(false);
    });

    it("exceeds max teams limit", () => {
      expect(checkTeamCount(11)).toBe(false);
      expect(checkTeamCount(100)).toBe(false);
    });
  });

  describe("Member count limits", () => {
    it("allows member count below limit", () => {
      expect(checkMemberCount(5)).toBe(true);
      expect(checkMemberCount(9)).toBe(true);
      expect(checkMemberCount(10)).toBe(false);
    });

    it("exceeds max members limit", () => {
      expect(checkMemberCount(11)).toBe(false);
      expect(checkMemberCount(100)).toBe(false);
    });
  });

  describe("Task count limits", () => {
    it("allows task count below limit", () => {
      expect(checkTaskCount(500)).toBe(true);
      expect(checkTaskCount(999)).toBe(true);
      expect(checkTaskCount(1000)).toBe(false);
    });

    it("exceeds max tasks limit", () => {
      expect(checkTaskCount(1001)).toBe(false);
      expect(checkTaskCount(10000)).toBe(false);
    });
  });

  describe("Message size limits", () => {
    it("allows message size below limit", () => {
      const smallMessage = "Hello";
      const mediumMessage = "x".repeat(50000);

      expect(validateMessageSize(smallMessage).valid).toBe(true);
      expect(validateMessageSize(mediumMessage).valid).toBe(true);
    });

    it("rejects message size exceeding limit", () => {
      const hugeMessage = "x".repeat(100001);

      const result = validateMessageSize(hugeMessage);
      expect(result.valid).toBe(false);
      expect(result.error).toContain("exceeds limit");
    });

    it("validates UTF-8 message size correctly", () => {
      // Unicode characters may use multiple bytes
      const unicodeMessage = "".repeat(10000);

      const result = validateMessageSize(unicodeMessage);
      expect(result.valid).toBe(true);
    });
  });

  describe("Task description limits", () => {
    it("allows description below limit", () => {
      const shortDesc = "Short description";
      const longDesc = "x".repeat(9999);

      expect(validateTaskDescription(shortDesc).valid).toBe(true);
      expect(validateTaskDescription(longDesc).valid).toBe(true);
    });

    it("rejects description exceeding limit", () => {
      const tooLongDesc = "x".repeat(10001);

      const result = validateTaskDescription(tooLongDesc);
      expect(result.valid).toBe(false);
      expect(result.error).toContain("exceeds limit");
    });
  });

  describe("Task subject limits", () => {
    it("allows subject below limit", () => {
      const shortSubject = "Task";
      const longSubject = "x".repeat(199);

      expect(validateTaskSubject(shortSubject).valid).toBe(true);
      expect(validateTaskSubject(longSubject).valid).toBe(true);
    });

    it("rejects subject exceeding limit", () => {
      const tooLongSubject = "x".repeat(201);

      const result = validateTaskSubject(tooLongSubject);
      expect(result.valid).toBe(false);
      expect(result.error).toContain("exceeds limit");
    });
  });

  describe("RESOURCE_LIMITS constants", () => {
    it("has correct limit values", () => {
      expect(RESOURCE_LIMITS.MAX_TEAMS).toBe(10);
      expect(RESOURCE_LIMITS.MAX_MEMBERS_PER_TEAM).toBe(10);
      expect(RESOURCE_LIMITS.MAX_TASKS_PER_TEAM).toBe(1000);
      expect(RESOURCE_LIMITS.MAX_MESSAGE_SIZE).toBe(100000);
      expect(RESOURCE_LIMITS.MAX_TASK_DESCRIPTION_LENGTH).toBe(10000);
      expect(RESOURCE_LIMITS.MAX_TASK_SUBJECT_LENGTH).toBe(200);
    });
  });
});
