import { beforeEach, describe, expect, it, vi } from "vitest";

const execFileMock = vi.hoisted(() => vi.fn());

vi.mock("node:child_process", () => ({
  execFile: execFileMock,
}));

import { splitArgsPreservingQuotes } from "./arg-split.js";
import { parseSystemdExecStart } from "./systemd-unit.js";
import {
  isSystemdServiceEnabled,
  isSystemdUserServiceAvailable,
  parseSystemdShow,
  readSystemdServiceRuntime,
  restartSystemdService,
  resolveSystemdUserUnitPath,
  stopSystemdService,
  uninstallSystemdService,
} from "./systemd.js";

describe("systemd availability", () => {
  beforeEach(() => {
    execFileMock.mockClear();
  });

  it("returns true when systemctl --user succeeds", async () => {
    execFileMock.mockImplementation((_cmd, _args, _opts, cb) => {
      cb(null, "", "");
    });
    await expect(isSystemdUserServiceAvailable()).resolves.toBe(true);
  });

  it("returns false when systemd user bus is unavailable", async () => {
    execFileMock.mockImplementation((_cmd, _args, _opts, cb) => {
      const err = new Error("Failed to connect to bus") as Error & {
        stderr?: string;
        code?: number;
      };
      err.stderr = "Failed to connect to bus";
      err.code = 1;
      cb(err, "", "");
    });
    await expect(isSystemdUserServiceAvailable()).resolves.toBe(false);
  });
});

describe("isSystemdServiceEnabled", () => {
  beforeEach(() => {
    execFileMock.mockClear();
  });

  it("returns false when systemctl is not present", async () => {
    execFileMock.mockImplementation((_cmd, _args, _opts, cb) => {
      const err = new Error("spawn systemctl EACCES") as Error & { code?: string };
      err.code = "EACCES";
      cb(err, "", "");
    });
    const result = await isSystemdServiceEnabled({ env: {} });
    expect(result).toBe(false);
  });

  it("calls systemctl is-enabled when user systemd is available", async () => {
    execFileMock
      .mockImplementationOnce((_cmd, args, _opts, cb) => {
        expect(args).toEqual(["--user", "status"]);
        cb(null, "", "");
      })
      .mockImplementationOnce((_cmd, args, _opts, cb) => {
        expect(args).toEqual(["--user", "is-enabled", "openclaw-gateway.service"]);
        cb(null, "enabled", "");
      });
    const result = await isSystemdServiceEnabled({ env: {} });
    expect(result).toBe(true);
  });

  it("calls systemctl is-enabled when only system systemd is available", async () => {
    execFileMock
      .mockImplementationOnce((_cmd, args, _opts, cb) => {
        expect(args).toEqual(["--user", "status"]);
        const err = new Error("Failed to connect to bus") as Error & { code?: number };
        err.code = 1;
        cb(err, "", "Failed to connect to bus");
      })
      .mockImplementationOnce((_cmd, args, _opts, cb) => {
        expect(args).toEqual(["--system", "status"]);
        cb(null, "", "");
      })
      .mockImplementationOnce((_cmd, args, _opts, cb) => {
        expect(args).toEqual(["--system", "is-enabled", "openclaw-gateway.service"]);
        cb(null, "enabled", "");
      });
    const result = await isSystemdServiceEnabled({ env: {} });
    expect(result).toBe(true);
  });

  it("treats degraded system systemd (exit 1, no error signals) as available", async () => {
    execFileMock
      .mockImplementationOnce((_cmd, _args, _opts, cb) => {
        const err = new Error("Failed to connect to bus") as Error & { code?: number };
        err.code = 1;
        cb(err, "", "Failed to connect to bus");
      })
      .mockImplementationOnce((_cmd, args, _opts, cb) => {
        expect(args).toEqual(["--system", "status"]);
        // exit 1 with no recognised error text = degraded state; systemd is running
        const err = new Error("") as Error & { code?: number };
        err.code = 1;
        cb(err, "", "State: degraded");
      })
      .mockImplementationOnce((_cmd, args, _opts, cb) => {
        expect(args).toEqual(["--system", "is-enabled", "openclaw-gateway.service"]);
        cb(null, "enabled", "");
      });
    const result = await isSystemdServiceEnabled({ env: {} });
    expect(result).toBe(true);
  });

  it("returns false when systemctl reports disabled", async () => {
    execFileMock
      .mockImplementationOnce((_cmd, _args, _opts, cb) => cb(null, "", ""))
      .mockImplementationOnce((_cmd, _args, _opts, cb) => {
        const err = new Error("disabled") as Error & { code?: number };
        err.code = 1;
        cb(err, "disabled", "");
      });
    const result = await isSystemdServiceEnabled({ env: {} });
    expect(result).toBe(false);
  });

  it("returns false when systemctl is-enabled fails for non-state errors", async () => {
    execFileMock
      .mockImplementationOnce((_cmd, _args, _opts, cb) => cb(null, "", ""))
      .mockImplementationOnce((_cmd, _args, _opts, cb) => {
        const err = new Error("Failed to connect to bus") as Error & { code?: number };
        err.code = 1;
        cb(err, "", "Failed to connect to bus");
      });
    const result = await isSystemdServiceEnabled({ env: {} });
    expect(result).toBe(false);
  });
});

