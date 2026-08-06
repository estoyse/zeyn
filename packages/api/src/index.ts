import { initTRPC, TRPCError } from "@trpc/server";
import { eq } from "@zeyn/db";
import { user } from "@zeyn/db/schema";

import type { Context } from "./context";

export const t = initTRPC.context<Context>().create();

export const router = t.router;

export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.session) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Authentication required",
      cause: "No session",
    });
  }
  return next({
    ctx: {
      ...ctx,
      session: ctx.session,
    },
  });
});

export const adminProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  const actorId = ctx.session.user.id;
  const row = await ctx.db
    .select({ role: user.role, banned: user.banned })
    .from(user)
    .where(eq(user.id, actorId))
    .limit(1)
    .get();

  if (!row || row.banned || row.role !== "admin") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Admin access required",
    });
  }

  return next({
    ctx: {
      ...ctx,
      adminId: actorId,
    },
  });
});
