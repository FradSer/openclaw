/**
 * Retry Logic Tests
 * Tests for retryAsync function with various failure scenarios
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { retryAsync } from "../../src/infra/retry";

describe.concurrent("Retry Logic", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("succeeds on first attempt without retries", async () => {
    const fn = vi.fn().mockResolvedValue("success");
    const result = await retryAsync(fn, { attempts: 3, minDelayMs: 10, maxDelayMs: 100 });

    expect(result).toBe("success");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("retries on transient failure and succeeds", async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error("network error"))
      .mockResolvedValue("recovered");

    const promise = retryAsync(fn, { attempts: 3, minDelayMs: 10, maxDelayMs: 100 });
    await vi.runAllTimersAsync();

    const result = await promise;
    expect(result).toBe("recovered");
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("exhausts retries and throws final error", async () => {
    const fn = vi.fn().mockRejectedValue(new Error("persistent failure"));
    const promise = retryAsync(fn, { attempts: 3, minDelayMs: 10, maxDelayMs: 100 });

    await vi.runAllTimersAsync();

    await expect(promise).rejects.toThrow("persistent failure");
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it("respects shouldRetry callback to skip retries", async () => {
    const fn = vi.fn().mockRejectedValue(new Error("non-retryable"));
    const shouldRetry = vi.fn().mockReturnValue(false);

    const promise = retryAsync(fn, {
      attempts: 5,
      minDelayMs: 10,
      maxDelayMs: 100,
      shouldRetry,
    });

    await expect(promise).rejects.toThrow("non-retryable");
    expect(fn).toHaveBeenCalledTimes(1);
    expect(shouldRetry).toHaveBeenCalledWith(expect.any(Error), 1);
  });
});