describe("systemd runtime parsing", () => {
  it("parses active state details", () => {
    const output = [
      "ActiveState=inactive",
      "SubState=dead",
      "MainPID=0",
      "ExecMainStatus=2",
      "ExecMainCode=exited",
    ].join("\n");
    expect(parseSystemdShow(output)).toEqual({
      activeState: "inactive",
      subState: "dead",
      execMainStatus: 2,
      execMainCode: "exited",
    });
  });
});

describe("resolveSystemdUserUnitPath", () => {
  it.each([
    {
      name: "uses default service name when OPENCLAW_PROFILE is unset",
      env: { HOME: "/home/test" },
      expected: "/home/test/.config/systemd/user/openclaw-gateway.service",
    },
    {
      name: "uses profile-specific service name when OPENCLAW_PROFILE is set to a custom value",
      env: { HOME: "/home/test", OPENCLAW_PROFILE: "jbphoenix" },
      expected: "/home/test/.config/systemd/user/openclaw-gateway-jbphoenix.service",
    },
    {
      name: "prefers OPENCLAW_SYSTEMD_UNIT over OPENCLAW_PROFILE",
      env: {
        HOME: "/home/test",
        OPENCLAW_PROFILE: "jbphoenix",
        OPENCLAW_SYSTEMD_UNIT: "custom-unit",
      },
      expected: "/home/test/.config/systemd/user/custom-unit.service",
    },
    {
      name: "handles OPENCLAW_SYSTEMD_UNIT with .service suffix",
      env: {
        HOME: "/home/test",
        OPENCLAW_SYSTEMD_UNIT: "custom-unit.service",
      },
      expected: "/home/test/.config/systemd/user/custom-unit.service",
    },
    {
      name: "trims whitespace from OPENCLAW_SYSTEMD_UNIT",
      env: {
        HOME: "/home/test",
        OPENCLAW_SYSTEMD_UNIT: "  custom-unit  ",
      },
      expected: "/home/test/.config/systemd/user/custom-unit.service",
    },
  ])("$name", ({ env, expected }) => {
    expect(resolveSystemdUserUnitPath(env)).toBe(expected);
  });
});

describe("splitArgsPreservingQuotes", () => {
  it("splits on whitespace outside quotes", () => {
    expect(splitArgsPreservingQuotes('/usr/bin/openclaw gateway start --name "My Bot"')).toEqual([
      "/usr/bin/openclaw",
      "gateway",
      "start",
      "--name",
      "My Bot",
    ]);
  });

  it("supports systemd-style backslash escaping", () => {
    expect(
      splitArgsPreservingQuotes('openclaw --name "My \\"Bot\\"" --foo bar', {
        escapeMode: "backslash",
      }),
    ).toEqual(["openclaw", "--name", 'My "Bot"', "--foo", "bar"]);
  });

  it("supports schtasks-style escaped quotes while preserving other backslashes", () => {
    expect(
      splitArgsPreservingQuotes('openclaw --path "C:\\\\Program Files\\\\OpenClaw"', {
        escapeMode: "backslash-quote-only",
      }),
    ).toEqual(["openclaw", "--path", "C:\\\\Program Files\\\\OpenClaw"]);

    expect(
      splitArgsPreservingQuotes('openclaw --label "My \\"Quoted\\" Name"', {
        escapeMode: "backslash-quote-only",
      }),
    ).toEqual(["openclaw", "--label", 'My "Quoted" Name']);
  });
});

