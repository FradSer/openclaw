import * as fs from "node:fs/promises";
import path from "node:path";
import type { OpenClawConfig } from "../config/config.js";
import { resolveAgentModelFallbackValues } from "../config/model-input.js";
import { resolveStateDir } from "../config/paths.js";
import { createSubsystemLogger } from "../logging/subsystem.js";
import {
  DEFAULT_AGENT_ID,
  normalizeAgentId,
  parseAgentSessionKey,
  resolveAgentIdFromSessionKey,
} from "../routing/session-key.js";
import { getTeamsBaseDir } from "../teams/storage.js";
import { resolveUserPath } from "../utils.js";
import { normalizeSkillFilter } from "./skills/filter.js";
import { isTeammateAgentId, parseTeammateName, sanitizeTeammateName } from "./teammate-scope.js";
import { resolveDefaultAgentWorkspaceDir } from "./workspace.js";
const log = createSubsystemLogger("agent-scope");

/** Strip null bytes from paths to prevent ENOTDIR errors. */
function stripNullBytes(s: string): string {
  // eslint-disable-next-line no-control-regex
  return s.replace(/\0/g, "");
}

export { resolveAgentIdFromSessionKey };

type AgentEntry = NonNullable<NonNullable<OpenClawConfig["agents"]>["list"]>[number];

type ResolvedAgentConfig = {
  name?: string;
  workspace?: string;
  agentDir?: string;
  model?: AgentEntry["model"];
  skills?: AgentEntry["skills"];
  memorySearch?: AgentEntry["memorySearch"];
  humanDelay?: AgentEntry["humanDelay"];
  heartbeat?: AgentEntry["heartbeat"];
  identity?: AgentEntry["identity"];
  groupChat?: AgentEntry["groupChat"];
  subagents?: AgentEntry["subagents"];
  sandbox?: AgentEntry["sandbox"];
  tools?: AgentEntry["tools"];
};

let defaultAgentWarned = false;

export function listAgentEntries(cfg: OpenClawConfig): AgentEntry[] {
  const list = cfg.agents?.list;
  if (!Array.isArray(list)) {
    return [];
  }
  return list.filter((entry): entry is AgentEntry => Boolean(entry && typeof entry === "object"));
}

export function listAgentIds(cfg: OpenClawConfig): string[] {
  const agents = listAgentEntries(cfg);
  if (agents.length === 0) {
    return [DEFAULT_AGENT_ID];
  }
  const seen = new Set<string>();
  const ids: string[] = [];
  for (const entry of agents) {
    const id = normalizeAgentId(entry?.id);
    if (seen.has(id)) {
      continue;
    }
    seen.add(id);
    ids.push(id);
  }
  return ids.length > 0 ? ids : [DEFAULT_AGENT_ID];
}

export function resolveDefaultAgentId(cfg: OpenClawConfig): string {
  const agents = listAgentEntries(cfg);
  if (agents.length === 0) {
    return DEFAULT_AGENT_ID;
  }
  const defaults = agents.filter((agent) => agent?.default);
  if (defaults.length > 1 && !defaultAgentWarned) {
    defaultAgentWarned = true;
    log.warn("Multiple agents marked default=true; using the first entry as default.");
  }
  const chosen = (defaults[0] ?? agents[0])?.id?.trim();
  return normalizeAgentId(chosen || DEFAULT_AGENT_ID);
}

export function resolveSessionAgentIds(params: {
  sessionKey?: string;
  config?: OpenClawConfig;
  agentId?: string;
}): {
  defaultAgentId: string;
  sessionAgentId: string;
} {
  const defaultAgentId = resolveDefaultAgentId(params.config ?? {});
  const explicitAgentIdRaw =
    typeof params.agentId === "string" ? params.agentId.trim().toLowerCase() : "";
  const explicitAgentId = explicitAgentIdRaw ? normalizeAgentId(explicitAgentIdRaw) : null;
  const sessionKey = params.sessionKey?.trim();
  const normalizedSessionKey = sessionKey ? sessionKey.toLowerCase() : undefined;
  const parsed = normalizedSessionKey ? parseAgentSessionKey(normalizedSessionKey) : null;
  const sessionAgentId =
    explicitAgentId ?? (parsed?.agentId ? normalizeAgentId(parsed.agentId) : defaultAgentId);
  return { defaultAgentId, sessionAgentId };
}

