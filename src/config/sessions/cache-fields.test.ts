import { describe, expect, it } from "vitest";
import type { SessionEntry } from "./types.js";
import { mergeSessionEntry } from "./types.js";

describe("SessionEntry cache fields", () => {
  it("supports cacheRead and cacheWrite fields", () => {
    const entry: SessionEntry = {
      sessionId: "test-session",
      updatedAt: Date.now(),
      cacheRead: 1500,
      cacheWrite: 300,
    };

    expect(entry.cacheRead).toBe(1500);
    expect(entry.cacheWrite).toBe(300);
  });

  it("merges cache fields properly", () => {
    const existing: SessionEntry = {
      sessionId: "test-session",
      updatedAt: Date.now(),
      cacheRead: 1000,
      cacheWrite: 200,
      totalTokens: 5000,
    };

    const patch: Partial<SessionEntry> = {
      cacheRead: 1500,
      cacheWrite: 300,
    };

    const merged = mergeSessionEntry(existing, patch);

    expect(merged.cacheRead).toBe(1500);
    expect(merged.cacheWrite).toBe(300);
    expect(merged.totalTokens).toBe(5000); // Preserved from existing
  });

  it("handles undefined cache fields", () => {
    const entry: SessionEntry = {
      sessionId: "test-session",
      updatedAt: Date.now(),
      totalTokens: 5000,
    };

    expect(entry.cacheRead).toBeUndefined();
    expect(entry.cacheWrite).toBeUndefined();
  });

  it("allows cache fields to be cleared with undefined", () => {
    const existing: SessionEntry = {
      sessionId: "test-session",
      updatedAt: Date.now(),
      cacheRead: 1000,
      cacheWrite: 200,
    };

    const patch: Partial<SessionEntry> = {
      cacheRead: undefined,
      cacheWrite: undefined,
    };

    const merged = mergeSessionEntry(existing, patch);

    expect(merged.cacheRead).toBeUndefined();
    expect(merged.cacheWrite).toBeUndefined();
  });
});

describe("SessionEntry team fields", () => {
  it("supports all team fields", () => {
    const entry: SessionEntry = {
      sessionId: "test-session",
      updatedAt: Date.now(),
      teamId: "team-123",
      teamRole: "lead",
      teamName: "Feature Team",
      teamCapabilities: ["bash", "read", "write"],
    };

    expect(entry.teamId).toBe("team-123");
    expect(entry.teamRole).toBe("lead");
    expect(entry.teamName).toBe("Feature Team");
    expect(entry.teamCapabilities).toEqual(["bash", "read", "write"]);
  });

  it("merges team fields properly", () => {
    const existing: SessionEntry = {
      sessionId: "test-session",
      updatedAt: Date.now(),
      teamId: "team-123",
      teamRole: "member",
      teamName: "Feature Team",
      teamCapabilities: ["bash"],
      totalTokens: 5000,
    };

    const patch: Partial<SessionEntry> = {
      teamRole: "lead",
      teamCapabilities: ["bash", "read", "write"],
    };

    const merged = mergeSessionEntry(existing, patch);

    expect(merged.teamId).toBe("team-123"); // Preserved from existing
    expect(merged.teamRole).toBe("lead"); // Updated from patch
    expect(merged.teamName).toBe("Feature Team"); // Preserved from existing
    expect(merged.teamCapabilities).toEqual(["bash", "read", "write"]); // Updated from patch
    expect(merged.totalTokens).toBe(5000); // Preserved from existing
  });

  it("handles undefined team fields", () => {
    const entry: SessionEntry = {
      sessionId: "test-session",
      updatedAt: Date.now(),
      totalTokens: 5000,
    };

    expect(entry.teamId).toBeUndefined();
    expect(entry.teamRole).toBeUndefined();
    expect(entry.teamName).toBeUndefined();
    expect(entry.teamCapabilities).toBeUndefined();
  });

  it("allows team fields to be cleared with undefined", () => {
    const existing: SessionEntry = {
      sessionId: "test-session",
      updatedAt: Date.now(),
      teamId: "team-123",
      teamRole: "lead",
      teamName: "Feature Team",
      teamCapabilities: ["bash", "read", "write"],
    };

    const patch: Partial<SessionEntry> = {
      teamId: undefined,
      teamRole: undefined,
      teamName: undefined,
      teamCapabilities: undefined,
    };

    const merged = mergeSessionEntry(existing, patch);

    expect(merged.teamId).toBeUndefined();
    expect(merged.teamRole).toBeUndefined();
    expect(merged.teamName).toBeUndefined();
    expect(merged.teamCapabilities).toBeUndefined();
  });

  it("supports both lead and member team roles", () => {
    const leadEntry: SessionEntry = {
      sessionId: "test-session",
      updatedAt: Date.now(),
      teamId: "team-123",
      teamRole: "lead",
    };

    const memberEntry: SessionEntry = {
      sessionId: "test-session",
      updatedAt: Date.now(),
      teamId: "team-456",
      teamRole: "member",
    };

    expect(leadEntry.teamRole).toBe("lead");
    expect(memberEntry.teamRole).toBe("member");
  });

  it("allows empty teamCapabilities array", () => {
    const entry: SessionEntry = {
      sessionId: "test-session",
      updatedAt: Date.now(),
      teamId: "team-123",
      teamRole: "lead",
      teamCapabilities: [],
    };

    expect(entry.teamCapabilities).toEqual([]);
  });

  it("merges cache and team fields together", () => {
    const existing: SessionEntry = {
      sessionId: "test-session",
      updatedAt: Date.now(),
      cacheRead: 1000,
      cacheWrite: 200,
      teamId: "team-123",
      teamRole: "member",
    };

    const patch: Partial<SessionEntry> = {
      cacheRead: 1500,
      teamRole: "lead",
      teamCapabilities: ["bash", "read"],
    };

    const merged = mergeSessionEntry(existing, patch);

    expect(merged.cacheRead).toBe(1500);
    expect(merged.cacheWrite).toBe(200);
    expect(merged.teamId).toBe("team-123");
    expect(merged.teamRole).toBe("lead");
    expect(merged.teamCapabilities).toEqual(["bash", "read"]);
  });
});
