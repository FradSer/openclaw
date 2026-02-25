/**
 * SendMessage Tool
 * Sends messages between team members via inbox directories
 * Enforces agentToAgent policy for cross-agent communication
 */

import { randomUUID } from "node:crypto";
import { Type } from "@sinclair/typebox";
import { loadConfig } from "../../../config/config.js";
import { resolveAgentIdFromSessionKey } from "../../../routing/session-key.js";
import { writeInboxMessage, listMembers } from "../../../teams/inbox.js";
import { validateTeamNameOrThrow } from "../../../teams/storage.js";
import type { TeamMessage } from "../../../teams/types.js";
import type { AnyAgentTool } from "../common.js";
import { jsonResult, readStringParam } from "../common.js";
import { createAgentToAgentPolicy, type AgentToAgentPolicy } from "../sessions-access.js";

const SendMessageSchema = Type.Object({
  team_name: Type.String({ minLength: 1, maxLength: 50 }),
  type: Type.Union([
    Type.Literal("message"),
    Type.Literal("broadcast"),
    Type.Literal("shutdown_request"),
    Type.Literal("shutdown_response"),
  ]),
  recipient: Type.Optional(Type.String()),
  content: Type.String({ minLength: 1, maxLength: 100000 }),
  summary: Type.Optional(Type.String({ maxLength: 50 })),
  request_id: Type.Optional(Type.String()),
  approve: Type.Optional(Type.Boolean()),
  reason: Type.Optional(Type.String()),
});

function summarizeMessage(content: string, maxWords = 10): string {
  const words = content.trim().split(/\s+/);
  if (words.length <= maxWords) {
    return content;
  }
  return words.slice(0, maxWords).join(" ") + "...";
}

/**
 * Check if agentToAgent policy allows communication between sender and recipient
 * Returns { allowed: true } if communication is permitted, or error message if not
 */
function checkAgentToAgentPolicy(params: {
  a2aPolicy: AgentToAgentPolicy;
  senderSessionKey: string | undefined;
  recipientSessionKey: string;
}): { allowed: boolean; error?: string } {
  const { a2aPolicy, senderSessionKey, recipientSessionKey } = params;

  // Resolve agent IDs from session keys
  const senderAgentId = senderSessionKey
    ? resolveAgentIdFromSessionKey(senderSessionKey)
    : "unknown";
  const recipientAgentId = resolveAgentIdFromSessionKey(recipientSessionKey);

  // Same agent communication is always allowed (lead <-> teammate within same agent)
  if (senderAgentId === recipientAgentId) {
    return { allowed: true };
  }

  // Cross-agent communication requires agentToAgent to be enabled
  if (!a2aPolicy.enabled) {
    return {
      allowed: false,
      error:
        "Agent-to-agent messaging is disabled. Set tools.agentToAgent.enabled=true to allow cross-agent sends.",
    };
  }

  // Check if policy allows this communication
  if (!a2aPolicy.isAllowed(senderAgentId, recipientAgentId)) {
    return {
      allowed: false,
      error: "Agent-to-agent messaging denied by tools.agentToAgent.allow.",
    };
  }

  return { allowed: true };
}

export function createSendMessageTool(opts?: { agentSessionKey?: string }): AnyAgentTool {
  return {
    label: "Send Message",
    name: "send_message",
    description:
      "Sends a message to teammates. Use for direct messaging, broadcasting, or shutdown protocol.",
    parameters: SendMessageSchema,
    execute: async (_toolCallId, args) => {
      const params = args as Record<string, unknown>;

      // Extract and validate parameters
      const teamName = readStringParam(params, "team_name", { required: true });
      const type = params.type as
        | "message"
        | "broadcast"
        | "shutdown_request"
        | "shutdown_response";
      const recipient = readStringParam(params, "recipient");
      const content = readStringParam(params, "content", { required: true });
      const summary = readStringParam(params, "summary") || summarizeMessage(content);
      const requestId = readStringParam(params, "request_id");
      const approve = params.approve as boolean | undefined;
      const reason = readStringParam(params, "reason");

      // Validate team name
      validateTeamNameOrThrow(teamName);

      // Validate recipient for message type
      if (type === "message" && !recipient) {
        return jsonResult({
          error: "recipient is required for message type",
        });
      }

      // Load config and create agentToAgent policy
      const cfg = loadConfig();
      const a2aPolicy = createAgentToAgentPolicy(cfg);
      const senderSessionKey = opts?.agentSessionKey;

      // Get team directory
      const teamsDir = process.env.OPENCLAW_STATE_DIR || process.cwd();

      // Generate message ID
      const messageId = randomUUID();

      // Create message (without recipient for broadcast)
      const message: TeamMessage = {
        id: messageId,
        type,
        from: senderSessionKey || "unknown",
        content,
        summary,
        requestId,
        approve,
        reason,
        timestamp: Date.now(),
      };

      // Write message to inbox
      if (type === "broadcast") {
        // Send to all members except sender, filtered by policy
        const members = await listMembers(teamName, teamsDir);
        let deliveredCount = 0;
        const policyDeniedRecipients: string[] = [];

        for (const member of members) {
          const memberSessionKey =
            (member as { sessionKey?: string; name?: string }).sessionKey ??
            (member as { name: string }).name;

          // Skip sender
          if (memberSessionKey === senderSessionKey) {
            continue;
          }

          // Check agentToAgent policy
          const policyCheck = checkAgentToAgentPolicy({
            a2aPolicy,
            senderSessionKey,
            recipientSessionKey: memberSessionKey,
          });

          if (!policyCheck.allowed) {
            policyDeniedRecipients.push(memberSessionKey);
            continue;
          }

          const broadcastMessage = { ...message, to: memberSessionKey };
          await writeInboxMessage(
            teamName,
            teamsDir,
            memberSessionKey,
            broadcastMessage as Record<string, unknown>,
          );
          deliveredCount++;
        }

        // If all recipients were denied by policy, return error
        if (deliveredCount === 0 && policyDeniedRecipients.length > 0) {
          return jsonResult({
            messageId,
            type,
            delivered: false,
            error: `Agent-to-agent messaging denied by tools.agentToAgent policy for all recipients.`,
            deniedRecipients: policyDeniedRecipients,
          });
        }

        return jsonResult({
          messageId,
          type,
          delivered: true,
          deliveredCount,
          deniedCount: policyDeniedRecipients.length,
        });
      } else {
        // Direct message to recipient - check policy first
        const policyCheck = checkAgentToAgentPolicy({
          a2aPolicy,
          senderSessionKey,
          recipientSessionKey: recipient!,
        });

        if (!policyCheck.allowed) {
          return jsonResult({
            messageId,
            type,
            delivered: false,
            error: policyCheck.error,
          });
        }

        // Write message to recipient's inbox
        message.to = recipient;
        await writeInboxMessage(
          teamName,
          teamsDir,
          recipient!,
          message as unknown as Record<string, unknown>,
        );
      }

      return jsonResult({
        messageId,
        type,
        delivered: true,
      });
    },
  };
}