export function resolveSessionAgentId(params: {
  sessionKey?: string;
  config?: OpenClawConfig;
}): string {
  return resolveSessionAgentIds(params).sessionAgentId;
}

function resolveAgentEntry(cfg: OpenClawConfig, agentId: string): AgentEntry | undefined {
  const id = normalizeAgentId(agentId);
  return listAgentEntries(cfg).find((entry) => normalizeAgentId(entry.id) === id);
}

export function resolveAgentConfig(
  cfg: OpenClawConfig,
  agentId: string,
): ResolvedAgentConfig | undefined {
  const id = normalizeAgentId(agentId);
  const entry = resolveAgentEntry(cfg, id);
  if (!entry) {
    return undefined;
  }
  return {
    name: typeof entry.name === "string" ? entry.name : undefined,
    workspace: typeof entry.workspace === "string" ? entry.workspace : undefined,
    agentDir: typeof entry.agentDir === "string" ? entry.agentDir : undefined,
    model:
      typeof entry.model === "string" || (entry.model && typeof entry.model === "object")
        ? entry.model
        : undefined,
    skills: Array.isArray(entry.skills) ? entry.skills : undefined,
    memorySearch: entry.memorySearch,
    humanDelay: entry.humanDelay,
    heartbeat: entry.heartbeat,
    identity: entry.identity,
    groupChat: entry.groupChat,
    subagents: typeof entry.subagents === "object" && entry.subagents ? entry.subagents : undefined,
    sandbox: entry.sandbox,
    tools: entry.tools,
  };
}

export function resolveAgentSkillsFilter(
  cfg: OpenClawConfig,
  agentId: string,
): string[] | undefined {
  return normalizeSkillFilter(resolveAgentConfig(cfg, agentId)?.skills);
}

function resolveModelPrimary(raw: unknown): string | undefined {
  if (typeof raw === "string") {
    const trimmed = raw.trim();
    return trimmed || undefined;
  }
  if (!raw || typeof raw !== "object") {
    return undefined;
  }
  const primary = (raw as { primary?: unknown }).primary;
  if (typeof primary !== "string") {
    return undefined;
  }
  const trimmed = primary.trim();
  return trimmed || undefined;
}

export function resolveAgentExplicitModelPrimary(
  cfg: OpenClawConfig,
  agentId: string,
): string | undefined {
  const raw = resolveAgentConfig(cfg, agentId)?.model;
  return resolveModelPrimary(raw);
}

export function resolveAgentEffectiveModelPrimary(
  cfg: OpenClawConfig,
  agentId: string,
): string | undefined {
  return (
    resolveAgentExplicitModelPrimary(cfg, agentId) ??
    resolveModelPrimary(cfg.agents?.defaults?.model)
  );
}

// Backward-compatible alias. Prefer explicit/effective helpers at new call sites.
export function resolveAgentModelPrimary(cfg: OpenClawConfig, agentId: string): string | undefined {
  return resolveAgentExplicitModelPrimary(cfg, agentId);
}

export function resolveAgentModelFallbacksOverride(
  cfg: OpenClawConfig,
  agentId: string,
): string[] | undefined {
  const raw = resolveAgentConfig(cfg, agentId)?.model;
  if (!raw || typeof raw === "string") {
    return undefined;
  }
  // Important: treat an explicitly provided empty array as an override to disable global fallbacks.
  if (!Object.hasOwn(raw, "fallbacks")) {
    return undefined;
  }
  return Array.isArray(raw.fallbacks) ? raw.fallbacks : undefined;
}

