import { createAuth } from "@zeyn/auth";
import type { Context as HonoContext } from "hono";
import { type Env } from "@zeyn/env/server";

import { createDb } from "@zeyn/db";

export type CreateContextOptions = {
  context: HonoContext;
};

export async function createContext({ context }: CreateContextOptions) {
  const session = await createAuth().api.getSession({
    headers: context.req.raw.headers,
  });
  const db = createDb();
  const env = context.env as Env;
  return {
    session,
    env,
    db,
    clientIp: context.req.header("cf-connecting-ip") ?? null,
    guestTokenLimiter: env.GUEST_TOKEN_LIMITER ?? null,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
