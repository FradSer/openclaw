import { Buffer } from "node:buffer";
import { generateKeyPairSync } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { DeviceIdentity } from "../infra/device-identity.js";

const wsInstances = vi.hoisted((): MockWebSocket[] => []);
const clearDeviceAuthTokenMock = vi.hoisted(() => vi.fn());
const loadDeviceAuthTokenMock = vi.hoisted(() => vi.fn());
const storeDeviceAuthTokenMock = vi.hoisted(() => vi.fn());
const clearDevicePairingMock = vi.hoisted(() => vi.fn());
const listDevicePairingMock = vi.hoisted(() => vi.fn());
const approveDevicePairingMock = vi.hoisted(() => vi.fn());
const logDebugMock = vi.hoisted(() => vi.fn());

type WsEvent = "open" | "message" | "close" | "error";
type WsEventHandlers = {
  open: () => void;
  message: (data: string | Buffer) => void;
  close: (code: number, reason: Buffer) => void;
  error: (err: unknown) => void;
};

class MockWebSocket {
  private openHandlers: WsEventHandlers["open"][] = [];
  private messageHandlers: WsEventHandlers["message"][] = [];
  private closeHandlers: WsEventHandlers["close"][] = [];
  private errorHandlers: WsEventHandlers["error"][] = [];
  readyState = MockWebSocket.OPEN;
  sent: string[] = [];
  static OPEN = 1;

  constructor(_url: string, _options?: unknown) {
    wsInstances.push(this);
  }

  on(event: "open", handler: WsEventHandlers["open"]): void;
  on(event: "message", handler: WsEventHandlers["message"]): void;
  on(event: "close", handler: WsEventHandlers["close"]): void;
  on(event: "error", handler: WsEventHandlers["error"]): void;
  on(event: WsEvent, handler: WsEventHandlers[WsEvent]): void {
    switch (event) {
      case "open":
        this.openHandlers.push(handler as WsEventHandlers["open"]);
        return;
      case "message":
        this.messageHandlers.push(handler as WsEventHandlers["message"]);
        return;
      case "close":
        this.closeHandlers.push(handler as WsEventHandlers["close"]);
        return;
      case "error":
        this.errorHandlers.push(handler as WsEventHandlers["error"]);
        return;
      default:
        return;
    }
  }

  close(_code?: number, _reason?: string): void {}

  send(payload: string): void {
    this.sent.push(payload);
  }

  emitOpen(): void {
    for (const handler of this.openHandlers) {
      handler();
    }
  }

  emitMessage(data: string): void {
    for (const handler of this.messageHandlers) {
      handler(data);
    }
  }

  emitClose(code: number, reason: string): void {
    for (const handler of this.closeHandlers) {
      handler(code, Buffer.from(reason));
    }
  }
}

vi.mock("ws", () => ({
  WebSocket: MockWebSocket,
}));

vi.mock("../infra/device-auth-store.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../infra/device-auth-store.js")>();
  return {
    ...actual,
    loadDeviceAuthToken: (...args: unknown[]) => loadDeviceAuthTokenMock(...args),
    storeDeviceAuthToken: (...args: unknown[]) => storeDeviceAuthTokenMock(...args),
    clearDeviceAuthToken: (...args: unknown[]) => clearDeviceAuthTokenMock(...args),
  };
});

vi.mock("../infra/device-pairing.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../infra/device-pairing.js")>();
  return {
    ...actual,
    listDevicePairing: (...args: unknown[]) => listDevicePairingMock(...args),
    clearDevicePairing: (...args: unknown[]) => clearDevicePairingMock(...args),
    approveDevicePairing: (...args: unknown[]) => approveDevicePairingMock(...args),
  };
});

vi.mock("../logger.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../logger.js")>();
  return {
    ...actual,
    logDebug: (...args: unknown[]) => logDebugMock(...args),
  };
});

const { GatewayClient } = await import("./client.js");

function getLatestWs(): MockWebSocket {
  const ws = wsInstances.at(-1);
  if (!ws) {
    throw new Error("missing mock websocket instance");
  }
  return ws;
}

function createClientWithIdentity(
  deviceId: string,
  onClose: (code: number, reason: string) => void,
  opts?: { allowStoredDeviceToken?: boolean; token?: string },
) {
  const { publicKey, privateKey } = generateKeyPairSync("ed25519");
  const identity: DeviceIdentity = {
    deviceId,
    privateKeyPem: privateKey.export({ type: "pkcs8", format: "pem" }).toString(),
    publicKeyPem: publicKey.export({ type: "spki", format: "pem" }).toString(),
  };
  return new GatewayClient({
    url: "ws://127.0.0.1:18789",
    deviceIdentity: identity,
    allowStoredDeviceToken: opts?.allowStoredDeviceToken,
    token: opts?.token,
    onClose,
  });
}

