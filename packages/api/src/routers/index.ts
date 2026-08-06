import { protectedProcedure, publicProcedure, router } from "../index";
import { adminRouter } from "./admin";
import { gameRouter } from "./game";
import { buzzerRouter } from "./buzzer";
import { musicRouter } from "./music";
import { profileRouter } from "./profile";

export const appRouter = router({
  healthCheck: publicProcedure.query(() => {
    return "OK";
  }),
  admin: adminRouter,
  game: gameRouter,
  buzzer: buzzerRouter,
  music: musicRouter,
  profile: profileRouter,
  privateData: protectedProcedure.query(({ ctx }) => {
    return {
      message: "This is private",
      user: ctx.session.user,
    };
  }),
});
export type AppRouter = typeof appRouter;
