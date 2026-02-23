/**
 * TaskList Tool Tests
 * Tests for querying tasks with filtering options
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { createTaskListTool } from "./task-list.js";

// Helper type for test data assertions
type TaskListResultData = {
  tasks: Array<{
    id: string;
    subject: string;
    description: string;
    status: string;
    owner?: string;
    createdAt: number;
    activeForm?: string;
    metadata?: Record<string, unknown>;
    claimedAt?: number;
  }>;
  count: number;
  teamName: string;
};

// Mock the dependencies
vi.mock("../../../teams/storage.js", () => ({
  validateTeamNameOrThrow: vi.fn(),
}));

vi.mock("../../../teams/pool.js", () => ({
  getTeamManager: vi.fn(),
}));

describe("TaskList Tool", () => {
  let mockManager: {
    listTasks: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Create a fresh mock manager for each test
    mockManager = {
      listTasks: vi.fn(),
    };

    // Set default OPENCLAW_STATE_DIR
    process.env.OPENCLAW_STATE_DIR = "/tmp/openclaw-test";
  });

  describe("List All Tasks", () => {
    it("should return all tasks", async () => {
      const { getTeamManager } = await import("../../../teams/pool.js");
      const { validateTeamNameOrThrow } = await import("../../../teams/storage.js");

      const tasks = [
        {
          id: "1",
          subject: "First task",
          description: "Test",
          status: "pending",
          owner: "",
          blockedBy: [],
          blocks: [],
          createdAt: 1000,
        },
        {
          id: "2",
          subject: "Second task",
          description: "Test",
          status: "pending",
          owner: "",
          blockedBy: [],
          blocks: [],
          createdAt: 2000,
        },
        {
          id: "3",
          subject: "Third task",
          description: "Test",
          status: "pending",
          owner: "",
          blockedBy: [],
          blocks: [],
          createdAt: 1500,
        },
      ];

      (validateTeamNameOrThrow as ReturnType<typeof vi.fn>).mockImplementation(() => {});
      (getTeamManager as ReturnType<typeof vi.fn>).mockReturnValue(mockManager);
      mockManager.listTasks.mockReturnValue(tasks);

      const tool = createTaskListTool();
      const result = await tool.execute("tool-call-1", {
        team_name: "test-team",
      });

      const data = result.details as TaskListResultData;

      expect(data.tasks).toHaveLength(3);
      // Tasks are returned in the order from listTasks
      expect(data.tasks[0].id).toBe("1");
      expect(data.tasks[1].id).toBe("2");
      expect(data.tasks[2].id).toBe("3");
    });

    it("should include all task fields", async () => {
      const { getTeamManager } = await import("../../../teams/pool.js");
      const { validateTeamNameOrThrow } = await import("../../../teams/storage.js");

      const tasks = [
        {
          id: "task-1",
          subject: "Test Task",
          description: "Test Description",
          activeForm: "Testing",
          status: "pending",
          owner: "agent-1",
          blockedBy: [],
          blocks: [],
          metadata: { priority: "high" },
          createdAt: 1000,
          claimedAt: 2000,
          completedAt: undefined,
        },
      ];

      (validateTeamNameOrThrow as ReturnType<typeof vi.fn>).mockImplementation(() => {});
      (getTeamManager as ReturnType<typeof vi.fn>).mockReturnValue(mockManager);
      mockManager.listTasks.mockReturnValue(tasks);

      const tool = createTaskListTool();
      const result = await tool.execute("tool-call-1", {
        team_name: "test-team",
      });

      const data = result.details as TaskListResultData;
      const task = data.tasks[0];

      expect(task.id).toBe("task-1");
      expect(task.subject).toBe("Test Task");
      expect(task.description).toBe("Test Description");
      expect(task.activeForm).toBe("Testing");
      expect(task.status).toBe("pending");
      expect(task.owner).toBe("agent-1");
      expect(task.metadata).toEqual({ priority: "high" });
      expect(task.createdAt).toBe(1000);
      expect(task.claimedAt).toBe(2000);
    });
  });

  describe("Filter by Status", () => {
    it("should filter tasks by status parameter", async () => {
      const { getTeamManager } = await import("../../../teams/pool.js");
      const { validateTeamNameOrThrow } = await import("../../../teams/storage.js");

      const tasks = [
        {
          id: "1",
          subject: "Task 1",
          description: "Test",
          status: "pending",
          owner: "",
          blockedBy: [],
          blocks: [],
          createdAt: 1000,
        },
        {
          id: "2",
          subject: "Task 2",
          description: "Test",
          status: "in_progress",
          owner: "agent-1",
          blockedBy: [],
          blocks: [],
          createdAt: 2000,
        },
        {
          id: "3",
          subject: "Task 3",
          description: "Test",
          status: "pending",
          owner: "",
          blockedBy: [],
          blocks: [],
          createdAt: 3000,
        },
      ];

      (validateTeamNameOrThrow as ReturnType<typeof vi.fn>).mockImplementation(() => {});
      (getTeamManager as ReturnType<typeof vi.fn>).mockReturnValue(mockManager);
      mockManager.listTasks.mockReturnValue(tasks);

      const tool = createTaskListTool();
      const result = await tool.execute("tool-call-1", {
        team_name: "test-team",
        status: "pending",
      });

      const data = result.details as TaskListResultData;

      expect(data.tasks).toHaveLength(2);
      expect(
        data.tasks.every((t: unknown) => (t as Record<string, unknown>).status === "pending"),
      ).toBe(true);
    });

    it('should return only pending tasks when status="pending"', async () => {
      const { getTeamManager } = await import("../../../teams/pool.js");
      const { validateTeamNameOrThrow } = await import("../../../teams/storage.js");

      const tasks = [
        {
          id: "1",
          subject: "Pending task",
          description: "Test",
          status: "pending",
          owner: "",
          blockedBy: [],
          blocks: [],
          createdAt: 1000,
        },
        {
          id: "2",
          subject: "In progress task",
          description: "Test",
          status: "in_progress",
          owner: "agent-1",
          blockedBy: [],
          blocks: [],
          createdAt: 2000,
        },
      ];

      (validateTeamNameOrThrow as ReturnType<typeof vi.fn>).mockImplementation(() => {});
      (getTeamManager as ReturnType<typeof vi.fn>).mockReturnValue(mockManager);
      mockManager.listTasks.mockReturnValue(tasks);

      const tool = createTaskListTool();
      const result = await tool.execute("tool-call-1", {
        team_name: "test-team",
        status: "pending",
      });

      const data = result.details as TaskListResultData;

      expect(data.tasks).toHaveLength(1);
      expect(data.tasks[0].id).toBe("1");
    });

    it('should return only claimed tasks when status="claimed"', async () => {
      const { getTeamManager } = await import("../../../teams/pool.js");
      const { validateTeamNameOrThrow } = await import("../../../teams/storage.js");

      const tasks = [
        {
          id: "1",
          subject: "Claimed task",
          description: "Test",
          status: "claimed",
          owner: "agent-1",
          blockedBy: [],
          blocks: [],
          createdAt: 1000,
        },
        {
          id: "2",
          subject: "Pending task",
          description: "Test",
          status: "pending",
          owner: "",
          blockedBy: [],
          blocks: [],
          createdAt: 2000,
        },
      ];

      (validateTeamNameOrThrow as ReturnType<typeof vi.fn>).mockImplementation(() => {});
      (getTeamManager as ReturnType<typeof vi.fn>).mockReturnValue(mockManager);
      mockManager.listTasks.mockReturnValue(tasks);

      const tool = createTaskListTool();
      const result = await tool.execute("tool-call-1", {
        team_name: "test-team",
        status: "claimed",
      });

      const data = result.details as TaskListResultData;

      expect(data.tasks).toHaveLength(1);
      expect(data.tasks[0].id).toBe("1");
    });

    it('should return only completed tasks when status="completed"', async () => {
      const { getTeamManager } = await import("../../../teams/pool.js");
      const { validateTeamNameOrThrow } = await import("../../../teams/storage.js");

      const tasks = [
        {
          id: "1",
          subject: "Completed task",
          description: "Test",
          status: "completed",
          owner: "agent-1",
          blockedBy: [],
          blocks: [],
          createdAt: 1000,
        },
        {
          id: "2",
          subject: "Pending task",
          description: "Test",
          status: "pending",
          owner: "",
          blockedBy: [],
          blocks: [],
          createdAt: 2000,
        },
      ];

      (validateTeamNameOrThrow as ReturnType<typeof vi.fn>).mockImplementation(() => {});
      (getTeamManager as ReturnType<typeof vi.fn>).mockReturnValue(mockManager);
      mockManager.listTasks.mockReturnValue(tasks);

      const tool = createTaskListTool();
      const result = await tool.execute("tool-call-1", {
        team_name: "test-team",
        status: "completed",
        includeCompleted: true,
      });

      const data = result.details as TaskListResultData;

      expect(data.tasks).toHaveLength(1);
      expect(data.tasks[0].id).toBe("1");
    });

    it('should return only deleted tasks when status="deleted"', async () => {
      const { getTeamManager } = await import("../../../teams/pool.js");
      const { validateTeamNameOrThrow } = await import("../../../teams/storage.js");

      const tasks = [
        {
          id: "1",
          subject: "Deleted task",
          description: "Test",
          status: "deleted",
          owner: "agent-1",
          blockedBy: [],
          blocks: [],
          createdAt: 1000,
        },
        {
          id: "2",
          subject: "Pending task",
          description: "Test",
          status: "pending",
          owner: "",
          blockedBy: [],
          blocks: [],
          createdAt: 2000,
        },
      ];

      (validateTeamNameOrThrow as ReturnType<typeof vi.fn>).mockImplementation(() => {});
      (getTeamManager as ReturnType<typeof vi.fn>).mockReturnValue(mockManager);
      mockManager.listTasks.mockReturnValue(tasks);

      const tool = createTaskListTool();
      const result = await tool.execute("tool-call-1", {
        team_name: "test-team",
        status: "deleted",
        includeCompleted: true,
      });

      const data = result.details as TaskListResultData;

      expect(data.tasks).toHaveLength(1);
      expect(data.tasks[0].id).toBe("1");
    });

    it('should return only in_progress tasks when status="in_progress"', async () => {
      const { getTeamManager } = await import("../../../teams/pool.js");
      const { validateTeamNameOrThrow } = await import("../../../teams/storage.js");

      const tasks = [
        {
          id: "1",
          subject: "In progress task",
          description: "Test",
          status: "in_progress",
          owner: "agent-1",
          blockedBy: [],
          blocks: [],
          createdAt: 1000,
        },
        {
          id: "2",
          subject: "Pending task",
          description: "Test",
          status: "pending",
          owner: "",
          blockedBy: [],
          blocks: [],
          createdAt: 2000,
        },
      ];

      (validateTeamNameOrThrow as ReturnType<typeof vi.fn>).mockImplementation(() => {});
      (getTeamManager as ReturnType<typeof vi.fn>).mockReturnValue(mockManager);
      mockManager.listTasks.mockReturnValue(tasks);

      const tool = createTaskListTool();
      const result = await tool.execute("tool-call-1", {
        team_name: "test-team",
        status: "in_progress",
      });

      const data = result.details as TaskListResultData;

      expect(data.tasks).toHaveLength(1);
      expect(data.tasks[0].id).toBe("1");
    });
  });

  describe("Filter by Owner", () => {
    it("should filter tasks by owner parameter", async () => {
      const { getTeamManager } = await import("../../../teams/pool.js");
      const { validateTeamNameOrThrow } = await import("../../../teams/storage.js");

      const tasks = [
        {
          id: "1",
          subject: "Task 1",
          description: "Test",
          status: "pending",
          owner: "agent-1",
          blockedBy: [],
          blocks: [],
          createdAt: 1000,
        },
        {
          id: "2",
          subject: "Task 2",
          description: "Test",
          status: "in_progress",
          owner: "agent-2",
          blockedBy: [],
          blocks: [],
          createdAt: 2000,
        },
        {
          id: "3",
          subject: "Task 3",
          description: "Test",
          status: "pending",
          owner: "agent-1",
          blockedBy: [],
          blocks: [],
          createdAt: 3000,
        },
      ];

      (validateTeamNameOrThrow as ReturnType<typeof vi.fn>).mockImplementation(() => {});
      (getTeamManager as ReturnType<typeof vi.fn>).mockReturnValue(mockManager);
      mockManager.listTasks.mockReturnValue(tasks);

      const tool = createTaskListTool();
      const result = await tool.execute("tool-call-1", {
        team_name: "test-team",
        owner: "agent-1",
      });

      const data = result.details as TaskListResultData;

      expect(data.tasks).toHaveLength(2);
      expect(
        data.tasks.every((t: unknown) => (t as Record<string, unknown>).owner === "agent-1"),
      ).toBe(true);
    });

    it("should return only tasks owned by specified session", async () => {
      const { getTeamManager } = await import("../../../teams/pool.js");
      const { validateTeamNameOrThrow } = await import("../../../teams/storage.js");

      const tasks = [
        {
          id: "1",
          subject: "Agent 1 task",
          description: "Test",
          status: "in_progress",
          owner: "agent-1",
          blockedBy: [],
          blocks: [],
          createdAt: 1000,
        },
        {
          id: "2",
          subject: "Agent 2 task",
          description: "Test",
          status: "in_progress",
          owner: "agent-2",
          blockedBy: [],
          blocks: [],
          createdAt: 2000,
        },
      ];

      (validateTeamNameOrThrow as ReturnType<typeof vi.fn>).mockImplementation(() => {});
      (getTeamManager as ReturnType<typeof vi.fn>).mockReturnValue(mockManager);
      mockManager.listTasks.mockReturnValue(tasks);

      const tool = createTaskListTool();
      const result = await tool.execute("tool-call-1", {
        team_name: "test-team",
        owner: "agent-1",
      });

      const data = result.details as TaskListResultData;

      expect(data.tasks).toHaveLength(1);
      expect(data.tasks[0].id).toBe("1");
      expect(data.tasks[0].owner).toBe("agent-1");
    });

    it("should return empty owner for unassigned tasks", async () => {
      const { getTeamManager } = await import("../../../teams/pool.js");
      const { validateTeamNameOrThrow } = await import("../../../teams/storage.js");

      const tasks = [
        {
          id: "1",
          subject: "Unassigned task",
          description: "Test",
          status: "pending",
          owner: "",
          blockedBy: [],
          blocks: [],
          createdAt: 1000,
        },
      ];

      (validateTeamNameOrThrow as ReturnType<typeof vi.fn>).mockImplementation(() => {});
      (getTeamManager as ReturnType<typeof vi.fn>).mockReturnValue(mockManager);
      mockManager.listTasks.mockReturnValue(tasks);

      const tool = createTaskListTool();
      const result = await tool.execute("tool-call-1", {
        team_name: "test-team",
      });

      const data = result.details as TaskListResultData;

      expect(data.tasks[0].owner).toBe("");
    });
  });

  describe("Include Completed", () => {
    it("should exclude completed tasks by default", async () => {
      const { getTeamManager } = await import("../../../teams/pool.js");
      const { validateTeamNameOrThrow } = await import("../../../teams/storage.js");

      const tasks = [
        {
          id: "1",
          subject: "Pending task",
          description: "Test",
          status: "pending",
          owner: "",
          blockedBy: [],
          blocks: [],
          createdAt: 1000,
        },
        {
          id: "2",
          subject: "Completed task",
          description: "Test",
          status: "completed",
          owner: "agent-1",
          blockedBy: [],
          blocks: [],
          createdAt: 2000,
        },
        {
          id: "3",
          subject: "In progress task",
          description: "Test",
          status: "in_progress",
          owner: "agent-2",
          blockedBy: [],
          blocks: [],
          createdAt: 3000,
        },
      ];

      (validateTeamNameOrThrow as ReturnType<typeof vi.fn>).mockImplementation(() => {});
      (getTeamManager as ReturnType<typeof vi.fn>).mockReturnValue(mockManager);
      mockManager.listTasks.mockReturnValue(tasks);

      const tool = createTaskListTool();
      const result = await tool.execute("tool-call-1", {
        team_name: "test-team",
      });

      const data = result.details as TaskListResultData;

      expect(data.tasks).toHaveLength(2);
      expect(
        data.tasks.every((t: unknown) => {
          const status = (t as Record<string, unknown>).status;
          return status !== "completed" && status !== "deleted";
        }),
      ).toBe(true);
    });

    it("should exclude deleted tasks by default", async () => {
      const { getTeamManager } = await import("../../../teams/pool.js");
      const { validateTeamNameOrThrow } = await import("../../../teams/storage.js");

      const tasks = [
        {
          id: "1",
          subject: "Pending task",
          description: "Test",
          status: "pending",
          owner: "",
          blockedBy: [],
          blocks: [],
          createdAt: 1000,
        },
        {
          id: "2",
          subject: "Deleted task",
          description: "Test",
          status: "deleted",
          owner: "agent-1",
          blockedBy: [],
          blocks: [],
          createdAt: 2000,
        },
      ];

      (validateTeamNameOrThrow as ReturnType<typeof vi.fn>).mockImplementation(() => {});
      (getTeamManager as ReturnType<typeof vi.fn>).mockReturnValue(mockManager);
      mockManager.listTasks.mockReturnValue(tasks);

      const tool = createTaskListTool();
      const result = await tool.execute("tool-call-1", {
        team_name: "test-team",
      });

      const data = result.details as TaskListResultData;

      expect(data.tasks).toHaveLength(1);
      expect(data.tasks[0].status).not.toBe("deleted");
    });

    it("should include completed tasks when requested", async () => {
      const { getTeamManager } = await import("../../../teams/pool.js");
      const { validateTeamNameOrThrow } = await import("../../../teams/storage.js");

      const tasks = [
        {
          id: "1",
          subject: "Pending task",
          description: "Test",
          status: "pending",
          owner: "",
          blockedBy: [],
          blocks: [],
          createdAt: 1000,
        },
        {
          id: "2",
          subject: "Completed task",
          description: "Test",
          status: "completed",
          owner: "agent-1",
          blockedBy: [],
          blocks: [],
          createdAt: 2000,
        },
      ];

      (validateTeamNameOrThrow as ReturnType<typeof vi.fn>).mockImplementation(() => {});
      (getTeamManager as ReturnType<typeof vi.fn>).mockReturnValue(mockManager);
      mockManager.listTasks.mockReturnValue(tasks);

      const tool = createTaskListTool();
      const result = await tool.execute("tool-call-1", {
        team_name: "test-team",
        includeCompleted: true,
      });

      const data = result.details as TaskListResultData;

      expect(data.tasks).toHaveLength(2);
      expect(
        data.tasks.some((t: unknown) => (t as Record<string, unknown>).status === "completed"),
      ).toBe(true);
    });

    it("should include deleted tasks when includeCompleted is true", async () => {
      const { getTeamManager } = await import("../../../teams/pool.js");
      const { validateTeamNameOrThrow } = await import("../../../teams/storage.js");

      const tasks = [
        {
          id: "1",
          subject: "Pending task",
          description: "Test",
          status: "pending",
          owner: "",
          blockedBy: [],
          blocks: [],
          createdAt: 1000,
        },
        {
          id: "2",
          subject: "Deleted task",
          description: "Test",
          status: "deleted",
          owner: "agent-1",
          blockedBy: [],
          blocks: [],
          createdAt: 2000,
        },
      ];

      (validateTeamNameOrThrow as ReturnType<typeof vi.fn>).mockImplementation(() => {});
      (getTeamManager as ReturnType<typeof vi.fn>).mockReturnValue(mockManager);
      mockManager.listTasks.mockReturnValue(tasks);

      const tool = createTaskListTool();
      const result = await tool.execute("tool-call-1", {
        team_name: "test-team",
        includeCompleted: true,
      });

      const data = result.details as TaskListResultData;

      expect(data.tasks).toHaveLength(2);
      expect(
        data.tasks.some((t: unknown) => (t as Record<string, unknown>).status === "deleted"),
      ).toBe(true);
    });
  });

  describe("Combined Filters", () => {
    it("should apply both status and owner filters", async () => {
      const { getTeamManager } = await import("../../../teams/pool.js");
      const { validateTeamNameOrThrow } = await import("../../../teams/storage.js");

      const tasks = [
        {
          id: "1",
          subject: "Task 1",
          description: "Test",
          status: "pending",
          owner: "agent-1",
          blockedBy: [],
          blocks: [],
          createdAt: 1000,
        },
        {
          id: "2",
          subject: "Task 2",
          description: "Test",
          status: "in_progress",
          owner: "agent-1",
          blockedBy: [],
          blocks: [],
          createdAt: 2000,
        },
        {
          id: "3",
          subject: "Task 3",
          description: "Test",
          status: "pending",
          owner: "agent-2",
          blockedBy: [],
          blocks: [],
          createdAt: 3000,
        },
      ];

      (validateTeamNameOrThrow as ReturnType<typeof vi.fn>).mockImplementation(() => {});
      (getTeamManager as ReturnType<typeof vi.fn>).mockReturnValue(mockManager);
      mockManager.listTasks.mockReturnValue(tasks);

      const tool = createTaskListTool();
      const result = await tool.execute("tool-call-1", {
        team_name: "test-team",
        status: "pending",
        owner: "agent-1",
      });

      const data = result.details as TaskListResultData;

      expect(data.tasks).toHaveLength(1);
      expect(data.tasks[0].id).toBe("1");
    });

    it("should apply all filters together", async () => {
      const { getTeamManager } = await import("../../../teams/pool.js");
      const { validateTeamNameOrThrow } = await import("../../../teams/storage.js");

      const tasks = [
        {
          id: "1",
          subject: "Task 1",
          description: "Test",
          status: "completed",
          owner: "agent-1",
          blockedBy: [],
          blocks: [],
          createdAt: 1000,
        },
        {
          id: "2",
          subject: "Task 2",
          description: "Test",
          status: "in_progress",
          owner: "agent-1",
          blockedBy: [],
          blocks: [],
          createdAt: 2000,
        },
        {
          id: "3",
          subject: "Task 3",
          description: "Test",
          status: "completed",
          owner: "agent-2",
          blockedBy: [],
          blocks: [],
          createdAt: 3000,
        },
      ];

      (validateTeamNameOrThrow as ReturnType<typeof vi.fn>).mockImplementation(() => {});
      (getTeamManager as ReturnType<typeof vi.fn>).mockReturnValue(mockManager);
      mockManager.listTasks.mockReturnValue(tasks);

      const tool = createTaskListTool();
      const result = await tool.execute("tool-call-1", {
        team_name: "test-team",
        status: "completed",
        owner: "agent-1",
        includeCompleted: true,
      });

      const data = result.details as TaskListResultData;

      expect(data.tasks).toHaveLength(1);
      expect(data.tasks[0].id).toBe("1");
      expect(data.tasks[0].status).toBe("completed");
      expect(data.tasks[0].owner).toBe("agent-1");
    });
  });

  describe("Validation", () => {
    it("should validate team name format", async () => {
      const { getTeamManager } = await import("../../../teams/pool.js");
      const { validateTeamNameOrThrow } = await import("../../../teams/storage.js");

      (validateTeamNameOrThrow as ReturnType<typeof vi.fn>).mockImplementation(() => {
        throw new Error(
          "Invalid team name: TestTeam. Must contain only lowercase letters, numbers, and hyphens",
        );
      });
      (getTeamManager as ReturnType<typeof vi.fn>).mockReturnValue(mockManager);
      mockManager.listTasks.mockReturnValue([]);

      const tool = createTaskListTool();

      await expect(
        tool.execute("tool-call-1", {
          team_name: "TestTeam",
        }),
      ).rejects.toThrow("Invalid team name");
    });

    it("should reject uppercase team name", async () => {
      const { getTeamManager } = await import("../../../teams/pool.js");
      const { validateTeamNameOrThrow } = await import("../../../teams/storage.js");

      (validateTeamNameOrThrow as ReturnType<typeof vi.fn>).mockImplementation(() => {
        throw new Error(
          "Invalid team name: MyTeam. Must contain only lowercase letters, numbers, and hyphens",
        );
      });
      (getTeamManager as ReturnType<typeof vi.fn>).mockReturnValue(mockManager);
      mockManager.listTasks.mockReturnValue([]);

      const tool = createTaskListTool();

      await expect(
        tool.execute("tool-call-1", {
          team_name: "MyTeam",
        }),
      ).rejects.toThrow("Invalid team name");
    });

    it("should reject team name with spaces", async () => {
      const { getTeamManager } = await import("../../../teams/pool.js");
      const { validateTeamNameOrThrow } = await import("../../../teams/storage.js");

      (validateTeamNameOrThrow as ReturnType<typeof vi.fn>).mockImplementation(() => {
        throw new Error(
          "Invalid team name: my team. Must contain only lowercase letters, numbers, and hyphens",
        );
      });
      (getTeamManager as ReturnType<typeof vi.fn>).mockReturnValue(mockManager);
      mockManager.listTasks.mockReturnValue([]);

      const tool = createTaskListTool();

      await expect(
        tool.execute("tool-call-1", {
          team_name: "my team",
        }),
      ).rejects.toThrow("Invalid team name");
    });

    it("should reject team name with underscores", async () => {
      const { getTeamManager } = await import("../../../teams/pool.js");
      const { validateTeamNameOrThrow } = await import("../../../teams/storage.js");

      (validateTeamNameOrThrow as ReturnType<typeof vi.fn>).mockImplementation(() => {
        throw new Error(
          "Invalid team name: my_team. Must contain only lowercase letters, numbers, and hyphens",
        );
      });
      (getTeamManager as ReturnType<typeof vi.fn>).mockReturnValue(mockManager);
      mockManager.listTasks.mockReturnValue([]);

      const tool = createTaskListTool();

      await expect(
        tool.execute("tool-call-1", {
          team_name: "my_team",
        }),
      ).rejects.toThrow("Invalid team name");
    });

    it("should accept valid team name with hyphens", async () => {
      const { getTeamManager } = await import("../../../teams/pool.js");
      const { validateTeamNameOrThrow } = await import("../../../teams/storage.js");

      (validateTeamNameOrThrow as ReturnType<typeof vi.fn>).mockImplementation(() => {});
      (getTeamManager as ReturnType<typeof vi.fn>).mockReturnValue(mockManager);
      mockManager.listTasks.mockReturnValue([]);

      const tool = createTaskListTool();
      const result = await tool.execute("tool-call-1", {
        team_name: "my-team-name",
      });

      expect(result).toBeDefined();
      expect(validateTeamNameOrThrow).toHaveBeenCalledWith("my-team-name");
    });
  });

  describe("Empty Team", () => {
    it("should handle empty team gracefully", async () => {
      const { getTeamManager } = await import("../../../teams/pool.js");
      const { validateTeamNameOrThrow } = await import("../../../teams/storage.js");

      (validateTeamNameOrThrow as ReturnType<typeof vi.fn>).mockImplementation(() => {});
      (getTeamManager as ReturnType<typeof vi.fn>).mockReturnValue(mockManager);
      mockManager.listTasks.mockReturnValue([]);

      const tool = createTaskListTool();
      const result = await tool.execute("tool-call-1", {
        team_name: "test-team",
      });

      const data = result.details as TaskListResultData;

      expect(data.tasks).toHaveLength(0);
      expect(data.count).toBe(0);
      expect(data.teamName).toBe("test-team");
    });

    it("should return empty array when no tasks match filters", async () => {
      const { getTeamManager } = await import("../../../teams/pool.js");
      const { validateTeamNameOrThrow } = await import("../../../teams/storage.js");

      const tasks = [
        {
          id: "1",
          subject: "Pending task",
          description: "Test",
          status: "pending",
          owner: "agent-1",
          blockedBy: [],
          blocks: [],
          createdAt: 1000,
        },
      ];

      (validateTeamNameOrThrow as ReturnType<typeof vi.fn>).mockImplementation(() => {});
      (getTeamManager as ReturnType<typeof vi.fn>).mockReturnValue(mockManager);
      mockManager.listTasks.mockReturnValue(tasks);

      const tool = createTaskListTool();
      const result = await tool.execute("tool-call-1", {
        team_name: "test-team",
        status: "completed",
      });

      const data = result.details as TaskListResultData;

      expect(data.tasks).toHaveLength(0);
      expect(data.count).toBe(0);
    });

    it("should return empty array when no tasks match owner", async () => {
      const { getTeamManager } = await import("../../../teams/pool.js");
      const { validateTeamNameOrThrow } = await import("../../../teams/storage.js");

      const tasks = [
        {
          id: "1",
          subject: "Task",
          description: "Test",
          status: "pending",
          owner: "agent-1",
          blockedBy: [],
          blocks: [],
          createdAt: 1000,
        },
      ];

      (validateTeamNameOrThrow as ReturnType<typeof vi.fn>).mockImplementation(() => {});
      (getTeamManager as ReturnType<typeof vi.fn>).mockReturnValue(mockManager);
      mockManager.listTasks.mockReturnValue(tasks);

      const tool = createTaskListTool();
      const result = await tool.execute("tool-call-1", {
        team_name: "test-team",
        owner: "agent-2",
      });

      const data = result.details as TaskListResultData;

      expect(data.tasks).toHaveLength(0);
      expect(data.count).toBe(0);
    });
  });

  describe("Response Format", () => {
    it("should return result with tasks array", async () => {
      const { getTeamManager } = await import("../../../teams/pool.js");
      const { validateTeamNameOrThrow } = await import("../../../teams/storage.js");

      const tasks = [
        {
          id: "1",
          subject: "Task",
          description: "Test",
          status: "pending",
          owner: "",
          blockedBy: [],
          blocks: [],
          createdAt: 1000,
        },
      ];

      (validateTeamNameOrThrow as ReturnType<typeof vi.fn>).mockImplementation(() => {});
      (getTeamManager as ReturnType<typeof vi.fn>).mockReturnValue(mockManager);
      mockManager.listTasks.mockReturnValue(tasks);

      const tool = createTaskListTool();
      const result = await tool.execute("tool-call-1", {
        team_name: "test-team",
      });

      const data = result.details as TaskListResultData;

      expect(data).toHaveProperty("tasks");
      expect(data).toHaveProperty("count");
      expect(data).toHaveProperty("teamName");
      expect(Array.isArray(data.tasks)).toBe(true);
      expect(typeof data.count).toBe("number");
      expect(typeof data.teamName).toBe("string");
    });

    it("should return correct count", async () => {
      const { getTeamManager } = await import("../../../teams/pool.js");
      const { validateTeamNameOrThrow } = await import("../../../teams/storage.js");

      const tasks = [
        {
          id: "1",
          subject: "Task 1",
          description: "Test",
          status: "pending",
          owner: "",
          blockedBy: [],
          blocks: [],
          createdAt: 1000,
        },
        {
          id: "2",
          subject: "Task 2",
          description: "Test",
          status: "pending",
          owner: "",
          blockedBy: [],
          blocks: [],
          createdAt: 2000,
        },
        {
          id: "3",
          subject: "Task 3",
          description: "Test",
          status: "pending",
          owner: "",
          blockedBy: [],
          blocks: [],
          createdAt: 3000,
        },
      ];

      (validateTeamNameOrThrow as ReturnType<typeof vi.fn>).mockImplementation(() => {});
      (getTeamManager as ReturnType<typeof vi.fn>).mockReturnValue(mockManager);
      mockManager.listTasks.mockReturnValue(tasks);

      const tool = createTaskListTool();
      const result = await tool.execute("tool-call-1", {
        team_name: "test-team",
      });

      const data = result.details as TaskListResultData;

      expect(data.count).toBe(3);
    });

    it("should return filtered count", async () => {
      const { getTeamManager } = await import("../../../teams/pool.js");
      const { validateTeamNameOrThrow } = await import("../../../teams/storage.js");

      const tasks = [
        {
          id: "1",
          subject: "Task 1",
          description: "Test",
          status: "pending",
          owner: "agent-1",
          blockedBy: [],
          blocks: [],
          createdAt: 1000,
        },
        {
          id: "2",
          subject: "Task 2",
          description: "Test",
          status: "in_progress",
          owner: "agent-2",
          blockedBy: [],
          blocks: [],
          createdAt: 2000,
        },
      ];

      (validateTeamNameOrThrow as ReturnType<typeof vi.fn>).mockImplementation(() => {});
      (getTeamManager as ReturnType<typeof vi.fn>).mockReturnValue(mockManager);
      mockManager.listTasks.mockReturnValue(tasks);

      const tool = createTaskListTool();
      const result = await tool.execute("tool-call-1", {
        team_name: "test-team",
        status: "pending",
      });

      const data = result.details as TaskListResultData;

      expect(data.count).toBe(1);
    });
  });

  describe("Team Manager Integration", () => {
    it("should get team manager from pool", async () => {
      const { getTeamManager } = await import("../../../teams/pool.js");
      const { validateTeamNameOrThrow } = await import("../../../teams/storage.js");

      (validateTeamNameOrThrow as ReturnType<typeof vi.fn>).mockImplementation(() => {});
      (getTeamManager as ReturnType<typeof vi.fn>).mockReturnValue(mockManager);
      mockManager.listTasks.mockReturnValue([]);

      const tool = createTaskListTool();
      await tool.execute("tool-call-1", {
        team_name: "test-team",
      });

      expect(getTeamManager).toHaveBeenCalledWith("test-team", "/tmp/openclaw-test");
    });

    it("should use OPENCLAW_STATE_DIR when set", async () => {
      const { getTeamManager } = await import("../../../teams/pool.js");
      const { validateTeamNameOrThrow } = await import("../../../teams/storage.js");

      process.env.OPENCLAW_STATE_DIR = "/custom/state/dir";

      (validateTeamNameOrThrow as ReturnType<typeof vi.fn>).mockImplementation(() => {});
      (getTeamManager as ReturnType<typeof vi.fn>).mockReturnValue(mockManager);
      mockManager.listTasks.mockReturnValue([]);

      const tool = createTaskListTool();
      await tool.execute("tool-call-1", {
        team_name: "test-team",
      });

      expect(getTeamManager).toHaveBeenCalledWith("test-team", "/custom/state/dir");
    });

    it("should call validateTeamNameOrThrow", async () => {
      const { getTeamManager } = await import("../../../teams/pool.js");
      const { validateTeamNameOrThrow } = await import("../../../teams/storage.js");

      (validateTeamNameOrThrow as ReturnType<typeof vi.fn>).mockImplementation(() => {});
      (getTeamManager as ReturnType<typeof vi.fn>).mockReturnValue(mockManager);
      mockManager.listTasks.mockReturnValue([]);

      const tool = createTaskListTool();
      await tool.execute("tool-call-1", {
        team_name: "test-team",
      });

      expect(validateTeamNameOrThrow).toHaveBeenCalledWith("test-team");
    });
  });
});
