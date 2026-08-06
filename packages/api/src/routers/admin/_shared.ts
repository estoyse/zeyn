import { and, eq, or, sql } from "@zeyn/db";
import type { SQLiteColumn } from "drizzle-orm/sqlite-core";
import { activeGames, adminAuditLog } from "@zeyn/db/schema";
import { TRPCError } from "@trpc/server";
import z from "zod";

import type { Context } from "../../context";

export const D1_MAX_PARAMS_PER_QUERY = 99;

export function rowsPerStatement(columns: number): number {
  return Math.max(1, Math.floor(D1_MAX_PARAMS_PER_QUERY / Math.max(1, columns)));
}

export function chunk<T>(items: T[], size: number): T[][] {
  const maxPerChunk = Math.max(1, Math.floor(size));
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += maxPerChunk) {
    chunks.push(items.slice(i, i + maxPerChunk));
  }
  return chunks;
}

export const pageInput = z.object({
  search: z.string().trim().max(100).optional(),
  limit: z.number().int().min(1).max(100).default(50),
  offset: z.number().int().min(0).default(0),
});

export type PageInput = z.infer<typeof pageInput>;

export interface Page<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
}

export const cursorInput = z.object({
  limit: z.number().int().min(1).max(100).default(50),
  cursor: z.number().int().optional(),
});

export function likeTerm(search: string): string {
  return `%${search.replace(/[\\%_]/g, match => `\\${match}`)}%`;
}

export function searchLike(column: SQLiteColumn, search: string) {
  return sql`${column} LIKE ${likeTerm(search)} ESCAPE '\'`;
}

type AdminContext = Context & { adminId: string };

export async function recordAudit(
  ctx: AdminContext,
  action: string,
  targetType: string,
  targetId: string | null,
  metadata: Record<string, unknown> = {}
): Promise<void> {
  await ctx.db.insert(adminAuditLog).values({
    id: crypto.randomUUID(),
    actorId: ctx.adminId,
    action,
    targetType,
    targetId,
    metadata: JSON.stringify(metadata),
    createdAt: new Date(),
  });
}

export function isReferencedByConfig(configJson: string, id: string): boolean {
  if (!configJson || !id) return false;
  let parsed: unknown;
  try {
    parsed = JSON.parse(configJson);
  } catch {
    return false;
  }
  return containsId(parsed, id);
}

function containsId(value: unknown, id: string): boolean {
  if (typeof value === "string") return value === id;
  if (Array.isArray(value)) return value.some(item => containsId(item, id));
  if (value && typeof value === "object") {
    return Object.values(value).some(item => containsId(item, id));
  }
  return false;
}

export async function assertNotUsedByLiveRoom(
  ctx: AdminContext,
  id: string,
  label: string
): Promise<void> {
  const candidates = await ctx.db
    .select({ id: activeGames.id, name: activeGames.name, config: activeGames.config })
    .from(activeGames)
    .where(
      and(
        or(
          eq(activeGames.status, "waiting"),
          eq(activeGames.status, "playing")
        ),
        sql`instr(${activeGames.config}, ${id}) > 0`
      )
    );

  const inUse = candidates.filter(room => isReferencedByConfig(room.config, id));
  if (inUse.length === 0) return;

  const names = inUse
    .slice(0, 3)
    .map(room => room.name)
    .join(", ");
  throw new TRPCError({
    code: "CONFLICT",
    message: `This ${label} is in use by ${inUse.length} live room(s): ${names}`,
  });
}

export function assertForceWhenChildrenExist(
  childCount: number,
  force: boolean,
  message: (count: number) => string
): void {
  if (childCount > 0 && !force) {
    throw new TRPCError({
      code: "CONFLICT",
      message: message(childCount),
    });
  }
}
