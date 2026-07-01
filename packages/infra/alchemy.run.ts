import alchemy from "alchemy";
import { Vite } from "alchemy/cloudflare";
import { Worker, DurableObjectNamespace } from "alchemy/cloudflare";
import { D1Database } from "alchemy/cloudflare";
import { CloudflareStateStore } from "alchemy/state";
import { config } from "dotenv";

const loadEnvs = () => {
  // Infra-local secrets (e.g. ALCHEMY_PASSWORD); no-ops in CI where the file is
  // absent and the value comes from the environment.
  config({ path: "./.env" });

  // In production, app config comes from the environment -- GitHub Actions
  // secrets in CI, or exported manually for a local prod deploy. Only the local
  // dev .env files are loaded outside production.
  if (process.env.NODE_ENV !== "production") {
    config({ path: "../../apps/web/.env" });
    config({ path: "../../apps/server/.env" });
  }
};

loadEnvs();

const isProduction = process.env.NODE_ENV === "production";

const app = await alchemy("shaxsiy-oyin", {
  // Pin production to a fixed stage so every production deploy -- local or CI --
  // targets the same Cloudflare resources. Alchemy otherwise derives the stage
  // from $USER, so CI (stage "runner") and a laptop (stage "estoyse") each
  // deploy a separate parallel copy of the whole app. An explicit ALCHEMY_STAGE
  // still wins (e.g. to destroy an orphaned stage); non-production keeps the
  // per-user default so `alchemy dev` stays isolated per developer.
  stage: process.env.ALCHEMY_STAGE ?? (isProduction ? "production" : undefined),
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
  // Explicit worker name in production so the URL is `shaxsiy-oyin-web.<sub>.
  // workers.dev` instead of the stage-suffixed `...-web-production`. Non-prod
  // keeps the default (stage-suffixed) name so per-user dev stays isolated.
  name: isProduction ? "shaxsiy-oyin-web" : undefined,
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
  // See `web` above: clean `shaxsiy-oyin-server` name in production.
  name: isProduction ? "shaxsiy-oyin-server" : undefined,
  adopt: true,
  // Runs the exported `scheduled` handler every 15 minutes to sweep abandoned
  // "waiting" rooms (previously piggybacked on GET /).
  crons: ["*/15 * * * *"],
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
