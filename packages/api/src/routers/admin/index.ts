import { eq } from "@zeyn/db";
import { user } from "@zeyn/db/schema";

import { adminProcedure, router } from "../../index";
import { contentRouter } from "./content";
import { musicRouter } from "./music";

export const adminRouter = router({
  content: contentRouter,
  music: musicRouter,
  whoami: adminProcedure.query(async ({ ctx }) => {
    const row = await ctx.db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        username: user.username,
        image: user.image,
        role: user.role,
      })
      .from(user)
      .where(eq(user.id, ctx.adminId))
      .limit(1)
      .get();

    return row ?? null;
  }),
});
