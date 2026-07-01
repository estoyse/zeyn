import { z } from "zod";
import { protectedProcedure, router } from "../index";
import {
  subjects,
  gameHistory,
  gamePlayerResults,
  activeGames,
  gameQuestionResults,
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
  getSubjects: protectedProcedure.query(({ ctx }) => {
    return ctx.db.select().from(subjects);
  }),

  createRoom: protectedProcedure
    .input(
      z.object({
        name: z.string().min(3).max(50),
        maxPlayers: z.number().min(2).max(20).default(10),
        isPublic: z.boolean().default(true),
        password: z.string().optional(),
        subjectIds: z.array(z.string()).min(5).max(10),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const gameId = crypto.randomUUID();

      await ctx.db.insert(activeGames).values({
        id: gameId,
        name: input.name,
        hostId: ctx.session.user.id,
        maxPlayers: input.maxPlayers,
        isPublic: input.isPublic,
        password: input.password || null,
        status: "waiting",
        subjectIds: JSON.stringify(input.subjectIds),
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
        subjectIds: JSON.parse(room.subjectIds) as string[],
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

      // Results rows are keyed on the game_history primary key (latestGame.id),
      // not the room's gameId. The player/question queries are independent, so
      // run them concurrently. Player rows come back sorted highest score first.
      const [playerResults, questionResults] = await Promise.all([
        ctx.db
          .select()
          .from(gamePlayerResults)
          .where(eq(gamePlayerResults.gameId, latestGame.id))
          .orderBy(desc(gamePlayerResults.score)),
        ctx.db
          .select({
            userId: gameQuestionResults.userId,
            subjectName: gameQuestionResults.subjectName,
            subjectPosition: gameQuestionResults.subjectPosition,
            questionPosition: gameQuestionResults.questionPosition,
            correct: gameQuestionResults.correct,
            pointsAwarded: gameQuestionResults.pointsAwarded,
          })
          .from(gameQuestionResults)
          .where(eq(gameQuestionResults.gameId, latestGame.id)),
      ]);

      const subjects = JSON.parse(latestGame.subjects) as string[];

      return {
        game: latestGame,
        subjects,
        playerResults,
        questionResults,
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
