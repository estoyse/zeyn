import { and, eq, isNull } from "@zeyn/db";
import { user } from "@zeyn/db/schema";
import { createDb } from "@zeyn/db";

type Db = ReturnType<typeof createDb>;

export const USERNAME_MIN = 3;
export const USERNAME_MAX = 20;

const USERNAME_RE = /^[a-z0-9_]+$/;

const RESERVED = new Set([
  "admin",
  "administrator",
  "api",
  "auth",
  "about",
  "buzzer",
  "dashboard",
  "edit",
  "game",
  "games",
  "help",
  "login",
  "logout",
  "me",
  "music",
  "new",
  "play",
  "privacy",
  "profile",
  "profiles",
  "root",
  "settings",
  "signin",
  "signup",
  "support",
  "terms",
  "u",
  "user",
  "users",
  "zeyn",
]);

export type UsernameCheck =
  | { ok: true; value: string }
  | { ok: false; reason: string };

export function validateUsername(raw: string): UsernameCheck {
  const value = raw.trim().toLowerCase();
  if (value.length < USERNAME_MIN) {
    return { ok: false, reason: `Must be at least ${USERNAME_MIN} characters.` };
  }
  if (value.length > USERNAME_MAX) {
    return { ok: false, reason: `Must be at most ${USERNAME_MAX} characters.` };
  }
  if (!USERNAME_RE.test(value)) {
    return { ok: false, reason: "Only lowercase letters, numbers, and underscores." };
  }
  if (RESERVED.has(value)) {
    return { ok: false, reason: "That username is reserved." };
  }
  return { ok: true, value };
}

function slugifyName(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, USERNAME_MAX);
}

function randomSuffix(length: number): string {
  const alphabet = "abcdefghijklmnopqrstuvwxyz0123456789";
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  let out = "";
  for (const byte of bytes) out += alphabet[byte % alphabet.length];
  return out;
}

export async function isUsernameTaken(
  db: Db,
  username: string,
  exceptUserId?: string
): Promise<boolean> {
  const existing = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.username, username))
    .limit(1)
    .get();
  if (!existing) return false;
  return existing.id !== exceptUserId;
}

export async function generateUniqueUsername(
  db: Db,
  name: string
): Promise<string> {
  let base = slugifyName(name);
  if (base.length < USERNAME_MIN) base = `user${randomSuffix(3)}`;

  if (!(await isUsernameTaken(db, base))) return base;

  for (let attempt = 0; attempt < 10; attempt++) {
    const suffix = randomSuffix(4);
    const trimmed = base.slice(0, USERNAME_MAX - suffix.length - 1);
    const candidate = `${trimmed}_${suffix}`;
    if (!(await isUsernameTaken(db, candidate))) return candidate;
  }

  return `user_${randomSuffix(8)}`;
}

export async function ensureUsername(
  db: Db,
  userId: string,
  name: string,
  current: string | null
): Promise<string> {
  if (current) return current;

  const generated = await generateUniqueUsername(db, name);
  await db
    .update(user)
    .set({ username: generated })
    .where(and(eq(user.id, userId), isNull(user.username)));

  const row = await db
    .select({ username: user.username })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1)
    .get();

  return row?.username ?? generated;
}