describe("GatewayClient security checks", () => {
  beforeEach(() => {
    wsInstances.length = 0;
    listDevicePairingMock.mockResolvedValue({ pending: [], paired: [] });
  });

  it("blocks ws:// to non-loopback addresses (CWE-319)", () => {
    const onConnectError = vi.fn();
    const client = new GatewayClient({
      url: "ws://remote.example.com:18789",
      onConnectError,
    });

    client.start();

    expect(onConnectError).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringContaining("SECURITY ERROR"),
      }),
    );
    const error = onConnectError.mock.calls[0]?.[0] as Error;
    expect(error.message).toContain("openclaw doctor --fix");
    expect(error.message).toContain("Tailscale Serve/Funnel");
    expect(wsInstances.length).toBe(0); // No WebSocket created
    client.stop();
  });

  it("handles malformed URLs gracefully without crashing", () => {
    const onConnectError = vi.fn();
    const client = new GatewayClient({
      url: "not-a-valid-url",
      onConnectError,
    });

    // Should not throw
    expect(() => client.start()).not.toThrow();

    expect(onConnectError).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringContaining("SECURITY ERROR"),
      }),
    );
    const error = onConnectError.mock.calls[0]?.[0] as Error;
    expect(error.message).toContain("openclaw doctor --fix");
    expect(wsInstances.length).toBe(0); // No WebSocket created
    client.stop();
  });

  it("allows ws:// to loopback addresses", () => {
    const onConnectError = vi.fn();
    const client = new GatewayClient({
      url: "ws://127.0.0.1:18789",
      onConnectError,
    });

    client.start();

    expect(onConnectError).not.toHaveBeenCalled();
    expect(wsInstances.length).toBe(1); // WebSocket created
    client.stop();
  });

  it("allows wss:// to any address", () => {
    const onConnectError = vi.fn();
    const client = new GatewayClient({
      url: "wss://remote.example.com:18789",
      onConnectError,
    });

    client.start();

    expect(onConnectError).not.toHaveBeenCalled();
    expect(wsInstances.length).toBe(1); // WebSocket created
    client.stop();
  });
});

