import { protectedProcedure, router } from "../index";
import { artists } from "@zeyn/db/schema";

export const musicRouter = router({
  getArtists: protectedProcedure.query(({ ctx }) => {
    return ctx.db.select().from(artists);
  }),
});
