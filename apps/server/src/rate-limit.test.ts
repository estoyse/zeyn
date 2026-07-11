import { describe, it, expect, vi } from "vitest";
import { enforceRateLimit, type RateLimiter } from "@zeyn/api/rate-limit";

describe("enforceRateLimit", () => {
  it("allows when the limiter binding is absent", async () => {
    expect(await enforceRateLimit(null, "1.2.3.4")).toBe(true);
    expect(await enforceRateLimit(undefined, "1.2.3.4")).toBe(true);
  });

  it("allows when the key (client ip) is missing", async () => {
    const limiter: RateLimiter = { limit: vi.fn() };
    expect(await enforceRateLimit(limiter, null)).toBe(true);
    expect(await enforceRateLimit(limiter, undefined)).toBe(true);
    expect(limiter.limit).not.toHaveBeenCalled();
  });

  it("allows while under the limit", async () => {
    const limiter: RateLimiter = {
      limit: vi.fn().mockResolvedValue({ success: true }),
    };
    expect(await enforceRateLimit(limiter, "1.2.3.4")).toBe(true);
    expect(limiter.limit).toHaveBeenCalledWith({ key: "1.2.3.4" });
  });

  it("blocks once the limit is exceeded", async () => {
    const limiter: RateLimiter = {
      limit: vi.fn().mockResolvedValue({ success: false }),
    };
    expect(await enforceRateLimit(limiter, "1.2.3.4")).toBe(false);
  });
});
