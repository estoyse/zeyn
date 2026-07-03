import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { desc, eq, sql } from "@zeyn/db";
import { createDb } from "@zeyn/db";
import {
  user,
  gameHistory,
  gamePlayerResults,
  activeGames,
} from "@zeyn/db/schema";
import { protectedProcedure, publicProcedure, router } from "../index";
import {
  ensureUsername,
  isUsernameTaken,
  validateUsername,
} from "@zeyn/auth/username";

type Db = ReturnType<typeof createDb>;

const PROFILE_LIST_LIMIT = 10;

const playerCountExpr = sql<number>`(select count(*) from ${gamePlayerResults} where ${gamePlayerResults.gameId} = ${gameHistory.id})`.mapWith(
  Number
);

async function loadStats(db: Db, userId: string) {
  const played = await db
    .select({
      gamesPlayed: sql<number>`count(*)`.mapWith(Number),
      bestScore: sql<number>`coalesce(max(${gamePlayerResults.score}), 0)`.mapWith(Number),
      totalScore: sql<number>`coalesce(sum(${gamePlayerResults.score}), 0)`.mapWith(Number),
    })
    .from(gamePlayerResults)
    .where(eq(gamePlayerResults.userId, userId))
    .get();

  const hosted = await db
    .select({ gamesHosted: sql<number>`count(*)`.mapWith(Number) })
    .from(gameHistory)
    .where(eq(gameHistory.hostId, userId))
    .get();

  return {
    gamesPlayed: played?.gamesPlayed ?? 0,
    bestScore: played?.bestScore ?? 0,
    totalScore: played?.totalScore ?? 0,
    gamesHosted: hosted?.gamesHosted ?? 0,
  };
}

export const profileRouter = router({
  getByUsername: publicProcedure
    .input(z.object({ username: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const target = await ctx.db
        .select()
        .from(user)
        .where(eq(user.username, input.username.toLowerCase()))
        .limit(1)
        .get();

      if (!target) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Profile not found" });
      }

      const isOwner = ctx.session?.user?.id === target.id;

      if (!target.isProfilePublic && !isOwner) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Profile not found" });
      }

      const showStats = target.showStats || isOwner;
      const showHistory = target.showHistory || isOwner;
      const showHostedGames = target.showHostedGames || isOwner;

      const [stats, history, hostedGames] = await Promise.all([
        showStats ? loadStats(ctx.db, target.id) : Promise.resolve(null),
        showHistory
          ? ctx.db
              .select({
                historyId: gameHistory.id,
                gameId: gameHistory.gameId,
                gameType: gameHistory.gameType,
                roomName: activeGames.name,
                createdAt: gameHistory.createdAt,
                score: gamePlayerResults.score,
                playerCount: playerCountExpr,
              })
              .from(gamePlayerResults)
              .innerJoin(
                gameHistory,
                eq(gamePlayerResults.gameId, gameHistory.id)
              )
              .leftJoin(activeGames, eq(activeGames.id, gameHistory.gameId))
              .where(eq(gamePlayerResults.userId, target.id))
              .orderBy(desc(gameHistory.createdAt))
              .limit(PROFILE_LIST_LIMIT)
          : Promise.resolve(null),
        showHostedGames
          ? ctx.db
              .select({
                historyId: gameHistory.id,
                gameId: gameHistory.gameId,
                gameType: gameHistory.gameType,
                roomName: activeGames.name,
                createdAt: gameHistory.createdAt,
                playerCount: playerCountExpr,
              })
              .from(gameHistory)
              .leftJoin(activeGames, eq(activeGames.id, gameHistory.gameId))
              .where(eq(gameHistory.hostId, target.id))
              .orderBy(desc(gameHistory.createdAt))
              .limit(PROFILE_LIST_LIMIT)
          : Promise.resolve(null),
      ]);

      return {
        isOwner,
        user: {
          id: target.id,
          name: target.name,
          username: target.username,
          image: target.image,
          bio: target.bio,
          createdAt: target.createdAt,
          isProfilePublic: target.isProfilePublic,
          showStats: target.showStats,
          showHistory: target.showHistory,
          showHostedGames: target.showHostedGames,
        },
        stats,
        history,
        hostedGames,
      };
    }),

  getMe: protectedProcedure.query(async ({ ctx }) => {
    const me = await ctx.db
      .select()
      .from(user)
      .where(eq(user.id, ctx.session.user.id))
      .limit(1)
      .get();

    if (!me) {
      throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
    }

    const username = await ensureUsername(
      ctx.db,
      me.id,
      me.name,
      me.username
    );

    return {
      id: me.id,
      name: me.name,
      email: me.email,
      username,
      image: me.image,
      bio: me.bio,
      isProfilePublic: me.isProfilePublic,
      showStats: me.showStats,
      showHistory: me.showHistory,
      showHostedGames: me.showHostedGames,
    };
  }),

  checkUsername: publicProcedure
    .input(z.object({ username: z.string() }))
    .query(async ({ ctx, input }) => {
      const result = validateUsername(input.username);
      if (!result.ok) return { available: false, reason: result.reason };

      const taken = await isUsernameTaken(
        ctx.db,
        result.value,
        ctx.session?.user?.id
      );
      if (taken) return { available: false, reason: "That username is taken." };

      return { available: true };
    }),

  updateProfile: protectedProcedure
    .input(
      z.object({
        name: z.string().trim().min(1).max(60).optional(),
        username: z.string().optional(),
        bio: z.string().trim().max(280).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const updates: Record<string, unknown> = {};

      if (input.name !== undefined) updates.name = input.name;
      if (input.bio !== undefined) updates.bio = input.bio;

      if (input.username !== undefined) {
        const result = validateUsername(input.username);
        if (!result.ok) {
          throw new TRPCError({ code: "BAD_REQUEST", message: result.reason });
        }
        const taken = await isUsernameTaken(
          ctx.db,
          result.value,
          ctx.session.user.id
        );
        if (taken) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "That username is taken.",
          });
        }
        updates.username = result.value;
      }

      if (Object.keys(updates).length > 0) {
        await ctx.db
          .update(user)
          .set(updates)
          .where(eq(user.id, ctx.session.user.id));
      }

      return { success: true };
    }),

  updatePrivacy: protectedProcedure
    .input(
      z.object({
        isProfilePublic: z.boolean().optional(),
        showStats: z.boolean().optional(),
        showHistory: z.boolean().optional(),
        showHostedGames: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const updates: Record<string, unknown> = {};
      if (input.isProfilePublic !== undefined)
        updates.isProfilePublic = input.isProfilePublic;
      if (input.showStats !== undefined) updates.showStats = input.showStats;
      if (input.showHistory !== undefined)
        updates.showHistory = input.showHistory;
      if (input.showHostedGames !== undefined)
        updates.showHostedGames = input.showHostedGames;

      if (Object.keys(updates).length > 0) {
        await ctx.db
          .update(user)
          .set(updates)
          .where(eq(user.id, ctx.session.user.id));
      }

      return { success: true };
    }),

  deleteAccount: protectedProcedure.mutation(async ({ ctx }) => {
    await ctx.db.delete(user).where(eq(user.id, ctx.session.user.id));
    return { success: true };
  }),
});
