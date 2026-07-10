export const GAME_CODE_ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
export const GAME_CODE_LENGTH = 8;

const CODE_RE = /^[0-9A-HJKMNP-TV-Z]{8}$/;
const UUID_RE =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

export function generateGameCode(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(GAME_CODE_LENGTH));
  let out = "";
  for (const byte of bytes) out += GAME_CODE_ALPHABET[byte % 32];
  return out;
}

export function isGameCode(value: string): boolean {
  return CODE_RE.test(value);
}

export function isGameUuid(value: string): boolean {
  return UUID_RE.test(value);
}

export function normalizeGameCode(raw: string): string {
  return raw
    .toUpperCase()
    .replace(/[IL]/g, "1")
    .replace(/O/g, "0")
    .replace(/[^0-9A-Z]/g, "");
}

export function canonicalizeGameId(raw: string): string {
  let value = raw.trim();

  if (value.includes("/")) {
    const withoutQuery = value.split(/[?#]/)[0] ?? "";
    value = withoutQuery.split("/").filter(Boolean).at(-1) ?? "";
  }

  if (isGameUuid(value)) return value;

  const normalized = normalizeGameCode(value);
  return isGameCode(normalized) ? normalized : raw;
}

export function formatGameCode(code: string): string {
  return isGameCode(code) ? `${code.slice(0, 4)} ${code.slice(4)}` : code;
}
