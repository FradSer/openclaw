/**
 * Inbox Storage Operations
 * Handles team message persistence via inbox directories
 */

import { appendFile, mkdir, readFile, unlink } from "fs/promises";
import { join } from "path";

/**
 * Sanitize session key for use as directory name
 * Removes dangerous characters and limits length
 */
export function sanitizeSessionKey(sessionKey: string): string {
  return sessionKey
    .replace(/[./\\]/g, "_")
    .replace(/:/g, "_")
    .substring(0, 100);
}

/**
 * Get inbox directory path for a session
 */
function getInboxPath(teamName: string, teamsDir: string, sessionKey: string): string {
  const safeSessionKey = sanitizeSessionKey(sessionKey);
  return join(teamsDir, "teams", teamName, "inbox", safeSessionKey);
}

/**
 * Ensure inbox directory exists for a session
 */
export async function ensureInboxDirectory(
  teamName: string,
  teamsDir: string,
  sessionKey: string,
): Promise<string> {
  const inboxPath = getInboxPath(teamName, teamsDir, sessionKey);
  await mkdir(inboxPath, { recursive: true });
  return inboxPath;
}

/**
 * Write a message to a session's inbox
 */
export async function writeInboxMessage(
  teamName: string,
  teamsDir: string,
  recipient: string,
  message: Record<string, unknown>,
): Promise<void> {
  const inboxPath = await ensureInboxDirectory(teamName, teamsDir, recipient);
  const messagesFile = join(inboxPath, "messages.jsonl");
  const line = JSON.stringify(message) + "\n";
  await appendFile(messagesFile, line, { mode: 0o600 });
}

/**
 * Read pending messages for a session
 */
export async function readInboxMessages(
  teamName: string,
  teamsDir: string,
  sessionKey: string,
): Promise<Record<string, unknown>[]> {
  const inboxPath = getInboxPath(teamName, teamsDir, sessionKey);
  const messagesFile = join(inboxPath, "messages.jsonl");

  try {
    const content = await readFile(messagesFile, "utf-8");
    const lines = content.trim().split("\n").filter(Boolean);
    return lines.map((line) => JSON.parse(line));
  } catch (err) {
    if ((err as { code?: string }).code !== "ENOENT") {
      throw err;
    }
    return [];
  }
}

/**
 * Clear processed messages for a session
 */
export async function clearInboxMessages(
  teamName: string,
  teamsDir: string,
  sessionKey: string,
): Promise<void> {
  const inboxPath = getInboxPath(teamName, teamsDir, sessionKey);
  const messagesFile = join(inboxPath, "messages.jsonl");

  try {
    await unlink(messagesFile);
  } catch (err) {
    if ((err as { code?: string }).code !== "ENOENT") {
      throw err;
    }
  }
}

/**
 * Alias for readInboxMessages to match test expectations
 */
export async function readPendingMessages(
  teamName: string,
  teamsDir: string,
  sessionKey: string,
): Promise<Record<string, unknown>[]> {
  return readInboxMessages(teamName, teamsDir, sessionKey);
}

/**
 * Alias for clearInboxMessages to match test expectations
 */
export async function clearProcessedMessages(
  teamName: string,
  teamsDir: string,
  sessionKey: string,
): Promise<void> {
  return clearInboxMessages(teamName, teamsDir, sessionKey);
}

/**
 * List members for broadcast messaging
 * This is a placeholder implementation that should be replaced with proper member listing
 */
export async function listMembers(
  teamName: string,
  teamsDir: string,
): Promise<Array<{ name: string; agentId: string; agentType?: string }>> {
  // This is a simple implementation for testing
  // In production, this would read from team configuration
  try {
    const teamPath = join(teamsDir, "teams", teamName);
    const configPath = join(teamPath, "config.json");
    const content = await readFile(configPath, "utf-8");
    const config = JSON.parse(content) as {
      members?: Array<{ name: string; agentId: string; agentType?: string }>;
    };
    return config.members || [];
  } catch {
    // Return empty array if config doesn't exist
    return [];
  }
}
