import { env } from "@shaxsiy-oyin/env/server";
import { drizzle } from "drizzle-orm/d1";

import * as schema from "./schema";

export function createDb() {
  return drizzle(env.DB, { schema });
}

export * from "drizzle-orm";
export { drizzle as createD1Db } from "drizzle-orm/d1";
export { schema };
