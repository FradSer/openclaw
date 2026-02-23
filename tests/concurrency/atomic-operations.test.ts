/**
 * Atomic Operations Tests
 * Tests for atomic file write operations
 */

import { randomUUID } from "crypto";
import { mkdirSync, rmSync, existsSync, readFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { atomicWrite } from "../../src/teams/storage";

describe.concurrent("Atomic Operations", () => {
  const testDir = join(tmpdir(), "openclaw-atomic-test");

  beforeAll(() => {
    mkdirSync(testDir, { recursive: true });
  });

  afterAll(() => {
    try {
      rmSync(testDir, { recursive: true, force: true });
    } catch {
      // Cleanup may fail on Windows
    }
  });

  it("writes content to target file atomically", async () => {
    const filePath = join(testDir, `test-${randomUUID()}.json`);
    const content = '{"key": "value"}';

    await atomicWrite(filePath, content);

    expect(existsSync(filePath)).toBe(true);
    expect(readFileSync(filePath, "utf-8")).toBe(content);
  });

  it("does not leave temp file after successful write", async () => {
    const filePath = join(testDir, `test-${randomUUID()}.json`);
    const content = '{"data": "test"}';

    await atomicWrite(filePath, content);

    const tempPath = `${filePath}.tmp`;
    expect(existsSync(tempPath)).toBe(false);
    expect(existsSync(filePath)).toBe(true);
  });

  it("overwrites existing file with new content", async () => {
    const filePath = join(testDir, `test-${randomUUID()}.json`);
    const oldContent = '{"old": "value"}';
    const newContent = '{"new": "value"}';

    await atomicWrite(filePath, oldContent);
    expect(readFileSync(filePath, "utf-8")).toBe(oldContent);

    await atomicWrite(filePath, newContent);
    expect(readFileSync(filePath, "utf-8")).toBe(newContent);
  });

  it("handles concurrent writes safely", async () => {
    const filePath = join(testDir, `test-${randomUUID()}.json`);
    const iterations = 10;
    const promises = [];

    for (let i = 0; i < iterations; i++) {
      const content = JSON.stringify({ value: i });
      promises.push(atomicWrite(filePath, content));
    }

    await Promise.all(promises);

    expect(existsSync(filePath)).toBe(true);
    const result = JSON.parse(readFileSync(filePath, "utf-8"));
    expect(result).toHaveProperty("value");
    expect(result.value).toBeGreaterThanOrEqual(0);
    expect(result.value).toBeLessThan(iterations);
  });
});