describe("GatewayClient close handling", () => {
  beforeEach(() => {
    wsInstances.length = 0;
    loadDeviceAuthTokenMock.mockClear();
    loadDeviceAuthTokenMock.mockReturnValue(undefined);
    storeDeviceAuthTokenMock.mockClear();
    storeDeviceAuthTokenMock.mockImplementation(() => undefined);
    listDevicePairingMock.mockResolvedValue({ pending: [], paired: [] });
    clearDeviceAuthTokenMock.mockClear();
    clearDeviceAuthTokenMock.mockImplementation(() => undefined);
    clearDevicePairingMock.mockClear();
    clearDevicePairingMock.mockResolvedValue(true);
    logDebugMock.mockClear();
  });

  it("clears stale token on device token mismatch close", () => {
    const onClose = vi.fn();
    const client = createClientWithIdentity("dev-1", onClose);

    client.start();
    getLatestWs().emitClose(
      1008,
      "unauthorized: DEVICE token mismatch (rotate/reissue device token)",
    );

    expect(clearDeviceAuthTokenMock).toHaveBeenCalledWith({ deviceId: "dev-1", role: "operator" });
    expect(clearDevicePairingMock).toHaveBeenCalledWith("dev-1");
    expect(onClose).toHaveBeenCalledWith(
      1008,
      "unauthorized: DEVICE token mismatch (rotate/reissue device token)",
    );
    client.stop();
  });

  it("does not break close flow when token clear throws", () => {
    clearDeviceAuthTokenMock.mockImplementation(() => {
      throw new Error("disk unavailable");
    });
    const onClose = vi.fn();
    const client = createClientWithIdentity("dev-2", onClose);

    client.start();
    expect(() => {
      getLatestWs().emitClose(1008, "unauthorized: device token mismatch");
    }).not.toThrow();

    expect(logDebugMock).toHaveBeenCalledWith(
      expect.stringContaining("failed clearing stale device-auth token"),
    );
    expect(clearDevicePairingMock).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalledWith(1008, "unauthorized: device token mismatch");
    client.stop();
  });

  it("does not break close flow when pairing clear rejects", async () => {
    clearDevicePairingMock.mockRejectedValue(new Error("pairing store unavailable"));
    const onClose = vi.fn();
    const client = createClientWithIdentity("dev-3", onClose);

    client.start();
    expect(() => {
      getLatestWs().emitClose(1008, "unauthorized: device token mismatch");
    }).not.toThrow();

    await Promise.resolve();
    expect(logDebugMock).toHaveBeenCalledWith(
      expect.stringContaining("failed clearing stale device pairing"),
    );
    expect(onClose).toHaveBeenCalledWith(1008, "unauthorized: device token mismatch");
    client.stop();
  });

  it("does not clear auth state for non-mismatch close reasons", () => {
    const onClose = vi.fn();
    const client = createClientWithIdentity("dev-4", onClose);

    client.start();
    getLatestWs().emitClose(1008, "unauthorized: signature invalid");

    expect(clearDeviceAuthTokenMock).not.toHaveBeenCalled();
    expect(clearDevicePairingMock).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalledWith(1008, "unauthorized: signature invalid");
    client.stop();
  });

  it("does not load persisted device token when allowStoredDeviceToken is false", () => {
    loadDeviceAuthTokenMock.mockReturnValue({ token: "stored-token" });
    const client = createClientWithIdentity("dev-5", vi.fn(), {
      allowStoredDeviceToken: false,
    });

    client.start();
    const ws = getLatestWs();
    ws.emitOpen();
    ws.emitMessage(
      JSON.stringify({
        type: "event",
        event: "connect.challenge",
        payload: { nonce: "nonce-1" },
      }),
    );

    const req = ws.sent
      .map((raw) => JSON.parse(raw) as { method?: string; params?: { auth?: { token?: string } } })
      .find((frame) => frame.method === "connect");
    expect(loadDeviceAuthTokenMock).not.toHaveBeenCalled();
    expect(req?.params?.auth).toBeUndefined();
    client.stop();
  });

  it("still sends signed device payload when device identity is present", () => {
    const client = createClientWithIdentity("dev-6", vi.fn(), {
      token: "explicit-token",
    });

    client.start();
    const ws = getLatestWs();
    ws.emitOpen();
    ws.emitMessage(
      JSON.stringify({
        type: "event",
        event: "connect.challenge",
        payload: { nonce: "nonce-2" },
      }),
    );

    const req = ws.sent
      .map(
        (raw) =>
          JSON.parse(raw) as {
            method?: string;
            params?: { device?: { id?: string; signature?: string; nonce?: string } };
          },
      )
      .find((frame) => frame.method === "connect");
    expect(req?.params?.device?.id).toBe("dev-6");
    expect(typeof req?.params?.device?.signature).toBe("string");
    expect(req?.params?.device?.nonce).toBe("nonce-2");
    client.stop();
  });
});

