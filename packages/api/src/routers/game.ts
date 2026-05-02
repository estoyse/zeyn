import { z } from "zod";
import { protectedProcedure, router } from "../index";
import { subjects } from "@shaxsiy-oyin/db/schema";

export const gameRouter = router({
  getSubjects: protectedProcedure.query(({ ctx }) => {
    return ctx.db.select().from(subjects);
  }),
  createRoom: protectedProcedure
    .input(z.object({
      name: z.string(),
    }))
    .mutation(async ({ ctx: _ctx, input: _input }) => {
      // For now, room creation is client-side UUID generation, 
      // but we could store metadata here if we wanted.
      const roomId = crypto.randomUUID();
      return { roomId };
    }),
});
