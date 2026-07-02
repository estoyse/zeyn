import { protectedProcedure, publicProcedure, router } from "../index";
import { gameRouter } from "./game";
import { buzzerRouter } from "./buzzer";
import { musicRouter } from "./music";

export const appRouter = router({
  healthCheck: publicProcedure.query(() => {
    return "OK";
  }),
  game: gameRouter,
  buzzer: buzzerRouter,
  music: musicRouter,
  privateData: protectedProcedure.query(({ ctx }) => {
    return {
      message: "This is private",
      user: ctx.session.user,
    };
  }),
});
export type AppRouter = typeof appRouter;