describe("GatewayClient pre-connection repair approval", () => {
  beforeEach(() => {
    wsInstances.length = 0;
    clearDeviceAuthTokenMock.mockClear();
    loadDeviceAuthTokenMock.mockClear();
    storeDeviceAuthTokenMock.mockClear();
    clearDevicePairingMock.mockClear();
    listDevicePairingMock.mockClear();
    approveDevicePairingMock.mockClear();
    logDebugMock.mockClear();
    loadDeviceAuthTokenMock.mockReturnValue(null);
    listDevicePairingMock.mockResolvedValue({ pending: [], paired: [] });
    approveDevicePairingMock.mockResolvedValue(null);
  });

  it("approves repair request for local loopback with operator role", async () => {
    const deviceId = "dev-7";
    const now = Date.now();
    listDevicePairingMock.mockResolvedValue({
      pending: [
        {
          requestId: "req-repair",
          deviceId,
          role: "operator",
          isRepair: true,
          ts: now - 10_000,
          publicKey: "test-key",
        },
      ],
      paired: [],
    });
    approveDevicePairingMock.mockResolvedValue({
      requestId: "req-repair",
      device: { deviceId },
    });

    const client = new GatewayClient({
      url: "ws://127.0.0.1:18789",
      role: "operator",
      deviceIdentity: { deviceId, publicKeyPem: "", privateKeyPem: "" },
    });
    client.start();

    // Wait for async approval to complete
    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(listDevicePairingMock).toHaveBeenCalledTimes(1);
    expect(approveDevicePairingMock).toHaveBeenCalledWith("req-repair");
    expect(logDebugMock).toHaveBeenCalledWith(
      expect.stringContaining("auto-approved device repair request"),
    );
    client.stop();
  });

  it("does not approve for non-loopback URLs", async () => {
    listDevicePairingMock.mockResolvedValue({ pending: [], paired: [] });
    approveDevicePairingMock.mockResolvedValue(null);

    const client = new GatewayClient({
      url: "wss://remote.example.com/ws",
      role: "operator",
      deviceIdentity: { deviceId: "dev-8", publicKeyPem: "", privateKeyPem: "" },
    });
    client.start();

    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(listDevicePairingMock).not.toHaveBeenCalled();
    expect(approveDevicePairingMock).not.toHaveBeenCalled();
    client.stop();
  });

  it("does not approve for non-operator role", async () => {
    listDevicePairingMock.mockResolvedValue({ pending: [], paired: [] });
    approveDevicePairingMock.mockResolvedValue(null);

    const client = new GatewayClient({
      url: "ws://127.0.0.1:18789",
      role: "viewer",
      deviceIdentity: { deviceId: "dev-9", publicKeyPem: "", privateKeyPem: "" },
    });
    client.start();

    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(listDevicePairingMock).not.toHaveBeenCalled();
    expect(approveDevicePairingMock).not.toHaveBeenCalled();
    client.stop();
  });

  it("does not approve when token is provided", async () => {
    listDevicePairingMock.mockResolvedValue({ pending: [], paired: [] });
    approveDevicePairingMock.mockResolvedValue(null);

    const client = new GatewayClient({
      url: "ws://127.0.0.1:18789",
      role: "operator",
      token: "explicit-token",
      deviceIdentity: { deviceId: "dev-10", publicKeyPem: "", privateKeyPem: "" },
    });
    client.start();

    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(listDevicePairingMock).not.toHaveBeenCalled();
    expect(approveDevicePairingMock).not.toHaveBeenCalled();
    client.stop();
  });

  it("skips repair request with isRepair=false", async () => {
    const deviceId = "dev-11";
    const now = Date.now();
    listDevicePairingMock.mockResolvedValue({
      pending: [
        {
          requestId: "req-initial",
          deviceId,
          role: "operator",
          isRepair: false,
          ts: now - 10_000,
          publicKey: "test-key",
        },
      ],
      paired: [],
    });
    approveDevicePairingMock.mockResolvedValue(null);

    const client = new GatewayClient({
      url: "ws://127.0.0.1:18789",
      role: "operator",
      deviceIdentity: { deviceId, publicKeyPem: "", privateKeyPem: "" },
    });
    client.start();

    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(listDevicePairingMock).toHaveBeenCalledTimes(1);
    expect(approveDevicePairingMock).not.toHaveBeenCalled();
    client.stop();
  });

  it("skips repair request with wrong deviceId", async () => {
    const now = Date.now();
    listDevicePairingMock.mockResolvedValue({
      pending: [
        {
          requestId: "req-other",
          deviceId: "other-device",
          role: "operator",
          isRepair: true,
          ts: now - 10_000,
          publicKey: "test-key",
        },
      ],
      paired: [],
    });
    approveDevicePairingMock.mockResolvedValue(null);

    const client = new GatewayClient({
      url: "ws://127.0.0.1:18789",
      role: "operator",
      deviceIdentity: { deviceId: "dev-12", publicKeyPem: "", privateKeyPem: "" },
    });
    client.start();

    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(listDevicePairingMock).toHaveBeenCalledTimes(1);
    expect(approveDevicePairingMock).not.toHaveBeenCalled();
    client.stop();
  });

  it("skips repair request older than 120s", async () => {
    const deviceId = "dev-13";
    const now = Date.now();
    listDevicePairingMock.mockResolvedValue({
      pending: [
        {
          requestId: "req-old",
          deviceId,
          role: "operator",
          isRepair: true,
          ts: now - 200_000,
          publicKey: "test-key",
        },
      ],
      paired: [],
    });
    approveDevicePairingMock.mockResolvedValue(null);

    const client = new GatewayClient({
      url: "ws://127.0.0.1:18789",
      role: "operator",
      deviceIdentity: { deviceId, publicKeyPem: "", privateKeyPem: "" },
    });
    client.start();

    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(listDevicePairingMock).toHaveBeenCalledTimes(1);
    expect(approveDevicePairingMock).not.toHaveBeenCalled();
    client.stop();
  });
});
