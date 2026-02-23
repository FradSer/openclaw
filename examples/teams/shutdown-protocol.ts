/**
 * Team Shutdown Protocol and Error Handling Example
 *
 * This example demonstrates:
 * 1. Team shutdown with member approval protocol
 * 2. Error handling and recovery (member failure, replacement)
 * 3. Graceful shutdown when members reject
 * 4. Cleanup after member failure
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
  return path.join(tmpdir, "openclaw-shutdown-example");
}

/**
 * Example 1: Simple shutdown with approval
 *
 * Scenario: Team lead initiates shutdown, active members approve,
 * team transitions to shutdown state.
 */
export async function shutdownWithApprovalExample(): Promise<void> {
  const teamName = "shutdown-approval-team";
  const stateDir = getTempStateDir();
  const leadSessionKey = "lead-agent-001";
  const member1Key = "worker-agent-001";
  const member2Key = "worker-agent-002";

  console.log("=== Shutdown with Approval Protocol Example ===\n");

  try {
    // Setup team
    await createTeamDirectory(stateDir, teamName);
    const teamConfig = {
      team_name: teamName,
      id: crypto.randomUUID(),
      description: "Shutdown approval example",
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

    // Add members with working status
    await manager.addMember({
      name: leadSessionKey,
      agentId: "general-purpose",
      agentType: "lead",
      status: "idle",
    });
    await manager.addMember({
      name: member1Key,
      agentId: "worker",
      agentType: "member",
      status: "working",
    });
    await manager.addMember({
      name: member2Key,
      agentId: "worker",
      agentType: "member",
      status: "working",
    });

    // Create active tasks
    const task1 = manager.createTask("Process data batch", "Process the current batch of data", {
      activeForm: "Processing data batch",
    });
    manager.claimTask(task1.id, member1Key);

    const task2 = manager.createTask("Generate metrics", "Generate performance metrics", {
      activeForm: "Generating metrics",
    });
    manager.claimTask(task2.id, member2Key);

    console.log("Step 1: Initial state - team active with working members");
    const members = manager.listMembers();
    const activeMembers = members.filter((m) => m.status === "working");
    console.log(`  Active members: ${activeMembers.length}`);
    for (const member of activeMembers) {
      console.log(
        `    - ${member.name}: ${member.status}, task: ${member.currentTask?.substring(0, 8) ?? "none"}`,
      );
    }
    console.log();

    // Simulate shutdown request
    console.log("Step 2: Team lead initiates shutdown request...");
    const requestId = crypto.randomUUID();

    // Send shutdown_request to active members
    for (const member of activeMembers) {
      manager.storeMessage({
        id: crypto.randomUUID(),
        type: "shutdown_request",
        from: leadSessionKey,
        to: member.name,
        sender: leadSessionKey,
        recipient: member.name,
        content: "Team is shutting down, please complete current work and approve",
        requestId,
        timestamp: Date.now(),
      });
    }

    console.log(`  Request ID: ${requestId}`);
    console.log(`  Sent to: ${activeMembers.map((m) => m.name).join(", ")}`);
    console.log();

    // Simulate member approval
    console.log("Step 3: Members complete work and send approval...");
    manager.completeTask(task1.id);
    manager.completeTask(task2.id);
    manager.updateMemberActivity(member1Key, "idle");
    manager.updateMemberActivity(member2Key, "idle");

    // Members send shutdown_response with approve=true
    for (const member of activeMembers) {
      manager.storeMessage({
        id: crypto.randomUUID(),
        type: "shutdown_response",
        from: member.name,
        to: leadSessionKey,
        sender: member.name,
        recipient: leadSessionKey,
        content: "Work completed, approving shutdown",
        requestId,
        approve: true,
        timestamp: Date.now(),
      });
    }

    console.log(`  ${member1Key}: approved`);
    console.log(`  ${member2Key}: approved`);
    console.log();

    // Verify all approvals received
    console.log("Step 4: Verify all approvals received...");
    const leadMessages = manager.retrieveMessages(leadSessionKey);
    const approvalResponses = leadMessages.filter(
      (m) => m.type === "shutdown_response" && m.requestId === requestId && m.approve,
    );
    console.log(`  Approvals received: ${approvalResponses.length}/${activeMembers.length}`);
    console.log();

    // Proceed with shutdown
    console.log("Step 5: All members approved - shutting down team...");
    const updatedConfig = {
      ...teamConfig,
      metadata: { ...teamConfig.metadata, status: "shutdown" },
    };
    await writeTeamConfig(stateDir, teamName, updatedConfig);
    console.log("  Team status changed to: shutdown\n");
  } catch (error) {
    console.error("Error in shutdown approval example:", error);
    throw error;
  } finally {
    await deleteTeamDirectory(stateDir, teamName);
  }

  console.log("Example completed successfully\n");
}

/**
 * Example 2: Shutdown with member rejection
 *
 * Scenario: Team lead requests shutdown, but a member rejects
 * because they have critical work remaining.
 */
export async function shutdownWithRejectionExample(): Promise<void> {
  const teamName = "shutdown-rejection-team";
  const stateDir = getTempStateDir();
  const leadSessionKey = "lead-agent-001";
  const member1Key = "worker-agent-001";
  const member2Key = "worker-agent-002";

  console.log("=== Shutdown with Member Rejection Example ===\n");

  try {
    // Setup team
    await createTeamDirectory(stateDir, teamName);
    const teamConfig = {
      team_name: teamName,
      id: crypto.randomUUID(),
      description: "Shutdown rejection example",
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

    // Add members with working status
    await manager.addMember({
      name: leadSessionKey,
      agentId: "general-purpose",
      agentType: "lead",
      status: "idle",
    });
    await manager.addMember({
      name: member1Key,
      agentId: "worker",
      agentType: "member",
      status: "working",
    });
    await manager.addMember({
      name: member2Key,
      agentId: "worker",
      agentType: "member",
      status: "working",
    });

    // Create tasks
    const task1 = manager.createTask("Process data batch", "Process the current batch of data");
    manager.claimTask(task1.id, member1Key);

    const task2 = manager.createTask("Critical deployment", "Deploy to production - CRITICAL");
    manager.claimTask(task2.id, member2Key);

    console.log("Step 1: Team has active members with tasks");
    console.log(`  ${member1Key}: working on data processing`);
    console.log(`  ${member2Key}: working on CRITICAL deployment\n`);

    // Simulate shutdown request
    console.log("Step 2: Team lead initiates shutdown request...");
    const requestId = crypto.randomUUID();

    const members = manager.listMembers();
    const activeMembers = members.filter((m) => m.status === "working");

    for (const member of activeMembers) {
      manager.storeMessage({
        id: crypto.randomUUID(),
        type: "shutdown_request",
        from: leadSessionKey,
        to: member.name,
        sender: leadSessionKey,
        recipient: member.name,
        content: "Team is shutting down",
        requestId,
        timestamp: Date.now(),
      });
    }

    console.log(`  Request ID: ${requestId}\n`);

    // Simulate mixed responses
    console.log("Step 3: Members respond with mixed approvals...");
    manager.completeTask(task1.id);
    manager.updateMemberActivity(member1Key, "idle");

    // member1 approves
    manager.storeMessage({
      id: crypto.randomUUID(),
      type: "shutdown_response",
      from: member1Key,
      to: leadSessionKey,
      sender: member1Key,
      recipient: leadSessionKey,
      content: "Work completed",
      requestId,
      approve: true,
      timestamp: Date.now(),
    });

    // member2 rejects (critical work)
    manager.storeMessage({
      id: crypto.randomUUID(),
      type: "shutdown_response",
      from: member2Key,
      to: leadSessionKey,
      sender: member2Key,
      recipient: leadSessionKey,
      content: "Cannot shutdown - critical deployment in progress",
      requestId,
      approve: false,
      reason: "Critical deployment task must complete first",
      timestamp: Date.now(),
    });

    console.log(`  ${member1Key}: APPROVED`);
    console.log(`  ${member2Key}: REJECTED - Critical deployment task must complete first\n`);

    // Process responses
    console.log("Step 4: Team lead processes responses...");
    const leadMessages = manager.retrieveMessages(leadSessionKey);
    const responses = leadMessages.filter(
      (m) => m.type === "shutdown_response" && m.requestId === requestId,
    );

    for (const response of responses) {
      if (response.approve) {
        console.log(`  ${response.sender}: approved`);
      } else {
        console.log(`  ${response.sender}: REJECTED - ${response.reason ?? "no reason provided"}`);
      }
    }
    console.log();

    const hasRejection = responses.some((r) => r.approve === false);
    if (hasRejection) {
      console.log("Step 5: Shutdown rejected due to member objection");
      console.log("  Team remains active");
      console.log("  Lead will retry shutdown after critical work completes\n");
    }
  } catch (error) {
    console.error("Error in shutdown rejection example:", error);
    throw error;
  } finally {
    await deleteTeamDirectory(stateDir, teamName);
  }

  console.log("Example completed successfully\n");
}

/**
 * Example 3: Member failure and replacement
 *
 * Scenario: A team member fails while working on a task.
 * The team lead detects the failure and:
 * 1. Reclaims the failed task
 * 2. Removes the failed member
 * 3. Spawns a replacement member
 * 4. Reassigns the task
 */
export async function memberFailureRecoveryExample(): Promise<void> {
  const teamName = "failure-recovery-team";
  const stateDir = getTempStateDir();
  const leadSessionKey = "lead-agent-001";
  const failedMemberKey = "worker-failed-001";
  const replacementMemberKey = "worker-replacement-001";

  console.log("=== Member Failure and Recovery Example ===\n");

  try {
    // Setup team
    await createTeamDirectory(stateDir, teamName);
    const teamConfig = {
      team_name: teamName,
      id: crypto.randomUUID(),
      description: "Member failure recovery example",
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
      name: failedMemberKey,
      agentId: "worker",
      agentType: "member",
      status: "working",
    });

    // Create and claim a task
    const task = manager.createTask(
      "Process large dataset",
      "Process and analyze large dataset (will fail mid-way)",
      { activeForm: "Processing large dataset" },
    );
    manager.claimTask(task.id, failedMemberKey);
    manager.updateMemberActivity(failedMemberKey, "working", task.id);

    console.log("Step 1: Initial state - member working on task");
    console.log(`  Member: ${failedMemberKey}`);
    console.log(`  Task: ${task.id.substring(0, 8)}... - ${task.subject}`);
    console.log(`  Status: ${task.status}\n`);

    // Simulate member failure
    console.log("Step 2: Simulate member failure...");
    console.log(`  ${failedMemberKey} encountered an error and disconnected\n`);

    // Team lead detects failure
    console.log("Step 3: Team lead detects failure and investigates...");
    const members = manager.listMembers();
    const failedMember = members.find((m) => m.name === failedMemberKey);

    // Check task status - still claimed but member is unresponsive
    const tasks = manager.listTasks();
    const stuckTask = tasks.find((t) => t.id === task.id);

    console.log(`  Task status: ${stuckTask?.status}`);
    console.log(`  Task owner: ${stuckTask?.owner}`);
    console.log(`  Member last activity: ${failedMember?.lastActiveAt ?? "unknown"}\n`);

    // Recovery process
    console.log("Step 4: Recovery process...");

    // Step 4a: Remove failed member
    console.log("  4a. Removing failed member from team...");
    manager.removeMember(failedMemberKey);
    const membersAfterRemoval = manager.listMembers();
    console.log(
      `      Failed member removed: ${!membersAfterRemoval.some((m) => m.name === failedMemberKey)}`,
    );

    // Step 4b: Reclaim the task (reset to pending)
    console.log("  4b. Reclaiming stuck task...");
    manager.updateTaskStatus(task.id, "pending");
    const reclaimedTask = manager.listTasks().find((t) => t.id === task.id);
    console.log(`      Task status: ${reclaimedTask?.status}`);

    // Step 4c: Spawn replacement member
    console.log("  4c. Spawning replacement member...");
    await manager.addMember({
      name: replacementMemberKey,
      agentId: "worker",
      agentType: "member",
      status: "idle",
    });
    const membersAfterSpawn = manager.listMembers();
    console.log(
      `      New member added: ${membersAfterSpawn.some((m) => m.name === replacementMemberKey)}`,
    );

    // Step 4d: Reassign task to replacement
    console.log("  4d. Reassigning task to replacement member...");
    const reassignResult = manager.claimTask(task.id, replacementMemberKey);
    console.log(`      Task claimed: ${reassignResult.success}`);

    // Update member activity
    if (reassignResult.success) {
      manager.updateMemberActivity(replacementMemberKey, "working", task.id);
    }
    console.log();

    // Verify recovery
    console.log("Step 5: Verify recovery state...");
    const finalTasks = manager.listTasks();
    const finalMembers = manager.listMembers();

    const recoveredTask = finalTasks.find((t) => t.id === task.id);
    const replacementMember = finalMembers.find((m) => m.name === replacementMemberKey);

    console.log(`  Task: ${recoveredTask?.subject}`);
    console.log(`    Status: ${recoveredTask?.status}`);
    console.log(`    Owner: ${recoveredTask?.owner?.substring(0, 20)}...`);

    console.log(`  Replacement member: ${replacementMember?.name}`);
    console.log(`    Status: ${replacementMember?.status}`);
    console.log(`    Current task: ${replacementMember?.currentTask?.substring(0, 8) ?? "none"}\n`);

    // Complete the task
    console.log("Step 6: Replacement member completes task...");
    manager.completeTask(task.id);
    manager.updateMemberActivity(replacementMemberKey, "idle");

    const finalTask = manager.listTasks().find((t) => t.id === task.id);
    console.log(`  Task completed: ${finalTask?.status === "completed" ? "YES" : "NO"}\n`);
  } catch (error) {
    console.error("Error in failure recovery example:", error);
    throw error;
  } finally {
    await deleteTeamDirectory(stateDir, teamName);
  }

  console.log("Example completed successfully\n");
}

/**
 * Example 4: Team with no active members (immediate shutdown)
 *
 * Scenario: Team has no working members, so shutdown happens immediately.
 */
export async function immediateShutdownExample(): Promise<void> {
  const teamName = "immediate-shutdown-team";
  const stateDir = getTempStateDir();
  const leadSessionKey = "lead-agent-001";
  const idleMemberKey = "idle-worker-001";

  console.log("=== Immediate Shutdown Example (No Active Members) ===\n");

  try {
    // Setup team
    await createTeamDirectory(stateDir, teamName);
    const teamConfig = {
      team_name: teamName,
      id: crypto.randomUUID(),
      description: "Immediate shutdown example",
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

    // Add idle members only
    await manager.addMember({
      name: leadSessionKey,
      agentId: "general-purpose",
      agentType: "lead",
      status: "idle",
    });
    await manager.addMember({
      name: idleMemberKey,
      agentId: "worker",
      agentType: "member",
      status: "idle",
    });

    console.log("Step 1: Team has only idle members");
    const members = manager.listMembers();
    console.log(`  Total members: ${members.length}`);
    console.log(`  Idle members: ${members.filter((m) => m.status === "idle").length}`);
    console.log(`  Working members: ${members.filter((m) => m.status === "working").length}\n`);

    // Initiate shutdown
    console.log("Step 2: Team lead initiates shutdown...");

    const activeMembers = members.filter((m) => m.status === "working");

    if (activeMembers.length === 0) {
      console.log("  No active members found");
      console.log("  Proceeding with immediate shutdown\n");

      // Update team status to shutdown
      const updatedConfig = {
        ...teamConfig,
        metadata: { ...teamConfig.metadata, status: "shutdown" },
      };
      await writeTeamConfig(stateDir, teamName, updatedConfig);

      console.log("Step 3: Team shut down immediately");
      console.log(`  Status: ${updatedConfig.metadata.status}\n`);
    }
  } catch (error) {
    console.error("Error in immediate shutdown example:", error);
    throw error;
  } finally {
    await deleteTeamDirectory(stateDir, teamName);
  }

  console.log("Example completed successfully\n");
}

/**
 * Main entry point - run all examples
 */
export async function main(): Promise<void> {
  await shutdownWithApprovalExample();
  await shutdownWithRejectionExample();
  await memberFailureRecoveryExample();
  await immediateShutdownExample();
  console.log("=== All examples completed successfully ===");
}

// Run the example if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error("Example failed:", error);
    process.exit(1);
  });
}
