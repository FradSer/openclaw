/**
 * SendMessage Tool
 * Sends messages between team members via inbox directories
 */

import { randomUUID } from "node:crypto";
import { Type } from "@sinclair/typebox";
import { writeInboxMessage, listMembers } from "../../../teams/inbox.js";
import { validateTeamNameOrThrow } from "../../../teams/storage.js";
import type { TeamMessage } from "../../../teams/types.js";
import type { AnyAgentTool } from "../common.js";
import { jsonResult, readStringParam } from "../common.js";

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

      // Get team directory
      const teamsDir = process.env.OPENCLAW_STATE_DIR || process.cwd();

      // Generate message ID
      const messageId = randomUUID();

      // Create message (without recipient for broadcast)
      const message: TeamMessage = {
        id: messageId,
        type,
        from: opts?.agentSessionKey || "unknown",
        content,
        summary,
        requestId,
        approve,
        reason,
        timestamp: Date.now(),
      };

      // Write message to inbox
      if (type === "broadcast") {
        // Send to all members except sender
        const members = await listMembers(teamName, teamsDir);
        for (const member of members) {
          const memberSessionKey =
            (member as { sessionKey?: string; name?: string }).sessionKey ??
            (member as { name: string }).name;
          if (memberSessionKey !== opts?.agentSessionKey) {
            const broadcastMessage = { ...message, to: memberSessionKey };
            await writeInboxMessage(
              teamName,
              teamsDir,
              memberSessionKey,
              broadcastMessage as Record<string, unknown>,
            );
          }
        }
      } else {
        // Direct message to recipient
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
