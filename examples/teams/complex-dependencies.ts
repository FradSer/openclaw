/**
 * Complex Sequential Dependencies Example
 *
 * This example demonstrates:
 * 1. Sequential task dependencies (A -> B -> C pattern)
 * 2. Diamond dependency pattern (A -> B, A -> C, B and C -> D)
 * 3. Task blocking and unblocking behavior
 * 4. Dependency chain management
 */

import * as os from "node:os";
import * as path from "node:path";
import { getTeamManager } from "../../src/teams/pool.js";
import {
  createTeamDirectory,
  writeTeamConfig,
  deleteTeamDirectory,
} from "../../src/teams/storage.js";

/**
 * Get a temporary state directory for this example
 */
function getTempStateDir(): string {
  const tmpdir = os.tmpdir();
  return path.join(tmpdir, "openclaw-complex-example");
}

/**
 * Example 1: Sequential dependencies (A -> B -> C)
 *
 * Scenario: A build pipeline with sequential stages:
 * - Task A: Compile source code
 * - Task B: Run unit tests (depends on A)
 * - Task C: Build production bundle (depends on B)
 *
 * Each task must complete before the next can start.
 */
export async function sequentialDependenciesExample(): Promise<void> {
  const teamName = "sequential-deps-team";
  const stateDir = getTempStateDir();
  const leadSessionKey = "lead-agent-001";
  const builderAgent = "builder-agent-001";
  const testerAgent = "tester-agent-001";
  const deployerAgent = "deployer-agent-001";

  console.log("=== Sequential Dependencies Example (A -> B -> C) ===\n");

  try {
    // Setup team
    await createTeamDirectory(stateDir, teamName);
    const teamConfig = {
      team_name: teamName,
      id: crypto.randomUUID(),
      description: "Sequential dependencies example",
      agent_type: "general-purpose",
      lead: leadSessionKey,
      metadata: {
        createdAt: Date.now(),
        updatedAt: Date.now(),
        status: "active",
      },
    };
    await writeTeamConfig(stateDir, teamName, teamConfig);

    const manager = getTeamManager(teamName, stateDir);

    // Add members
    await manager.addMember({
      name: leadSessionKey,
      agentId: "general-purpose",
      agentType: "lead",
      status: "idle",
    });
    await manager.addMember({
      name: builderAgent,
      agentId: "builder",
      agentType: "member",
      status: "idle",
    });
    await manager.addMember({
      name: testerAgent,
      agentId: "tester",
      agentType: "member",
      status: "idle",
    });
    await manager.addMember({
      name: deployerAgent,
      agentId: "deployer",
      agentType: "member",
      status: "idle",
    });

    console.log("Step 1: Create tasks with sequential dependencies...");
    const taskA = manager.createTask(
      "Compile source code",
      "Transpile TypeScript and bundle source files",
      { activeForm: "Compiling source code" },
    );

    const taskB = manager.createTask("Run unit tests", "Execute test suite against compiled code", {
      activeForm: "Running unit tests",
    });

    const taskC = manager.createTask(
      "Build production bundle",
      "Create optimized production build artifact",
      { activeForm: "Building production bundle" },
    );

    // Create dependency chain: A -> B -> C
    console.log("Step 2: Establish dependency chain (A -> B -> C)...");
    manager.addTaskDependency(taskB.id, taskA.id);
    manager.addTaskDependency(taskC.id, taskB.id);

    // Verify initial state
    console.log("\nInitial task states:");
    const tasks = manager.listTasks();
    for (const task of tasks) {
      const blockedBy = task.blockedBy ?? [];
      console.log(`  Task ${task.id.substring(0, 8)}... (${task.subject}):`);
      console.log(`    Status: ${task.status}`);
      console.log(
        `    Blocked by: ${blockedBy.length > 0 ? blockedBy.map((id) => id.substring(0, 8)).join(", ") : "none"}`,
      );
    }
    console.log();

    // Attempt to claim blocked tasks
    console.log("Step 3: Attempt to claim blocked tasks...");
    const claimA = manager.claimTask(taskA.id, builderAgent);
    const claimB = manager.claimTask(taskB.id, testerAgent);
    const claimC = manager.claimTask(taskC.id, deployerAgent);

    console.log(
      `  Task A claim: ${claimA.success ? "SUCCESS" : "FAILED"} - ${claimA.reason ?? ""}`,
    );
    console.log(
      `  Task B claim: ${claimB.success ? "SUCCESS" : "FAILED"} - ${claimB.reason ?? "blocked by " + claimB.blockedBy?.map((id) => id.substring(0, 8)).join(", ")}`,
    );
    console.log(
      `  Task C claim: ${claimC.success ? "SUCCESS" : "FAILED"} - ${claimC.reason ?? "blocked by " + claimC.blockedBy?.map((id) => id.substring(0, 8)).join(", ")}`,
    );
    console.log();

    // Complete task A and observe unblocking
    console.log("Step 4: Complete Task A...");
    manager.completeTask(taskA.id);
    manager.updateMemberActivity(builderAgent, "idle");

    // Check if B is now unblocked
    const tasksAfterA = manager.listTasks();
    const taskBAfterA = tasksAfterA.find((t) => t.id === taskB.id);
    console.log(`  Task B blocked by: ${taskBAfterA?.blockedBy?.length ?? 0} tasks`);
    console.log();

    // Claim and complete B
    console.log("Step 5: Claim and complete Task B...");
    manager.claimTask(taskB.id, testerAgent);
    manager.completeTask(taskB.id);
    manager.updateMemberActivity(testerAgent, "idle");

    // Check if C is now unblocked
    const tasksAfterB = manager.listTasks();
    const taskCAfterB = tasksAfterB.find((t) => t.id === taskC.id);
    console.log(`  Task C blocked by: ${taskCAfterB?.blockedBy?.length ?? 0} tasks`);
    console.log();

    // Finally claim and complete C
    console.log("Step 6: Claim and complete Task C...");
    manager.claimTask(taskC.id, deployerAgent);
    manager.completeTask(taskC.id);
    manager.updateMemberActivity(deployerAgent, "idle");

    // Final state
    console.log("Step 7: Final state - all tasks completed");
    const finalTasks = manager.listTasks();
    const allCompleted = finalTasks.every((t) => t.status === "completed");
    console.log(`  All tasks completed: ${allCompleted ? "YES" : "NO"}\n`);
  } catch (error) {
    console.error("Error in sequential example:", error);
    throw error;
  } finally {
    await deleteTeamDirectory(stateDir, teamName);
  }
}

