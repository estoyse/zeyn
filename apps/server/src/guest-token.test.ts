import { describe, it, expect } from "vitest";
import {
  signGuestToken,
  verifyGuestToken,
  GUEST_TOKEN_TTL_MS,
} from "@zeyn/api/guest-token";

const SECRET = "test-secret-value";

describe("guest token", () => {
  it("signs a token with a guest-prefixed id and verifies its payload", async () => {
    const { token, guestId } = await signGuestToken(SECRET, { name: "Ann" });
    expect(guestId.startsWith("guest-")).toBe(true);

    const payload = await verifyGuestToken(SECRET, token);
    expect(payload).not.toBeNull();
    expect(payload?.gid).toBe(guestId);
    expect(payload?.name).toBe("Ann");
    expect(payload?.exp).toBeGreaterThan(Date.now());
  });

  it("issues unique ids for each mint", async () => {
    const a = await signGuestToken(SECRET, { name: "Ann" });
    const b = await signGuestToken(SECRET, { name: "Ann" });
    expect(a.guestId).not.toBe(b.guestId);
  });

  it("rejects a token signed with a different secret", async () => {
    const { token } = await signGuestToken(SECRET, { name: "Ann" });
    expect(await verifyGuestToken("other-secret", token)).toBeNull();
  });

  it("rejects a tampered payload", async () => {
    const { token } = await signGuestToken(SECRET, { name: "Ann" });
    const [payload, signature] = token.split(".") as [string, string];
    const forged = Buffer.from(
      JSON.stringify({
        gid: "guest-evil",
        name: "Mallory",
        iat: Date.now(),
        exp: Date.now() + GUEST_TOKEN_TTL_MS,
      })
    )
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
    expect(await verifyGuestToken(SECRET, `${forged}.${signature}`)).toBeNull();
    expect(await verifyGuestToken(SECRET, `${payload}.${forged}`)).toBeNull();
  });

  it("rejects a malformed token", async () => {
    expect(await verifyGuestToken(SECRET, "not-a-token")).toBeNull();
    expect(await verifyGuestToken(SECRET, "a.b.c")).toBeNull();
    expect(await verifyGuestToken(SECRET, "")).toBeNull();
  });

  it("rejects an expired token", async () => {
    const realNow = Date.now;
    const past = realNow() - GUEST_TOKEN_TTL_MS - 1000;
    Date.now = () => past;
    const { token } = await signGuestToken(SECRET, { name: "Ann" });
    Date.now = realNow;
    expect(await verifyGuestToken(SECRET, token)).toBeNull();
  });
});
