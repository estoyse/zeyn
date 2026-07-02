import { protectedProcedure, publicProcedure, router } from "../index";
import { gameRouter } from "./game";
import { buzzerRouter } from "./buzzer";

export const appRouter = router({
  healthCheck: publicProcedure.query(() => {
    return "OK";
  }),
  game: gameRouter,
  buzzer: buzzerRouter,
  privateData: protectedProcedure.query(({ ctx }) => {
    return {
      message: "This is private",
      user: ctx.session.user,
    };
  }),
});
export type AppRouter = typeof appRouter;
