import { env } from "@shaxsiy-oyin/env/server";
import { drizzle } from "drizzle-orm/d1";

import * as schema from "./schema";

/**
 * Create a Drizzle client for a D1 database. Pass an explicit binding when one
 * is in hand (e.g. inside a Durable Object via `this.env.DB`, or a Hono handler
 * via `c.env.DB`); it defaults to the ambient Worker `env.DB` for request-scoped
 * callers such as the tRPC context and auth.
 */
export function createDb(binding: typeof env.DB = env.DB) {
  return drizzle(binding, { schema });
}

export * from "drizzle-orm";
export { schema };
