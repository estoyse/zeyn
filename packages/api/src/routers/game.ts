import { z } from "zod";
import { protectedProcedure, router } from "../index";
import { subjects, gameHistory, gamePlayerResults } from "@shaxsiy-oyin/db/schema";
import { eq, desc } from "@shaxsiy-oyin/db";

export const gameRouter = router({
  getSubjects: protectedProcedure.query(({ ctx }) => {
    return ctx.db.select().from(subjects);
  }),
  createRoom: protectedProcedure
    .input(z.object({
      name: z.string(),
    }))
    .mutation(async ({ ctx: _ctx, input: _input }) => {
      const roomId = crypto.randomUUID();
      return { roomId };
    }),
  getResults: protectedProcedure
    .input(z.object({
      roomId: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      // Get the latest game in this room
      const latestGame = await ctx.db
        .select()
        .from(gameHistory)
        .where(eq(gameHistory.roomId, input.roomId))
        .orderBy(desc(gameHistory.createdAt))
        .limit(1);

      if (!latestGame[0]) return null;

      const results = await ctx.db
        .select()
        .from(gamePlayerResults)
        .where(eq(gamePlayerResults.gameId, latestGame[0].id))
        .orderBy(desc(gamePlayerResults.score));

      return {
        game: latestGame[0],
        results,
      };
    }),
});
