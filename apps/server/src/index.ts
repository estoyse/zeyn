import { trpcServer } from "@hono/trpc-server";
import { createContext } from "@shaxsiy-oyin/api/context";
import { appRouter } from "@shaxsiy-oyin/api/routers/index";
import { createAuth } from "@shaxsiy-oyin/auth";
import { env, type Env } from "@shaxsiy-oyin/env/server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { createDb, and, eq, lt, schema } from "@shaxsiy-oyin/db";

import { GameRoom } from "./durable-objects/GameRoom";

const ABANDONED_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

// Delete rooms still in "waiting" past the abandonment window. The age filter
// runs in SQL (single DELETE) rather than fetching every waiting room and
// filtering/deleting row-by-row in JS, so it stays cheap as rooms accumulate.
async function cleanupAbandonedRooms(db: ReturnType<typeof createDb>) {
  try {
    const cutoff = new Date(Date.now() - ABANDONED_TIMEOUT_MS);
    await db
      .delete(schema.activeGames)
      .where(
        and(
          eq(schema.activeGames.status, "waiting"),
          lt(schema.activeGames.createdAt, cutoff)
        )
      );
  } catch (e) {
    console.error("Failed to cleanup abandoned rooms:", e);
  }
}

const app = new Hono<{ Bindings: Env }>();

app.all("/game/:id/ws", c => {
  const id = c.req.param("id");
  // Cast to the base namespace interface: the typed DurableObjectNamespace<
  // GameRoom> pulls the DO's whole RPC surface into the type and blows past
  // tsc's instantiation depth. idFromName/get/fetch exist on the base type.
  const ns = c.env.GAME_ROOM as DurableObjectNamespace;
  const stub = ns.get(ns.idFromName(id));
  return stub.fetch(c.req.raw);
});

app.use(logger());
app.use(
  "/*",
  cors({
    origin: env.CORS_ORIGIN,
    allowMethods: ["GET", "POST", "OPTIONS", "PUT", "DELETE", "PATCH"],
    allowHeaders: ["Content-Type", "Authorization", "Upgrade"],
    credentials: true,
  })
);

app.on(["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"], "/api/auth/*", c =>
  createAuth().handler(c.req.raw)
);

app.use(
  "/trpc/*",
  trpcServer({
    router: appRouter,
    createContext: (_opts, context) => {
      return createContext({ context });
    },
  })
);

app.get("/", c => c.text("OK"));

// Cloudflare Cron Trigger: periodically sweep abandoned "waiting" rooms. This
// used to run on every GET / (an unauthenticated request doing unbounded work);
// it now runs on a schedule configured via `crons` on the Worker in
// packages/infra/alchemy.run.ts.
async function scheduled(_controller: ScheduledController, workerEnv: Env) {
  await cleanupAbandonedRooms(createDb(workerEnv.DB));
}

export { GameRoom };
export default {
  fetch: app.fetch,
  scheduled,
};
