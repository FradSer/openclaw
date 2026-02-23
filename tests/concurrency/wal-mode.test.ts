/**
 * WAL Mode Concurrency Tests
 * Tests for SQLite Write-Ahead Logging mode in TeamLedger
 */

import { rmSync, mkdirSync, existsSync } from "fs";
import { join } from "path";
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { TeamLedger } from "../../src/teams/ledger";

describe.concurrent("WAL Mode", () => {
  const testStateDir = join(process.cwd(), ".test-wal-temp");
  const testTeamName = "test-wal-team";
  let ledger: TeamLedger;

  beforeEach(() => {
    try {
      mkdirSync(join(testStateDir, "teams", testTeamName), { recursive: true });
    } catch {
      // Directory may already exist
    }
    ledger = new TeamLedger(testTeamName, testStateDir);
    ledger.openDatabase();
  });

  afterEach(() => {
    ledger.close();
    try {
      rmSync(join(testStateDir, "teams", testTeamName), { recursive: true, force: true });
    } catch {
      // Cleanup may fail on Windows
    }
  });

  it("enables WAL mode when database opens", () => {
    const db = ledger.getDb();
    const stmt = db.prepare("PRAGMA journal_mode");
    const result = stmt.get() as { journal_mode: string };
    expect(String(result.journal_mode).toLowerCase()).toBe("wal");
  });

  it("configures WAL autocheckpoint interval", () => {
    const db = ledger.getDb();
    const stmt = db.prepare("PRAGMA wal_autocheckpoint");
    const result = stmt.get() as { wal_autocheckpoint: number };
    expect(Number(result.wal_autocheckpoint)).toBe(1000);
  });

  it("allows concurrent reads during write transaction", () => {
    const db = ledger.getDb();

    // Start a write transaction
    db.exec("BEGIN IMMEDIATE TRANSACTION");

    // Concurrent read should be allowed in WAL mode
    const stmt = db.prepare("SELECT COUNT(*) FROM tasks");
    const result = stmt.get();
    expect(result).toBeDefined();

    // Cleanup transaction
    db.exec("ROLLBACK");
  });

  it("creates WAL index file alongside database", () => {
    const dbPath = join(testStateDir, "teams", testTeamName, "ledger.db");
    const walPath = `${dbPath}-wal`;
    const shmPath = `${dbPath}-shm`;

    expect(existsSync(dbPath)).toBe(true);
    expect(existsSync(walPath)).toBe(true);
    expect(existsSync(shmPath)).toBe(true);
  });
});