/**
 * Example 2: Diamond dependency pattern
 *
 * Scenario: Data processing with parallel branches that converge:
 * - Task A: Fetch raw data
 * - Task B: Validate data (depends on A)
 * - Task C: Transform data (depends on A)
 * - Task D: Generate report (depends on B and C)
 *
 * Pattern: A -> [B, C] -> D
 */
export async function diamondDependenciesExample(): Promise<void> {
  const teamName = "diamond-deps-team";
  const stateDir = getTempStateDir();
  const leadSessionKey = "lead-agent-001";
  const fetcherAgent = "fetcher-agent-001";
  const validatorAgent = "validator-agent-001";
  const transformerAgent = "transformer-agent-001";
  const reporterAgent = "reporter-agent-001";

  console.log("=== Diamond Dependency Pattern Example (A -> [B, C] -> D) ===\n");

  try {
    // Setup team
    await createTeamDirectory(stateDir, teamName);
    const teamConfig = {
      team_name: teamName,
      id: crypto.randomUUID(),
      description: "Diamond dependency pattern example",
      agent_type: "general-purpose",
      lead: leadSessionKey,
      metadata: {
        createdAt: Date.now(),
        updatedAt: Date.now(),
        status: "active",
      },
    };
    await writeTeamConfig(stateDir, teamName, teamConfig);

    const manager = getTeamManager(teamName, stateDir);

    // Add members
    await manager.addMember({
      name: leadSessionKey,
      agentId: "general-purpose",
      agentType: "lead",
      status: "idle",
    });
    await manager.addMember({
      name: fetcherAgent,
      agentId: "fetcher",
      agentType: "member",
      status: "idle",
    });
    await manager.addMember({
      name: validatorAgent,
      agentId: "validator",
      agentType: "member",
      status: "idle",
    });
    await manager.addMember({
      name: transformerAgent,
      agentId: "transformer",
      agentType: "member",
      status: "idle",
    });
    await manager.addMember({
      name: reporterAgent,
      agentId: "reporter",
      agentType: "member",
      status: "idle",
    });

    console.log("Step 1: Create diamond pattern tasks...");
    const taskA = manager.createTask("Fetch raw data", "Retrieve raw data from external source", {
      activeForm: "Fetching raw data",
    });

    const taskB = manager.createTask("Validate data", "Validate data quality and schema", {
      activeForm: "Validating data",
    });

    const taskC = manager.createTask("Transform data", "Transform data into required format", {
      activeForm: "Transforming data",
    });

    const taskD = manager.createTask(
      "Generate report",
      "Create final report from validated and transformed data",
      { activeForm: "Generating report" },
    );

    // Create diamond: A -> [B, C] -> D
    console.log("Step 2: Establish diamond dependencies (A -> B, A -> C, B/C -> D)...");
    manager.addTaskDependency(taskB.id, taskA.id);
    manager.addTaskDependency(taskC.id, taskA.id);
    manager.addTaskDependency(taskD.id, taskB.id);
    manager.addTaskDependency(taskD.id, taskC.id);

    // Visualize dependency graph
    console.log("\nDependency graph:");
    console.log("     +-------+");
    console.log("     |   A   |");
    console.log("     +-------+");
    console.log("        /  \\");
    console.log("       v    v");
    console.log("    +---+  +---+");
    console.log("    | B |  | C |");
    console.log("    +---+  +---+");
    console.log("       \\    /");
    console.log("        v  v");
    console.log("      +-------+");
    console.log("      |   D   |");
    console.log("      +-------+\n");

    // Show initial blocking state
    console.log("Initial blocking state:");
    const initialTasks = manager.listTasks();
    for (const task of initialTasks) {
      const blockedBy = task.blockedBy ?? [];
      console.log(`  ${task.subject}: blocked by ${blockedBy.length} task(s)`);
    }
    console.log();

    // Process A
    console.log("Step 3: Complete Task A (unblocks B and C)...");
    manager.claimTask(taskA.id, fetcherAgent);
    manager.completeTask(taskA.id);
    manager.updateMemberActivity(fetcherAgent, "idle");

    const afterA = manager.listTasks();
    const taskBAfterA = afterA.find((t) => t.id === taskB.id);
    const taskCAfterA = afterA.find((t) => t.id === taskC.id);
    const taskDAfterA = afterA.find((t) => t.id === taskD.id);

    console.log(`  B blocked by: ${taskBAfterA?.blockedBy?.length ?? 0}`);
    console.log(`  C blocked by: ${taskCAfterA?.blockedBy?.length ?? 0}`);
    console.log(
      `  D blocked by: ${taskDAfterA?.blockedBy?.length ?? 0} (still needs both B and C)`,
    );
    console.log();

    // Process B and C in parallel
    console.log("Step 4: Process B and C in parallel...");
    manager.claimTask(taskB.id, validatorAgent);
    manager.claimTask(taskC.id, transformerAgent);
    manager.completeTask(taskB.id);
    manager.completeTask(taskC.id);
    manager.updateMemberActivity(validatorAgent, "idle");
    manager.updateMemberActivity(transformerAgent, "idle");

    const afterBC = manager.listTasks();
    const taskDAfterBC = afterBC.find((t) => t.id === taskD.id);
    console.log(`  D blocked by: ${taskDAfterBC?.blockedBy?.length ?? 0} (now unblocked!)`);
    console.log();

    // Complete D
    console.log("Step 5: Complete Task D...");
    manager.claimTask(taskD.id, reporterAgent);
    manager.completeTask(taskD.id);
    manager.updateMemberActivity(reporterAgent, "idle");

    console.log("Final state - all tasks completed\n");
  } catch (error) {
    console.error("Error in diamond example:", error);
    throw error;
  } finally {
    await deleteTeamDirectory(stateDir, teamName);
  }
}

