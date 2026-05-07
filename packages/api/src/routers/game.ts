import { z } from "zod";
import { protectedProcedure, router } from "../index";
import {
  subjects,
  gameHistory,
  gamePlayerResults,
  activeRooms,
  questions,
  gameQuestionResults,
} from "@shaxsiy-oyin/db/schema";
import { eq, desc, and } from "@shaxsiy-oyin/db";

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
      const roomId = crypto.randomUUID();

      await ctx.db.insert(activeRooms).values({
        id: roomId,
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

      return { roomId };
    }),

  getPublicRooms: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db
      .select()
      .from(activeRooms)
      .where(
        and(eq(activeRooms.isPublic, true), eq(activeRooms.status, "waiting"))
      )
      .orderBy(desc(activeRooms.createdAt));
  }),

  getRoomConfig: protectedProcedure
    .input(z.object({ roomId: z.string() }))
    .query(async ({ ctx, input }) => {
      const room = await ctx.db
        .select()
        .from(activeRooms)
        .where(eq(activeRooms.id, input.roomId))
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
        roomId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      // Get the latest game in this room
      console.log("Fetching latest game for room:", input.roomId);
      const latestGame = await ctx.db
        .select()
        .from(gameHistory)
        .where(eq(gameHistory.roomId, input.roomId))
        .orderBy(desc(gameHistory.createdAt))
        .limit(1)
        .get();

      console.log("Latest game:", latestGame);

      if (!latestGame) return null;

      const playerResults = await ctx.db
        .select()
        .from(gamePlayerResults)
        .where(eq(gamePlayerResults.gameId, latestGame.roomId))
        .orderBy(desc(gamePlayerResults.score));

      console.log("Player results:", playerResults);

      const questionResults = await ctx.db
        .select({
          userId: gameQuestionResults.userId,
          questionId: gameQuestionResults.questionId,
          correct: gameQuestionResults.correct,
          pointsAwarded: gameQuestionResults.pointsAwarded,
          points: questions.points,
        })
        .from(gameQuestionResults)
        .innerJoin(questions, eq(gameQuestionResults.questionId, questions.id))
        .where(eq(gameQuestionResults.gameId, latestGame.id));

      return {
        game: latestGame,
        playerResults,
        questionResults,
      };
    }),

  getRoomStatus: protectedProcedure
    .input(z.object({ roomId: z.string() }))
    .query(async ({ ctx, input }) => {
      const room = await ctx.db
        .select({ status: activeRooms.status })
        .from(activeRooms)
        .where(eq(activeRooms.id, input.roomId))
        .get();

      return room?.status || null;
    }),

  getHistory: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db
      .select()
      .from(activeRooms)
      .where(eq(activeRooms.status, "finished"))
      .orderBy(desc(activeRooms.createdAt));
  }),
});