export function resolveFallbackAgentId(params: {
  agentId?: string | null;
  sessionKey?: string | null;
}): string {
  const explicitAgentId = typeof params.agentId === "string" ? params.agentId.trim() : "";
  if (explicitAgentId) {
    return normalizeAgentId(explicitAgentId);
  }
  return resolveAgentIdFromSessionKey(params.sessionKey);
}

export function resolveRunModelFallbacksOverride(params: {
  cfg: OpenClawConfig | undefined;
  agentId?: string | null;
  sessionKey?: string | null;
}): string[] | undefined {
  if (!params.cfg) {
    return undefined;
  }
  return resolveAgentModelFallbacksOverride(
    params.cfg,
    resolveFallbackAgentId({ agentId: params.agentId, sessionKey: params.sessionKey }),
  );
}

export function hasConfiguredModelFallbacks(params: {
  cfg: OpenClawConfig | undefined;
  agentId?: string | null;
  sessionKey?: string | null;
}): boolean {
  const fallbacksOverride = resolveRunModelFallbacksOverride(params);
  const defaultFallbacks = resolveAgentModelFallbackValues(params.cfg?.agents?.defaults?.model);
  return (fallbacksOverride ?? defaultFallbacks).length > 0;
}

export function resolveEffectiveModelFallbacks(params: {
  cfg: OpenClawConfig;
  agentId: string;
  hasSessionModelOverride: boolean;
}): string[] | undefined {
  const agentFallbacksOverride = resolveAgentModelFallbacksOverride(params.cfg, params.agentId);
  if (!params.hasSessionModelOverride) {
    return agentFallbacksOverride;
  }
  const defaultFallbacks = resolveAgentModelFallbackValues(params.cfg.agents?.defaults?.model);
  return agentFallbacksOverride ?? defaultFallbacks;
}

/**
 * Find which team a teammate belongs to by scanning team directories
 * Returns { teamName, teamsDir } if found, undefined otherwise
 */
async function findTeammateTeam(
  teammateName: string,
): Promise<{ teamName: string; teamsDir: string } | undefined> {
  const teamsDir = getTeamsBaseDir();
  const sanitizedName = sanitizeTeammateName(teammateName);

  try {
    const teamDirs = await fs.readdir(teamsDir);
    for (const teamName of teamDirs) {
      const agentDir = path.join(teamsDir, teamName, "agents", sanitizedName);
      try {
        const stat = await fs.stat(agentDir);
        if (stat.isDirectory()) {
          return { teamName, teamsDir };
        }
      } catch {
        // Directory doesn't exist, continue searching
      }
    }
  } catch {
    // teams directory doesn't exist
  }
  return undefined;
}

// Cache for teammate team lookups to avoid repeated filesystem scans
const teammateTeamCache = new Map<string, { teamName: string; teamsDir: string }>();

/**
 * Get the teammate team cache for external access
 * Used by session path resolution to find team-specific session directories
 */
export function getTeammateTeamCache(): Map<string, { teamName: string; teamsDir: string }> {
  return teammateTeamCache;
}

/**
 * Resolve teammate workspace directory within team structure
 * Returns path: {teamsDir}/{teamName}/agents/{teammateName}/workspace
 */
async function resolveTeammateWorkspaceDir(teammateName: string): Promise<string | undefined> {
  const sanitizedName = sanitizeTeammateName(teammateName);

  // Check cache first
  const cached = teammateTeamCache.get(sanitizedName);
  if (cached) {
    return path.join(cached.teamsDir, cached.teamName, "agents", sanitizedName, "workspace");
  }

  // Find which team this teammate belongs to
  const teamInfo = await findTeammateTeam(sanitizedName);
  if (!teamInfo) {
    return undefined;
  }

  // Cache the result
  teammateTeamCache.set(sanitizedName, teamInfo);

  return path.join(teamInfo.teamsDir, teamInfo.teamName, "agents", sanitizedName, "workspace");
}

// Sync version for backwards compatibility - checks cache only
function resolveTeammateWorkspaceDirSync(teammateName: string): string | undefined {
  const sanitizedName = sanitizeTeammateName(teammateName);
  const cached = teammateTeamCache.get(sanitizedName);
  if (cached) {
    return path.join(cached.teamsDir, cached.teamName, "agents", sanitizedName, "workspace");
  }
  return undefined;
}

