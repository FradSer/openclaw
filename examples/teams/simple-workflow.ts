/**
 * Simple Parallel Task Distribution Example
 *
 * This example demonstrates the basic workflow of:
 * 1. Creating a team
 * 2. Spawning team members
 * 3. Adding independent tasks that can run in parallel
 * 4. Team members claiming and completing tasks
 * 5. Shutting down the team
 */

import * as os from "node:os";
import * as path from "node:path";
import { getTeamManager, closeAll } from "../../src/teams/pool.js";
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
  return path.join(tmpdir, "openclaw-simple-example");
}

/**
 * Example: Simple parallel task distribution
 *
 * Scenario: A team needs to process three independent tasks:
 * - Task A: Fetch API data
 * - Task B: Generate documentation
 * - Task C: Run tests
 *
 * Since these tasks are independent, they can run in parallel.
 */
export async function simpleWorkflowExample(): Promise<void> {
  const teamName = "simple-parallel-team";
  const stateDir = getTempStateDir();
  const leadSessionKey = "lead-agent-001";
  const member1Key = "researcher-agent-001";
  const member2Key = "writer-agent-001";
  const member3Key = "tester-agent-001";

  console.log("=== Simple Parallel Task Distribution Example ===\n");

  try {
    // Step 1: Create the team directory structure
    console.log("Step 1: Creating team directory structure...");
    await createTeamDirectory(stateDir, teamName);

    const teamConfig = {
      team_name: teamName,
      id: crypto.randomUUID(),
      description: "Simple parallel task distribution example",
      agent_type: "general-purpose",
      lead: leadSessionKey,
      metadata: {
        createdAt: Date.now(),
        updatedAt: Date.now(),
        status: "active",
      },
    };
    await writeTeamConfig(stateDir, teamName, teamConfig);
    console.log(`  Team '${teamName}' created with ID ${teamConfig.id}\n`);

    // Get the team manager
    const manager = getTeamManager(teamName, stateDir);

    // Step 2: Add team members
    console.log("Step 2: Adding team members...");
    await manager.addMember({
      name: leadSessionKey,
      agentId: "general-purpose",
      agentType: "lead",
      status: "idle",
    });
    await manager.addMember({
      name: member1Key,
      agentId: "researcher",
      agentType: "member",
      status: "idle",
    });
    await manager.addMember({
      name: member2Key,
      agentId: "writer",
      agentType: "member",
      status: "idle",
    });
    await manager.addMember({
      name: member3Key,
      agentId: "tester",
      agentType: "member",
      status: "idle",
    });
    console.log(`  Added 4 team members (1 lead, 3 workers)\n`);

    // List members to verify
    const members = manager.listMembers();
    console.log("Current team members:");
    for (const member of members) {
      console.log(`  - ${member.name} (${member.agentType}, ${member.agentId})`);
    }
    console.log();

    // Step 3: Create independent tasks (no dependencies)
    console.log("Step 3: Creating independent tasks...");
    const taskA = manager.createTask(
      "Fetch API data",
      "Retrieve and parse data from external API endpoint",
      { activeForm: "Fetching API data" },
    );

    const taskB = manager.createTask(
      "Generate documentation",
      "Write comprehensive documentation for the new feature",
      { activeForm: "Generating documentation" },
    );

    const taskC = manager.createTask(
      "Run tests",
      "Execute test suite and generate coverage report",
      { activeForm: "Running tests" },
    );

    console.log(`  Created tasks:`);
    console.log(`    A: ${taskA.id} - ${taskA.subject}`);
    console.log(`    B: ${taskB.id} - ${taskB.subject}`);
    console.log(`    C: ${taskC.id} - ${taskC.subject}`);
    console.log();

    // Verify all tasks are unblocked
    console.log("Verifying tasks are unblocked:");
    const allTasks = manager.listTasks();
    for (const task of allTasks) {
      console.log(
        `  Task ${task.id.substring(0, 8)}...: blocked by ${task.blockedBy?.length ?? 0} tasks`,
      );
    }
    console.log();

    // Step 4: Team members claim tasks (parallel distribution)
    console.log("Step 4: Team members claiming tasks...");
    const claimResult1 = manager.claimTask(taskA.id, member1Key);
    const claimResult2 = manager.claimTask(taskB.id, member2Key);
    const claimResult3 = manager.claimTask(taskC.id, member3Key);

    console.log(`  ${member1Key} claimed task A: ${claimResult1.success ? "SUCCESS" : "FAILED"}`);
    console.log(`  ${member2Key} claimed task B: ${claimResult2.success ? "SUCCESS" : "FAILED"}`);
    console.log(`  ${member3Key} claimed task C: ${claimResult3.success ? "SUCCESS" : "FAILED"}`);
    console.log();

    // Update member status to show they're working
    manager.updateMemberActivity(member1Key, "working", taskA.id);
    manager.updateMemberActivity(member2Key, "working", taskB.id);
    manager.updateMemberActivity(member3Key, "working", taskC.id);

    // Step 5: Complete tasks (simulating parallel work)
    console.log("Step 5: Completing tasks...");
    const completeResult1 = manager.completeTask(taskA.id);
    const completeResult2 = manager.completeTask(taskB.id);
    const completeResult3 = manager.completeTask(taskC.id);

    console.log(`  Task A completed: ${completeResult1 ? "YES" : "NO"}`);
    console.log(`  Task B completed: ${completeResult2 ? "YES" : "NO"}`);
    console.log(`  Task C completed: ${completeResult3 ? "YES" : "NO"}`);
    console.log();

    // Update member status back to idle
    manager.updateMemberActivity(member1Key, "idle");
    manager.updateMemberActivity(member2Key, "idle");
    manager.updateMemberActivity(member3Key, "idle");

    // Step 6: Review final state
    console.log("Step 6: Final task status:");
    const finalTasks = manager.listTasks();
    const completedTasks = finalTasks.filter((t) => t.status === "completed");
    console.log(`  Total tasks: ${finalTasks.length}`);
    console.log(`  Completed: ${completedTasks.length}`);
    console.log(`  Pending: ${finalTasks.filter((t) => t.status === "pending").length}`);
    console.log();

    console.log("Final member status:");
    const finalMembers = manager.listMembers();
    for (const member of finalMembers) {
      console.log(`  - ${member.name}: ${member.status}`);
    }
    console.log();
  } catch (error) {
    console.error("Error during workflow:", error);
    throw error;
  } finally {
    // Cleanup: Delete team directory and close connections
    console.log("Step 7: Cleaning up...");
    await deleteTeamDirectory(stateDir, teamName);
    closeAll();
    console.log("  Team directory deleted and connections closed\n");
  }

  console.log("=== Example completed successfully ===");
}

/**
 * Main entry point - run the example
 */
export async function main(): Promise<void> {
  await simpleWorkflowExample();
}

// Run the example if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error("Example failed:", error);
    process.exit(1);
  });
}
