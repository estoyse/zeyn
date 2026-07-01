import { trpcServer } from "@hono/trpc-server";
import { createContext } from "@shaxsiy-oyin/api/context";
import { appRouter } from "@shaxsiy-oyin/api/routers/index";
import { createAuth } from "../../../packages/auth/src";
import { env, type Env } from "@shaxsiy-oyin/env/server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { createD1Db, eq, schema } from "@shaxsiy-oyin/db";

import { GameRoom } from "./durable-objects/GameRoom";

const ABANDONED_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

async function cleanupAbandonedRooms(db: ReturnType<typeof createD1Db>) {
  try {
    const cutoff = new Date(Date.now() - ABANDONED_TIMEOUT_MS);

    const abandoned = await db
      .select()
      .from(schema.activeGames)
      .where(eq(schema.activeGames.status, "waiting"));

    const toDelete = abandoned.filter(
      room => room.createdAt.getTime() < cutoff.getTime()
    );

    if (toDelete.length > 0) {
      for (const room of toDelete) {
        await db
          .delete(schema.activeGames)
          .where(eq(schema.activeGames.id, room.id));
      }
    }
  } catch (e) {
    console.error("Failed to cleanup abandoned rooms:", e);
  }
}

const app = new Hono<{ Bindings: Env }>();

app.all("/game/:id/ws", async c => {
  const id = c.req.param("id");
  const gameRoomEnv = (c.env as any).GAME_ROOM;
  const doId = gameRoomEnv.idFromName(id);
  const stub: any = gameRoomEnv.get(doId);
  const response = await stub.fetch(c.req.raw as any);
  return response;
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

app.get("/", async c => {
  const db = createD1Db(c.env.DB);
  await cleanupAbandonedRooms(db);
  return c.text("OK");
});

export { GameRoom };
export default app;