/**
 * Register teammate team mapping for workspace resolution
 * Call this when spawning a teammate to populate the cache
 */
export function registerTeammateTeam(
  teammateName: string,
  teamName: string,
  teamsDir: string,
): void {
  const sanitizedName = sanitizeTeammateName(teammateName);
  teammateTeamCache.set(sanitizedName, { teamName, teamsDir });
}

export function resolveAgentWorkspaceDir(cfg: OpenClawConfig, agentId: string) {
  const id = normalizeAgentId(agentId);
  const configured = resolveAgentConfig(cfg, id)?.workspace?.trim();
  if (configured) {
    return stripNullBytes(resolveUserPath(configured));
  }

  // Check if this is a teammate agent
  if (isTeammateAgentId(id)) {
    const teammateName = parseTeammateName(id);
    if (teammateName) {
      // Try cache first (sync)
      const cachedWorkspace = resolveTeammateWorkspaceDirSync(teammateName);
      if (cachedWorkspace) {
        return cachedWorkspace;
      }
      // Fallback: will use default path below, but teammate should have been registered
      // This handles the case where resolveAgentWorkspaceDir is called before registration
    }
  }

  const defaultAgentId = resolveDefaultAgentId(cfg);
  if (id === defaultAgentId) {
    const fallback = cfg.agents?.defaults?.workspace?.trim();
    if (fallback) {
      return stripNullBytes(resolveUserPath(fallback));
    }
    return stripNullBytes(resolveDefaultAgentWorkspaceDir(process.env));
  }
  const stateDir = resolveStateDir(process.env);
  return stripNullBytes(path.join(stateDir, `workspace-${id}`));
}

/**
 * Async version of resolveAgentWorkspaceDir that can search filesystem for teammates
 * Use this when the teammate may not be in cache yet
 */
export async function resolveAgentWorkspaceDirAsync(
  cfg: OpenClawConfig,
  agentId: string,
): Promise<string> {
  const id = normalizeAgentId(agentId);
  const configured = resolveAgentConfig(cfg, id)?.workspace?.trim();
  if (configured) {
    return resolveUserPath(configured);
  }

  // Check if this is a teammate agent
  if (isTeammateAgentId(id)) {
    const teammateName = parseTeammateName(id);
    if (teammateName) {
      // Try cache first
      const cachedWorkspace = resolveTeammateWorkspaceDirSync(teammateName);
      if (cachedWorkspace) {
        return cachedWorkspace;
      }
      // Search filesystem
      const teammateWorkspace = await resolveTeammateWorkspaceDir(teammateName);
      if (teammateWorkspace) {
        return teammateWorkspace;
      }
    }
  }

  // Fall back to sync version for non-teammate or if teammate not found
  return resolveAgentWorkspaceDir(cfg, agentId);
}

/**
 * Sync version of teammate agent directory resolution - checks cache only
 */
function resolveTeammateAgentDirSync(teammateName: string): string | undefined {
  const sanitizedName = sanitizeTeammateName(teammateName);
  const cached = teammateTeamCache.get(sanitizedName);
  if (cached) {
    return path.join(cached.teamsDir, cached.teamName, "agents", sanitizedName, "agent");
  }
  return undefined;
}

export function resolveAgentDir(cfg: OpenClawConfig, agentId: string) {
  const id = normalizeAgentId(agentId);
  const configured = resolveAgentConfig(cfg, id)?.agentDir?.trim();
  if (configured) {
    return resolveUserPath(configured);
  }

  // Check if this is a teammate agent
  if (isTeammateAgentId(id)) {
    const teammateName = parseTeammateName(id);
    if (teammateName) {
      const cachedAgentDir = resolveTeammateAgentDirSync(teammateName);
      if (cachedAgentDir) {
        return cachedAgentDir;
      }
    }
  }

  const root = resolveStateDir(process.env);
  return path.join(root, "agents", id, "agent");
}
