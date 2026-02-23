/**
 * Performance Benchmarks
 * Measures performance characteristics of critical team operations
 * Based on OpenClaw Agent Teams Design (2026-02-23)
 */

import { describe, it, expect } from "vitest";
import {
  validateMessageSize,
  validateTaskDescription,
  validateTaskSubject,
  RESOURCE_LIMITS,
  checkTeamCount,
  checkMemberCount,
  checkTaskCount,
} from "../../src/teams/limits";

interface BenchmarkResult {
  name: string;
  iterations: number;
  totalTime: number;
  avgTime: number;
  minTime: number;
  maxTime: number;
}

function runBenchmark(name: string, iterations: number, fn: () => void): BenchmarkResult {
  const times: number[] = [];

  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    fn();
    const end = performance.now();
    times.push(end - start);
  }

  const totalTime = times.reduce((sum, t) => sum + t, 0);
  const avgTime = totalTime / iterations;
  const minTime = Math.min(...times);
  const maxTime = Math.max(...times);

  return { name, iterations, totalTime, avgTime, minTime, maxTime };
}

describe("Performance Benchmarks", () => {
  describe("Resource limit checks", () => {
    it("checks team count efficiently", () => {
      const result = runBenchmark("check_team_count", 10000, () => {
        checkTeamCount(5);
      });

      expect(result.avgTime).toBeLessThan(0.01);
      expect(result.iterations).toBe(10000);
    });

    it("checks member count efficiently", () => {
      const result = runBenchmark("check_member_count", 10000, () => {
        checkMemberCount(5);
      });

      expect(result.avgTime).toBeLessThan(0.01);
    });

    it("checks task count efficiently", () => {
      const result = runBenchmark("check_task_count", 10000, () => {
        checkTaskCount(500);
      });

      expect(result.avgTime).toBeLessThan(0.01);
    });
  });

  describe("Message validation performance", () => {
    it("validates small messages efficiently", () => {
      const message = "Hello team!";
      const result = runBenchmark("validate_small_message", 10000, () => {
        validateMessageSize(message);
      });

      expect(result.avgTime).toBeLessThan(0.01);
    });

    it("validates large messages efficiently", () => {
      const message = "x".repeat(50000);
      const result = runBenchmark("validate_large_message", 1000, () => {
        validateMessageSize(message);
      });

      expect(result.avgTime).toBeLessThan(0.1);
    });

    it("validates UTF-8 messages efficiently", () => {
      const message = "".repeat(25000);
      const result = runBenchmark("validate_utf8_message", 1000, () => {
        validateMessageSize(message);
      });

      expect(result.avgTime).toBeLessThan(0.1);
    });
  });

  describe("Task content validation performance", () => {
    it("validates task descriptions efficiently", () => {
      const description = "Task description for validation";
      const result = runBenchmark("validate_task_description", 10000, () => {
        validateTaskDescription(description);
      });

      expect(result.avgTime).toBeLessThan(0.01);
    });

    it("validates long task descriptions efficiently", () => {
      const description = "x".repeat(5000);
      const result = runBenchmark("validate_long_description", 1000, () => {
        validateTaskDescription(description);
      });

      expect(result.avgTime).toBeLessThan(0.01);
    });

    it("validates task subjects efficiently", () => {
      const subject = "Fix authentication bug";
      const result = runBenchmark("validate_task_subject", 10000, () => {
        validateTaskSubject(subject);
      });

      expect(result.avgTime).toBeLessThan(0.01);
    });
  });

  describe("String operations performance", () => {
    it("measures buffer byte length computation", () => {
      const strings = ["hello", "".repeat(100), "x".repeat(1000)];
      const result = runBenchmark("buffer_byte_length", 10000, () => {
        for (const str of strings) {
          Buffer.byteLength(str, "utf8");
        }
      });

      expect(result.avgTime).toBeLessThan(0.05);
    });

    it("measures string repetition performance", () => {
      const result = runBenchmark("string_repeat", 1000, () => {
        "x".repeat(10000);
      });

      expect(result.avgTime).toBeLessThan(0.1);
    });
  });

  describe("Throughput benchmarks", () => {
    it("achieves high validation throughput", () => {
      const message = "Test message content";
      const iterations = 50000;

      const start = performance.now();
      for (let i = 0; i < iterations; i++) {
        validateMessageSize(message);
      }
      const duration = performance.now() - start;

      const validationsPerSecond = iterations / (duration / 1000);
      expect(validationsPerSecond).toBeGreaterThan(100000);
    });

    it("achieves high limit check throughput", () => {
      const iterations = 50000;

      const start = performance.now();
      for (let i = 0; i < iterations; i++) {
        checkTeamCount(5);
        checkMemberCount(10);
        checkTaskCount(500);
      }
      const duration = performance.now() - start;

      const checksPerSecond = (iterations * 3) / (duration / 1000);
      expect(checksPerSecond).toBeGreaterThan(100000);
    });
  });

  describe("Memory efficiency", () => {
    it("validates large messages without memory blowup", () => {
      const largeMessage = "x".repeat(100000);
      const iterations = 100;

      const initialMemory = process.memoryUsage().heapUsed;

      for (let i = 0; i < iterations; i++) {
        validateMessageSize(largeMessage);
      }

      const afterMemory = process.memoryUsage().heapUsed;
      const memoryDelta = afterMemory - initialMemory;

      expect(memoryDelta).toBeLessThan(5 * 1024 * 1024);
    });

    it("handles repeated string operations efficiently", () => {
      const initialMemory = process.memoryUsage().heapUsed;

      for (let i = 0; i < 1000; i++) {
        const message = `Message ${i}: ${"x".repeat(100)}`;
        validateMessageSize(message);
      }

      const afterMemory = process.memoryUsage().heapUsed;
      const memoryDelta = afterMemory - initialMemory;

      expect(memoryDelta).toBeLessThan(2 * 1024 * 1024);
    });
  });

  describe("Edge case performance", () => {
    it("handles empty strings efficiently", () => {
      const result = runBenchmark("validate_empty_message", 10000, () => {
        validateMessageSize("");
      });

      expect(result.avgTime).toBeLessThan(0.01);
    });

    it("handles boundary values efficiently", () => {
      const boundaryMessage = "x".repeat(RESOURCE_LIMITS.MAX_MESSAGE_SIZE);
      const result = runBenchmark("validate_boundary_message", 1000, () => {
        validateMessageSize(boundaryMessage);
      });

      expect(result.avgTime).toBeLessThan(0.1);
    });

    it("handles limit boundary checks efficiently", () => {
      const maxTeams = RESOURCE_LIMITS.MAX_TEAMS;
      const maxMembers = RESOURCE_LIMITS.MAX_MEMBERS_PER_TEAM;
      const maxTasks = RESOURCE_LIMITS.MAX_TASKS_PER_TEAM;

      const result = runBenchmark("limit_boundary_checks", 1000, () => {
        checkTeamCount(maxTeams - 1);
        checkMemberCount(maxMembers - 1);
        checkTaskCount(maxTasks - 1);
      });

      expect(result.avgTime).toBeLessThan(0.01);
    });
  });
});