/**
 * Example 3: Detect circular dependencies
 *
 * Demonstrates cycle detection in the task graph.
 */
export async function circularDependencyDetectionExample(): Promise<void> {
  const teamName = "circular-detect-team";
  const stateDir = getTempStateDir();
  const leadSessionKey = "lead-agent-001";

  console.log("=== Circular Dependency Detection Example ===\n");

  try {
    // Setup team
    await createTeamDirectory(stateDir, teamName);
    const teamConfig = {
      team_name: teamName,
      id: crypto.randomUUID(),
      description: "Circular dependency detection example",
      agent_type: "general-purpose",
      lead: leadSessionKey,
      metadata: {
        createdAt: Date.now(),
        updatedAt: Date.now(),
        status: "active",
      },
    };
    await writeTeamConfig(stateDir, teamName, teamConfig);

    const manager = getTeamManager(teamName, stateDir);

    await manager.addMember({
      name: leadSessionKey,
      agentId: "general-purpose",
      agentType: "lead",
      status: "idle",
    });

    console.log("Step 1: Create tasks...");
    const taskA = manager.createTask("Task A", "First task");
    const taskB = manager.createTask("Task B", "Second task");
    const taskC = manager.createTask("Task C", "Third task");

    console.log("Step 2: Create circular dependency (A -> B -> C -> A)...");
    manager.addTaskDependency(taskB.id, taskA.id);
    manager.addTaskDependency(taskC.id, taskB.id);
    manager.addTaskDependency(taskA.id, taskC.id);

    console.log("\nDependency graph (circular):");
    console.log("    +-------+");
    console.log("    |   A   |");
    console.log("    +-------+");
    console.log("       /|\\");
    console.log("      v | v");
    console.log("    +---+ +---+");
    console.log("    | B | | C |");
    console.log("    +---+ +---+");
    console.log("       \\|/");
    console.log("        v");
    console.log("       (A)\n");

    // Detect cycles
    console.log("Step 3: Detect circular dependencies...");
    const cycles = manager.detectCircularDependencies();

    if (cycles.length > 0) {
      console.log(`  Detected ${cycles.length} circular dependency cycle(s):`);
      for (let i = 0; i < cycles.length; i++) {
        const cycle = cycles[i];
        const cycleStr = cycle.map((id) => id.substring(0, 8)).join(" -> ");
        console.log(`    Cycle ${i + 1}: ${cycleStr} -> ${cycle[0].substring(0, 8)}`);
      }
    } else {
      console.log("  No circular dependencies detected");
    }
    console.log();
  } catch (error) {
    console.error("Error in cycle detection example:", error);
    throw error;
  } finally {
    await deleteTeamDirectory(stateDir, teamName);
  }
}

/**
 * Main entry point - run all examples
 */
export async function main(): Promise<void> {
  await sequentialDependenciesExample();
  console.log("\n");
  await diamondDependenciesExample();
  console.log("\n");
  await circularDependencyDetectionExample();
  console.log("\n=== All examples completed successfully ===");
}

// Run the example if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error("Example failed:", error);
    process.exit(1);
  });
}
