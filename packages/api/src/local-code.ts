import { GAME_CODE_ALPHABET, normalizeGameCode, type RandomBytes } from "./game-code";

export const LOCAL_PORT = 47801;
export const LOCAL_CODE_VERSION = 1;
export const LOCAL_CODE_LENGTH = 12;

const LOCAL_CODE_RE = /^[0-9A-HJKMNP-TV-Z]{12}$/;
const IPV4_RE = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;

const VERSION_BITS = 4n;
const IP_BITS = 32n;
const NONCE_BITS = 24n;
const VERSION_SHIFT = IP_BITS + NONCE_BITS;
const IP_MASK = (1n << IP_BITS) - 1n;
const NONCE_MASK = (1n << NONCE_BITS) - 1n;
const MAX_VERSION = Number((1n << VERSION_BITS) - 1n);
const MAX_NONCE = Number(NONCE_MASK);
const NONCE_BYTES = 3;
const NONCE_URL_LENGTH = 5;

export interface LocalRoomAddress {
  version: number;
  ip: string;
  nonce: number;
}

function webRandomBytes(length: number): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(length));
}

function parseIpv4Octets(ip: string): number[] | null {
  if (typeof ip !== "string") return null;

  const match = IPV4_RE.exec(ip);
  if (!match) return null;

  const octets: number[] = [];
  for (let index = 1; index <= 4; index++) {
    const part = match[index];
    if (part === undefined) return null;
    if (part.length > 1 && part.startsWith("0")) return null;

    const octet = Number(part);
    if (!Number.isInteger(octet) || octet < 0 || octet > 255) return null;
    octets.push(octet);
  }

  return octets;
}

function octetsToBits(octets: number[]): bigint {
  let bits = 0n;
  for (const octet of octets) bits = (bits << 8n) | BigInt(octet);
  return bits;
}

function bitsToIpv4(bits: bigint): string {
  const octets: number[] = [];
  for (let shift = 24n; shift >= 0n; shift -= 8n) {
    octets.push(Number((bits >> shift) & 0xffn));
  }
  return octets.join(".");
}

function encodeBase32(value: bigint, length: number): string {
  let remaining = value;
  let out = "";
  for (let index = 0; index < length; index++) {
    const digit = Number(remaining & 31n);
    out = (GAME_CODE_ALPHABET[digit] ?? "0") + out;
    remaining >>= 5n;
  }
  return out;
}

function decodeBase32(text: string): bigint | null {
  let value = 0n;
  for (const char of text) {
    const digit = GAME_CODE_ALPHABET.indexOf(char);
    if (digit < 0) return null;
    value = (value << 5n) | BigInt(digit);
  }
  return value;
}

function assertNonce(nonce: number): void {
  if (!Number.isInteger(nonce) || nonce < 0 || nonce > MAX_NONCE) {
    throw new Error(`Local room nonce must be an integer in [0, ${MAX_NONCE}], got ${nonce}`);
  }
}

export function encodeLocalCode(
  ip: string,
  nonce: number,
  version: number = LOCAL_CODE_VERSION,
): string {
  const octets = parseIpv4Octets(ip);
  if (!octets) throw new Error(`Local room ip must be a dotted-quad IPv4 address, got ${ip}`);

  assertNonce(nonce);

  if (!Number.isInteger(version) || version < 0 || version > MAX_VERSION) {
    throw new Error(`Local code version must be an integer in [0, ${MAX_VERSION}], got ${version}`);
  }

  const packed =
    (BigInt(version) << VERSION_SHIFT) | (octetsToBits(octets) << NONCE_BITS) | BigInt(nonce);

  return encodeBase32(packed, LOCAL_CODE_LENGTH);
}

export function parseLocalCode(raw: string): LocalRoomAddress | null {
  if (typeof raw !== "string") return null;

  const normalized = normalizeGameCode(raw);
  if (!LOCAL_CODE_RE.test(normalized)) return null;

  const packed = decodeBase32(normalized);
  if (packed === null) return null;

  const version = Number(packed >> VERSION_SHIFT);
  if (version !== LOCAL_CODE_VERSION) return null;

  return {
    version,
    ip: bitsToIpv4((packed >> NONCE_BITS) & IP_MASK),
    nonce: Number(packed & NONCE_MASK),
  };
}

export function isLocalCode(raw: string): boolean {
  return parseLocalCode(raw) !== null;
}

export function formatLocalCode(code: string): string {
  if (!isLocalCode(code)) return code;

  const normalized = normalizeGameCode(code);
  return `${normalized.slice(0, 4)}-${normalized.slice(4, 8)}-${normalized.slice(8)}`;
}

export function generateLocalNonce(randomBytes: RandomBytes = webRandomBytes): number {
  const bytes = randomBytes(NONCE_BYTES);
  const high = bytes[0] ?? 0;
  const mid = bytes[1] ?? 0;
  const low = bytes[2] ?? 0;

  return high * 65536 + mid * 256 + low;
}

export function localGuestUrl(address: LocalRoomAddress): string {
  const octets = parseIpv4Octets(address.ip);
  if (!octets) {
    throw new Error(`Local room ip must be a dotted-quad IPv4 address, got ${address.ip}`);
  }

  assertNonce(address.nonce);

  const room = encodeBase32(BigInt(address.nonce), NONCE_URL_LENGTH);
  return `http://${octets.join(".")}:${LOCAL_PORT}/?r=${room}`;
}

const GUEST_URL_RE =
  /^https?:\/\/(\d{1,3}(?:\.\d{1,3}){3})(?::(\d{1,5}))?\/?\?(?:[^#]*&)?r=([^&#]+)/i;

export function parseLocalGuestUrl(url: string): LocalRoomAddress | null {
  if (typeof url !== "string") return null;

  const match = GUEST_URL_RE.exec(url.trim());
  if (!match) return null;

  const [, host, port, room] = match;
  if (port !== undefined && Number(port) !== LOCAL_PORT) return null;

  const octets = parseIpv4Octets(host ?? "");
  if (!octets) return null;

  const normalized = normalizeGameCode(room ?? "");
  if (normalized.length !== NONCE_URL_LENGTH) return null;

  const value = decodeBase32(normalized);
  if (value === null || value > NONCE_MASK) return null;

  return { version: LOCAL_CODE_VERSION, ip: octets.join("."), nonce: Number(value) };
}
