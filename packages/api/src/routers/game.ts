import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { roomLimits } from "../game-types";
import { getGameMeta } from "../games";
import { loadResultsDetail } from "../games/results";
import { protectedProcedure, router } from "../index";
import {
  gameHistory,
  gamePlayerResults,
  activeGames,
} from "@shaxsiy-oyin/db/schema";
import { eq, desc, and, lt } from "@shaxsiy-oyin/db";

// Keyset pagination shared by the room/history lists. `cursor` is the
// createdAt (epoch ms) of the last row a client has seen; passing it fetches the
// next page of older rows. Input is optional so callers can omit it entirely.
const listPageInput = z
  .object({
    limit: z.number().int().min(1).max(100).default(50),
    cursor: z.number().int().optional(),
  })
  .optional();

export const gameRouter = router({
  createRoom: protectedProcedure
    .input(
      z.object({
        name: z
          .string()
          .min(roomLimits.nameMinLength)
          .max(roomLimits.nameMaxLength),
        maxPlayers: z
          .number()
          .min(roomLimits.minPlayers)
          .max(roomLimits.maxPlayers)
          .default(roomLimits.defaultMaxPlayers),
        isPublic: z.boolean().default(true),
        password: z.string().optional(),
        gameType: z.string().default("buzzer"),
        config: z.unknown(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const meta = getGameMeta(input.gameType);
      if (!meta) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Unknown game type: ${input.gameType}`,
        });
      }

      const parsedConfig = meta.configSchema.safeParse(input.config);
      if (!parsedConfig.success) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid game configuration",
        });
      }

      const gameId = crypto.randomUUID();

      await ctx.db.insert(activeGames).values({
        id: gameId,
        name: input.name,
        gameType: input.gameType,
        hostId: ctx.session.user.id,
        maxPlayers: input.maxPlayers,
        isPublic: input.isPublic,
        password: input.password || null,
        status: "waiting",
        config: JSON.stringify(parsedConfig.data),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      return { gameId };
    }),

  getPublicRooms: protectedProcedure
    .input(listPageInput)
    .query(async ({ ctx, input }) => {
      const limit = input?.limit ?? 50;
      const where = input?.cursor
        ? and(
            eq(activeGames.isPublic, true),
            lt(activeGames.createdAt, new Date(input.cursor))
          )
        : eq(activeGames.isPublic, true);
      return ctx.db
        .select()
        .from(activeGames)
        .where(where)
        .orderBy(desc(activeGames.createdAt))
        .limit(limit);
    }),

  getRoomConfig: protectedProcedure
    .input(z.object({ gameId: z.string() }))
    .query(async ({ ctx, input }) => {
      const room = await ctx.db
        .select()
        .from(activeGames)
        .where(eq(activeGames.id, input.gameId))
        .get();

      if (!room) return null;

      return {
        ...room,
        config: JSON.parse(room.config) as Record<string, unknown>,
      };
    }),

  getResults: protectedProcedure
    .input(
      z.object({
        gameId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const latestGame = await ctx.db
        .select()
        .from(gameHistory)
        .where(eq(gameHistory.gameId, input.gameId))
        .orderBy(desc(gameHistory.createdAt))
        .limit(1)
        .get();

      if (!latestGame) return null;

      // Platform owns the universal scoreboard (player rows, highest score
      // first); the game-specific detail (buzzer's subject/question grid) is
      // loaded by that game type's own provider. Both are keyed on the
      // game_history primary key and independent, so run them concurrently.
      const [playerResults, detail] = await Promise.all([
        ctx.db
          .select()
          .from(gamePlayerResults)
          .where(eq(gamePlayerResults.gameId, latestGame.id))
          .orderBy(desc(gamePlayerResults.score)),
        loadResultsDetail(ctx.db, latestGame),
      ]);

      return {
        game: latestGame,
        playerResults,
        ...detail,
      };
    }),

  getRoomStatus: protectedProcedure
    .input(z.object({ gameId: z.string() }))
    .query(async ({ ctx, input }) => {
      const room = await ctx.db
        .select({ status: activeGames.status })
        .from(activeGames)
        .where(eq(activeGames.id, input.gameId))
        .get();

      return room?.status || null;
    }),

  getHistory: protectedProcedure
    .input(listPageInput)
    .query(async ({ ctx, input }) => {
      const limit = input?.limit ?? 50;
      const where = input?.cursor
        ? and(
            eq(activeGames.status, "finished"),
            lt(activeGames.createdAt, new Date(input.cursor))
          )
        : eq(activeGames.status, "finished");
      return ctx.db
        .select()
        .from(activeGames)
        .where(where)
        .orderBy(desc(activeGames.createdAt))
        .limit(limit);
    }),
});
