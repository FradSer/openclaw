import { describe, it, expect } from "vitest";
import type {
  TeamConfig,
  TeamMember,
  Task,
  TeamMessage,
  TeamState,
  TaskClaimResult,
  CreateTaskParams,
  TaskListOptions,
} from "./types.js";

describe("Team Types", () => {
  describe("TeamConfig", () => {
    it("should define team configuration structure", () => {
      const config: TeamConfig = {
        id: "uuid-1",
        name: "test-team",
        createdAt: Date.now(),
        updatedAt: Date.now(),
        status: "active",
        leadSessionKey: "session-1",
      };

      expect(config).toBeDefined();
      expect(config.id).toBe("uuid-1");
      expect(config.name).toBe("test-team");
      expect(config.status).toBe("active");
      expect(config.leadSessionKey).toBe("session-1");
    });

    it("should support optional fields", () => {
      const config: TeamConfig = {
        id: "uuid-1",
        name: "test-team",
        description: "Test team description",
        agentType: "general-purpose",
        createdAt: Date.now(),
        updatedAt: Date.now(),
        status: "active",
        leadSessionKey: "session-1",
      };

      expect(config.description).toBe("Test team description");
      expect(config.agentType).toBe("general-purpose");
    });

    it("should support shutdown status", () => {
      const config: TeamConfig = {
        id: "uuid-1",
        name: "test-team",
        createdAt: Date.now(),
        updatedAt: Date.now(),
        status: "shutdown",
        leadSessionKey: "session-1",
      };

      expect(config.status).toBe("shutdown");
    });
  });

  describe("TeamMember", () => {
    it("should define team member structure", () => {
      const member: TeamMember = {
        sessionKey: "session-1",
        agentId: "uuid-1",
        role: "member",
        joinedAt: Date.now(),
      };

      expect(member.sessionKey).toBe("session-1");
      expect(member.agentId).toBe("uuid-1");
      expect(member.role).toBe("member");
    });

    it("should support optional fields", () => {
      const member: TeamMember = {
        sessionKey: "session-1",
        agentId: "uuid-1",
        name: "Agent 1",
        role: "member",
        joinedAt: Date.now(),
        lastActiveAt: Date.now(),
      };

      expect(member.name).toBe("Agent 1");
      expect(member.lastActiveAt).toBeDefined();
    });

    it("should support lead role", () => {
      const member: TeamMember = {
        sessionKey: "session-1",
        agentId: "uuid-1",
        role: "lead",
        joinedAt: Date.now(),
      };

      expect(member.role).toBe("lead");
    });
  });

  describe("Task", () => {
    it("should define task structure", () => {
      const task: Task = {
        id: "task-1",
        subject: "Complete feature",
        description: "Implement the feature",
        status: "pending",
        createdAt: Date.now(),
      };

      expect(task.id).toBe("task-1");
      expect(task.subject).toBe("Complete feature");
      expect(task.description).toBe("Implement the feature");
      expect(task.status).toBe("pending");
    });

    it("should support optional fields", () => {
      const task: Task = {
        id: "task-1",
        subject: "Complete feature",
        description: "Implement the feature",
        activeForm: "Completing feature",
        status: "in_progress",
        owner: "session-1",
        dependsOn: ["task-2"],
        blockedBy: ["task-3"],
        metadata: { priority: "high" },
        createdAt: Date.now(),
        claimedAt: Date.now(),
      };

      expect(task.activeForm).toBe("Completing feature");
      expect(task.owner).toBe("session-1");
      expect(task.dependsOn).toEqual(["task-2"]);
      expect(task.blockedBy).toEqual(["task-3"]);
      expect(task.metadata).toEqual({ priority: "high" });
    });

    it("should support all task statuses", () => {
      const statuses: Task["status"][] = [
        "pending",
        "claimed",
        "in_progress",
        "completed",
        "failed",
      ];

      statuses.forEach((status) => {
        const task: Task = {
          id: `task-${status}`,
          subject: "Test task",
          description: "Test description",
          status,
          createdAt: Date.now(),
        };
        expect(task.status).toBe(status);
      });
    });
  });

  describe("TeamMessage", () => {
    it("should define message structure", () => {
      const message: TeamMessage = {
        id: "msg-1",
        type: "message",
        from: "session-1",
        to: "session-2",
        content: "Hello",
        timestamp: Date.now(),
      };

      expect(message.id).toBe("msg-1");
      expect(message.type).toBe("message");
      expect(message.from).toBe("session-1");
      expect(message.to).toBe("session-2");
      expect(message.content).toBe("Hello");
    });

    it("should support various message types", () => {
      const messageTypes: TeamMessage["type"][] = [
        "message",
        "broadcast",
        "shutdown_request",
        "shutdown_response",
        "idle",
      ];

      messageTypes.forEach((type) => {
        const message: TeamMessage = {
          id: `msg-${type}`,
          type,
          from: "session-1",
          content: "Test",
          timestamp: Date.now(),
        };
        expect(message.type).toBe(type);
      });
    });

    it("should support optional fields", () => {
      const message: TeamMessage = {
        id: "msg-1",
        type: "shutdown_response",
        from: "session-1",
        to: "session-2",
        content: "Shutdown response",
        summary: "Brief summary",
        requestId: "req-1",
        approve: true,
        reason: "Ready",
        timestamp: Date.now(),
      };

      expect(message.summary).toBe("Brief summary");
      expect(message.requestId).toBe("req-1");
      expect(message.approve).toBe(true);
      expect(message.reason).toBe("Ready");
    });
  });

  describe("TeamState", () => {
    it("should define team state structure", () => {
      const state: TeamState = {
        id: "uuid-1",
        name: "test-team",
        status: "active",
        members: [],
        pendingTaskCount: 0,
        inProgressTaskCount: 0,
        completedTaskCount: 0,
      };

      expect(state.id).toBe("uuid-1");
      expect(state.name).toBe("test-team");
      expect(state.status).toBe("active");
      expect(Array.isArray(state.members)).toBe(true);
    });

    it("should support optional description", () => {
      const state: TeamState = {
        id: "uuid-1",
        name: "test-team",
        description: "Test team",
        status: "active",
        members: [],
        pendingTaskCount: 0,
        inProgressTaskCount: 0,
        completedTaskCount: 0,
      };

      expect(state.description).toBe("Test team");
    });
  });

  describe("TaskClaimResult", () => {
    it("should define successful claim result", () => {
      const result: TaskClaimResult = {
        success: true,
        taskId: "task-1",
      };

      expect(result.success).toBe(true);
      expect(result.taskId).toBe("task-1");
    });

    it("should define failed claim result", () => {
      const result: TaskClaimResult = {
        success: false,
        taskId: "task-1",
        error: "Task already claimed",
      };

      expect(result.success).toBe(false);
      expect(result.error).toBe("Task already claimed");
    });
  });

  describe("CreateTaskParams", () => {
    it("should define create task parameters", () => {
      const params: CreateTaskParams = {
        subject: "Complete feature",
        description: "Implement the feature",
      };

      expect(params.subject).toBe("Complete feature");
      expect(params.description).toBe("Implement the feature");
    });

    it("should support optional parameters", () => {
      const params: CreateTaskParams = {
        subject: "Complete feature",
        description: "Implement the feature",
        activeForm: "Completing feature",
        dependsOn: ["task-1"],
        metadata: { priority: "high" },
      };

      expect(params.activeForm).toBe("Completing feature");
      expect(params.dependsOn).toEqual(["task-1"]);
      expect(params.metadata).toEqual({ priority: "high" });
    });
  });

  describe("TaskListOptions", () => {
    it("should define list options structure", () => {
      const options: TaskListOptions = {};

      expect(options).toBeDefined();
    });

    it("should support filter options", () => {
      const options: TaskListOptions = {
        status: "pending",
        owner: "session-1",
        includeCompleted: false,
      };

      expect(options.status).toBe("pending");
      expect(options.owner).toBe("session-1");
      expect(options.includeCompleted).toBe(false);
    });
  });
});
