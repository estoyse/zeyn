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
  return {
    session,
    env: context.env as Env,
    db,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
