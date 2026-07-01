import alchemy from "alchemy";
import { Vite } from "alchemy/cloudflare";
import { Worker, DurableObjectNamespace } from "alchemy/cloudflare";
import { D1Database } from "alchemy/cloudflare";
import { CloudflareStateStore } from "alchemy/state";
import { config } from "dotenv";

const loadEnvs = () => {
  const nodeEnv = process.env.NODE_ENV || "development";
  const isProduction = nodeEnv === "production";

  if (isProduction) {
    config({ path: "./.env" });
    config({ path: "../../apps/web/.env.production" });
    config({ path: "../../apps/server/.env.production" });
  } else {
    config({ path: "./.env" });
    config({ path: "../../apps/web/.env" });
    config({ path: "../../apps/server/.env" });
  }
};

loadEnvs();

const app = await alchemy("shaxsiy-oyin", {
  // Keep deploy state in Cloudflare (a Durable Object) instead of the local,
  // gitignored `.alchemy/` folder, so local and CI deploys share one source of
  // truth. Without this, a fresh CI runner would try to recreate everything.
  stateStore: (scope) =>
    new CloudflareStateStore(scope, {
      apiToken: alchemy.secret(process.env.CLOUDFLARE_API_TOKEN),
      stateToken: alchemy.secret(process.env.ALCHEMY_STATE_TOKEN),
    }),
});

const db = await D1Database("database", {
  migrationsDir: "../../packages/db/src/migrations",
  // Take over the existing D1 database on the first deploy against the remote
  // state store (which starts empty) instead of failing / recreating it.
  adopt: true,
});

export const web = await Vite("web", {
  cwd: "../../apps/web",
  assets: "dist",
  adopt: true,
  bindings: {
    VITE_SERVER_URL: alchemy.env.VITE_SERVER_URL!,
  },
});

export const server = await Worker("server", {
  cwd: "../../apps/server",
  entrypoint: "src/index.ts",
  compatibility: "node",
  compatibilityDate: "2024-09-23",
  adopt: true,
  bindings: {
    GAME_ROOM: DurableObjectNamespace("game_room", {
      className: "GameRoom",
      sqlite: true,
    }),
    DB: db,
    CORS_ORIGIN: alchemy.env.CORS_ORIGIN!,
    BETTER_AUTH_SECRET: alchemy.secret.env.BETTER_AUTH_SECRET!,
    BETTER_AUTH_URL: alchemy.env.BETTER_AUTH_URL!,
    NODE_ENV: process.env.NODE_ENV!,
  },
  dev: {
    port: 3000,
  },
});

console.log(`Web    -> ${web.url}`);
console.log(`Server -> ${server.url}`);

await app.finalize();
