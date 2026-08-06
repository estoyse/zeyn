import { and, count, desc, eq, gt, ne, or, sql } from "@zeyn/db";
import {
  activeGames,
  gameHistory,
  gamePlayerResults,
  session,
  user,
} from "@zeyn/db/schema";
import { TRPCError } from "@trpc/server";
import z from "zod";

import type { Context } from "../../context";
import { adminProcedure, router } from "../../index";
import { likeTerm, pageInput, recordAudit } from "./_shared";

type Db = Context["db"];

async function requireUser(db: Db, userId: string) {
  const row = await db
    .select({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      banned: user.banned,
    })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1)
    .get();

  if (!row) {
    throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
  }
  return row;
}

async function countOtherAdmins(
  db: Db,
  excludeUserId: string
): Promise<number> {
  const row = await db
    .select({ value: count() })
    .from(user)
    .where(and(eq(user.role, "admin"), ne(user.id, excludeUserId)))
    .get();
  return row?.value ?? 0;
}

export const usersRouter = router({
  list: adminProcedure
    .input(
      pageInput.extend({
        role: z.enum(["user", "admin"]).optional(),
        banned: z.boolean().optional(),
        sort: z.enum(["createdAt", "name", "email"]).default("createdAt"),
      })
    )
    .query(async ({ ctx, input }) => {
      const conditions = [];
      if (input.search) {
        const term = likeTerm(input.search);
        conditions.push(
          or(
            sql`${user.email} LIKE ${term} ESCAPE '\\'`,
            sql`${user.name} LIKE ${term} ESCAPE '\\'`,
            sql`${user.username} LIKE ${term} ESCAPE '\\'`
          )
        );
      }
      if (input.role) conditions.push(eq(user.role, input.role));
      if (input.banned !== undefined) {
        conditions.push(eq(user.banned, input.banned));
      }
      const where = conditions.length ? and(...conditions) : undefined;

      const orderBy =
        input.sort === "name"
          ? user.name
          : input.sort === "email"
            ? user.email
            : desc(user.createdAt);

      const [items, totalRow] = await Promise.all([
        ctx.db
          .select({
            id: user.id,
            name: user.name,
            email: user.email,
            username: user.username,
            image: user.image,
            emailVerified: user.emailVerified,
            role: user.role,
            banned: user.banned,
            banReason: user.banReason,
            banExpires: user.banExpires,
            createdAt: user.createdAt,
          })
          .from(user)
          .where(where)
          .orderBy(orderBy)
          .limit(input.limit)
          .offset(input.offset),
        ctx.db.select({ value: count() }).from(user).where(where).get(),
      ]);

      return {
        items,
        total: totalRow?.value ?? 0,
        limit: input.limit,
        offset: input.offset,
      };
    }),

  get: adminProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const row = await ctx.db
        .select()
        .from(user)
        .where(eq(user.id, input.id))
        .limit(1)
        .get();

      if (!row) {
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      }

      const now = new Date();
      const [sessionRow, hostedRow, playedRow, recentGames] = await Promise.all([
        ctx.db
          .select({ value: count() })
          .from(session)
          .where(and(eq(session.userId, input.id), gt(session.expiresAt, now)))
          .get(),
        ctx.db
          .select({ value: count() })
          .from(gameHistory)
          .where(eq(gameHistory.hostId, input.id))
          .get(),
        ctx.db
          .select({ value: count() })
          .from(gamePlayerResults)
          .where(eq(gamePlayerResults.userId, input.id))
          .get(),
        ctx.db
          .select({
            historyId: gameHistory.id,
            gameId: gameHistory.gameId,
            gameType: gameHistory.gameType,
            createdAt: gameHistory.createdAt,
            score: gamePlayerResults.score,
          })
          .from(gamePlayerResults)
          .innerJoin(gameHistory, eq(gamePlayerResults.gameId, gameHistory.id))
          .where(eq(gamePlayerResults.userId, input.id))
          .orderBy(desc(gameHistory.createdAt))
          .limit(10),
      ]);

      return {
        user: row,
        activeSessions: sessionRow?.value ?? 0,
        hostedGames: hostedRow?.value ?? 0,
        playedGames: playedRow?.value ?? 0,
        recentGames,
      };
    }),

  setRole: adminProcedure
    .input(
      z.object({ userId: z.string(), role: z.enum(["user", "admin"]) })
    )
    .mutation(async ({ ctx, input }) => {
      if (input.userId === ctx.adminId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You cannot change your own role",
        });
      }

      const target = await requireUser(ctx.db, input.userId);

      if (target.role === "admin" && input.role === "user") {
        const others = await countOtherAdmins(ctx.db, input.userId);
        if (others === 0) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Cannot demote the last admin",
          });
        }
      }

      await ctx.db
        .update(user)
        .set({ role: input.role })
        .where(eq(user.id, input.userId));

      await recordAudit(ctx, "user.setRole", "user", input.userId, {
        from: target.role,
        to: input.role,
        email: target.email,
      });
      return { success: true as const };
    }),

  ban: adminProcedure
    .input(
      z.object({
        userId: z.string(),
        reason: z.string().trim().max(280).optional(),
        expiresAt: z.number().int().nullable().default(null),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (input.userId === ctx.adminId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You cannot ban yourself",
        });
      }

      const target = await requireUser(ctx.db, input.userId);

      if (target.role === "admin") {
        const others = await countOtherAdmins(ctx.db, input.userId);
        if (others === 0) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Cannot ban the last admin",
          });
        }
      }

      await ctx.db
        .update(user)
        .set({
          banned: true,
          banReason: input.reason ?? null,
          banExpires: input.expiresAt ? new Date(input.expiresAt) : null,
        })
        .where(eq(user.id, input.userId));

      const revoked = await ctx.db
        .delete(session)
        .where(eq(session.userId, input.userId))
        .returning({ id: session.id });

      await recordAudit(ctx, "user.ban", "user", input.userId, {
        email: target.email,
        reason: input.reason ?? null,
        expiresAt: input.expiresAt,
        revokedSessions: revoked.length,
      });
      return { revokedSessions: revoked.length };
    }),

  unban: adminProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const target = await requireUser(ctx.db, input.userId);

      await ctx.db
        .update(user)
        .set({ banned: false, banReason: null, banExpires: null })
        .where(eq(user.id, input.userId));

      await recordAudit(ctx, "user.unban", "user", input.userId, {
        email: target.email,
      });
      return { success: true as const };
    }),

  revokeSessions: adminProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const target = await requireUser(ctx.db, input.userId);

      const revoked = await ctx.db
        .delete(session)
        .where(eq(session.userId, input.userId))
        .returning({ id: session.id });

      await recordAudit(ctx, "user.revokeSessions", "user", input.userId, {
        email: target.email,
        revokedSessions: revoked.length,
      });
      return { revokedSessions: revoked.length };
    }),

  remove: adminProcedure
    .input(z.object({ userId: z.string(), confirmEmail: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (input.userId === ctx.adminId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You cannot delete your own account",
        });
      }

      const target = await requireUser(ctx.db, input.userId);

      if (input.confirmEmail.trim().toLowerCase() !== target.email.toLowerCase()) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "The confirmation email does not match",
        });
      }

      if (target.role === "admin") {
        const others = await countOtherAdmins(ctx.db, input.userId);
        if (others === 0) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Cannot delete the last admin",
          });
        }
      }

      const hostedRow = await ctx.db
        .select({ value: count() })
        .from(gameHistory)
        .where(eq(gameHistory.hostId, input.userId))
        .get();

      await ctx.db.delete(user).where(eq(user.id, input.userId));

      await recordAudit(ctx, "user.remove", "user", input.userId, {
        email: target.email,
        destroyedHistories: hostedRow?.value ?? 0,
      });
      return { destroyedHistories: hostedRow?.value ?? 0 };
    }),

  liveRoomsFor: adminProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db
        .select({
          id: activeGames.id,
          name: activeGames.name,
          gameType: activeGames.gameType,
          status: activeGames.status,
          createdAt: activeGames.createdAt,
        })
        .from(activeGames)
        .where(eq(activeGames.hostId, input.userId))
        .orderBy(desc(activeGames.createdAt))
        .limit(20);
    }),
});
