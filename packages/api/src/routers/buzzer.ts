import { protectedProcedure, router } from "../index";
import { subjects } from "@zeyn/db/schema";

export const buzzerRouter = router({
  getSubjects: protectedProcedure.query(({ ctx }) => {
    return ctx.db.select().from(subjects);
  }),
});
