import { trpcServer } from "@hono/trpc-server";
import { createContext } from "@shaxsiy-oyin/api/context";
import { appRouter } from "@shaxsiy-oyin/api/routers/index";
import { createAuth } from "@shaxsiy-oyin/auth";
import { env, type Env } from "@shaxsiy-oyin/env/server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";

import { GameRoom } from "./durable-objects/GameRoom";

const app = new Hono<{ Bindings: Env }>();

app.use(logger());
app.use(
  "/*",
  cors({
    origin: env.CORS_ORIGIN,
    allowMethods: ["GET", "POST", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }),
);

app.on(["POST", "GET"], "/api/auth/*", (c) => createAuth().handler(c.req.raw));

app.use(
  "/trpc/*",
  trpcServer({
    router: appRouter,
    createContext: (_opts, context) => {
      return createContext({ context });
    },
  }),
);

app.get("/game/:id/ws", (c) => {
  const id = c.req.param("id");
  const doId = c.env.GAME_ROOM.idFromName(id);
  const stub = c.env.GAME_ROOM.get(doId);
  return stub.fetch(c.req.raw);
});

app.get("/", (c) => {
  return c.text("OK");
});

export { GameRoom };
export default app;
