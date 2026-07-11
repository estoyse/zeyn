export interface GuestTokenPayload {
  gid: string;
  name: string;
  iat: number;
  exp: number;
}

export interface GuestToken {
  token: string;
  guestId: string;
}

export const GUEST_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlDecode(value: string): Uint8Array {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(normalized);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function importKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

export async function signGuestToken(
  secret: string,
  input: { name: string }
): Promise<GuestToken> {
  const now = Date.now();
  const guestId = `guest-${crypto.randomUUID()}`;
  const payload: GuestTokenPayload = {
    gid: guestId,
    name: input.name,
    iat: now,
    exp: now + GUEST_TOKEN_TTL_MS,
  };
  const encodedPayload = base64UrlEncode(
    encoder.encode(JSON.stringify(payload))
  );
  const key = await importKey(secret);
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(encodedPayload)
  );
  const token = `${encodedPayload}.${base64UrlEncode(new Uint8Array(signature))}`;
  return { token, guestId };
}

export async function verifyGuestToken(
  secret: string,
  token: string
): Promise<GuestTokenPayload | null> {
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [encodedPayload, encodedSignature] = parts as [string, string];

  let signature: Uint8Array;
  try {
    signature = base64UrlDecode(encodedSignature);
  } catch {
    return null;
  }

  const key = await importKey(secret);
  const valid = await crypto.subtle.verify(
    "HMAC",
    key,
    signature as unknown as ArrayBuffer,
    encoder.encode(encodedPayload)
  );
  if (!valid) return null;

  let payload: GuestTokenPayload;
  try {
    payload = JSON.parse(
      decoder.decode(base64UrlDecode(encodedPayload))
    ) as GuestTokenPayload;
  } catch {
    return null;
  }

  if (typeof payload.gid !== "string" || !payload.gid.startsWith("guest-")) {
    return null;
  }
  if (typeof payload.name !== "string") return null;
  if (typeof payload.exp !== "number" || Date.now() > payload.exp) return null;

  return payload;
}
