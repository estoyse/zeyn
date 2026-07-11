import { trpcServer } from "@hono/trpc-server";
import { createContext } from "@zeyn/api/context";
import { appRouter } from "@zeyn/api/routers/index";
import { createAuth } from "@zeyn/auth";
import { parseOrigins } from "@zeyn/auth/origins";
import { verifyGuestToken } from "@zeyn/api/guest-token";
import { env, type Env } from "@zeyn/env/server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { createDb, and, eq, lt, schema } from "@zeyn/db";

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

app.all("/game/:id/ws", async c => {
  const id = c.req.param("id");
  const url = new URL(c.req.url);
  const session = await createAuth().api.getSession({
    headers: c.req.raw.headers,
  });
  // Cast to the base namespace interface: the typed DurableObjectNamespace<
  // GameRoom> pulls the DO's whole RPC surface into the type and blows past
  // tsc's instantiation depth. idFromName/get/fetch exist on the base type.
  const ns = c.env.GAME_ROOM as DurableObjectNamespace;
  const stub = ns.get(ns.idFromName(id));
  const headers = new Headers(c.req.raw.headers);
  headers.delete("x-user-id");
  headers.delete("x-guest");
  headers.delete("x-role");
  headers.delete("x-user-name");

  if (session?.user?.id) {
    headers.set("x-user-id", session.user.id);
    headers.set("x-role", "player");
    if (session.user.name) {
      headers.set("x-user-name", encodeURIComponent(session.user.name));
    }
  } else {
    const guestToken = url.searchParams.get("guest");
    const payload = guestToken
      ? await verifyGuestToken(c.env.BETTER_AUTH_SECRET, guestToken)
      : null;
    if (payload) {
      headers.set("x-user-id", payload.gid);
      headers.set("x-guest", "1");
      headers.set("x-role", "player");
      headers.set("x-user-name", encodeURIComponent(payload.name));
    } else {
      headers.set("x-role", "spectator");
    }
  }
  return stub.fetch(new Request(c.req.raw, { headers }));
});

app.use(logger());
app.use(
  "/*",
  cors({
    origin: parseOrigins(env.CORS_ORIGIN),
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