describe("parseSystemdExecStart", () => {
  it("preserves quoted arguments", () => {
    const execStart = '/usr/bin/openclaw gateway start --name "My Bot"';
    expect(parseSystemdExecStart(execStart)).toEqual([
      "/usr/bin/openclaw",
      "gateway",
      "start",
      "--name",
      "My Bot",
    ]);
  });
});

describe("systemd service control", () => {
  beforeEach(() => {
    execFileMock.mockClear();
  });

  it("stops the resolved user unit", async () => {
    execFileMock
      .mockImplementationOnce((_cmd, _args, _opts, cb) => cb(null, "", ""))
      .mockImplementationOnce((_cmd, args, _opts, cb) => {
        expect(args).toEqual(["--user", "stop", "openclaw-gateway.service"]);
        cb(null, "", "");
      });
    const write = vi.fn();
    const stdout = { write } as unknown as NodeJS.WritableStream;

    await stopSystemdService({ stdout, env: {} });

    expect(write).toHaveBeenCalledTimes(1);
    expect(String(write.mock.calls[0]?.[0])).toContain("Stopped systemd service");
  });

  it("restarts a profile-specific user unit", async () => {
    execFileMock
      .mockImplementationOnce((_cmd, _args, _opts, cb) => cb(null, "", ""))
      .mockImplementationOnce((_cmd, args, _opts, cb) => {
        expect(args).toEqual(["--user", "restart", "openclaw-gateway-work.service"]);
        cb(null, "", "");
      });
    const write = vi.fn();
    const stdout = { write } as unknown as NodeJS.WritableStream;

    await restartSystemdService({ stdout, env: { OPENCLAW_PROFILE: "work" } });

    expect(write).toHaveBeenCalledTimes(1);
    expect(String(write.mock.calls[0]?.[0])).toContain("Restarted systemd service");
  });

  it("surfaces stop failures with systemctl detail", async () => {
    execFileMock
      .mockImplementationOnce((_cmd, _args, _opts, cb) => cb(null, "", ""))
      .mockImplementationOnce((_cmd, _args, _opts, cb) => {
        const err = new Error("stop failed") as Error & { code?: number };
        err.code = 1;
        cb(err, "", "permission denied");
      });

    await expect(
      stopSystemdService({
        stdout: { write: vi.fn() } as unknown as NodeJS.WritableStream,
        env: {},
      }),
    ).rejects.toThrow("systemctl stop failed: permission denied");
  });

  it("disables the system unit when only system systemd is available", async () => {
    execFileMock
      .mockImplementationOnce((_cmd, _args, _opts, cb) => {
        const err = new Error("Failed to connect to bus") as Error & { code?: number };
        err.code = 1;
        cb(err, "", "Failed to connect to bus");
      })
      .mockImplementationOnce((_cmd, _args, _opts, cb) => cb(null, "", "")) // --system status
      .mockImplementationOnce((_cmd, args, _opts, cb) => {
        expect(args).toEqual(["--system", "disable", "--now", "openclaw-gateway.service"]);
        cb(null, "", "");
      });
    const write = vi.fn();
    await uninstallSystemdService({
      stdout: { write } as unknown as NodeJS.WritableStream,
      env: {},
    });
    // disable was called with --system; unlink may fail silently since file won't exist in tests
  });

  it("reads runtime from system scope when user systemd is unavailable", async () => {
    execFileMock
      .mockImplementationOnce((_cmd, _args, _opts, cb) => {
        const err = new Error("Failed to connect to bus") as Error & { code?: number };
        err.code = 1;
        cb(err, "", "Failed to connect to bus");
      })
      .mockImplementationOnce((_cmd, _args, _opts, cb) => cb(null, "", "")) // --system status
      .mockImplementationOnce((_cmd, args, _opts, cb) => {
        expect(args).toEqual([
          "--system",
          "show",
          "openclaw-gateway.service",
          "--no-page",
          "--property",
          "ActiveState,SubState,MainPID,ExecMainStatus,ExecMainCode",
        ]);
        cb(
          null,
          "ActiveState=active\nSubState=running\nMainPID=1234\nExecMainStatus=0\nExecMainCode=\n",
          "",
        );
      });
    const result = await readSystemdServiceRuntime({});
    expect(result.status).toBe("running");
    expect(result.state).toBe("active");
  });
});
