import alchemy from "alchemy";
import { Vite } from "alchemy/cloudflare";
import { Worker, DurableObjectNamespace } from "alchemy/cloudflare";
import { D1Database } from "alchemy/cloudflare";
import { CloudflareStateStore } from "alchemy/state";
import { config } from "dotenv";

const isProduction = process.env.NODE_ENV === "production";
const isDevDeploy =
  !isProduction &&
  process.env.ALCHEMY_STAGE === "dev" &&
  !process.argv.includes("destroy");

const loadEnvs = () => {
  config({ path: "./.env" });
  // Production config comes from the environment (CI secrets); load dev .env
  // files only outside production.
  if (isProduction) return;
  config({ path: "../../apps/web/.env" });
  config({ path: "../../apps/server/.env" });
  if (process.env.ALCHEMY_STAGE === "dev") {
    config({ path: "../../apps/web/.env.deploy", override: true });
    config({ path: "../../apps/server/.env.deploy", override: true });
  }
};

loadEnvs();

if (isDevDeploy) {
  const stillLocal = ["VITE_SERVER_URL", "CORS_ORIGIN", "BETTER_AUTH_URL"].filter(
    (key) => !process.env[key] || process.env[key]!.includes("localhost"),
  );
  if (stillLocal.length) {
    throw new Error(
      `deploy:dev needs deployed URLs, but ${stillLocal.join(", ")} still point at localhost. ` +
        `Set them in apps/web/.env.deploy and apps/server/.env.deploy (see the .env.deploy.example files).`,
    );
  }
}

const hasRemoteState =
  !!process.env.CLOUDFLARE_API_TOKEN && !!process.env.ALCHEMY_STATE_TOKEN;

const app = await alchemy("shaxsiy-oyin", {
  // Alchemy derives the stage from $USER; pin it so CI and local deploys target
  // the same resources instead of separate per-user copies.
  stage: process.env.ALCHEMY_STAGE ?? (isProduction ? "production" : undefined),
  // Remote state so local and CI deploys share one source of truth. Falls back
  // to the local `.alchemy/` file store when the tokens are absent (local dev).
  stateStore: hasRemoteState
    ? (scope) =>
        new CloudflareStateStore(scope, {
          apiToken: alchemy.secret(process.env.CLOUDFLARE_API_TOKEN),
          stateToken: alchemy.secret(process.env.ALCHEMY_STATE_TOKEN),
        })
    : undefined,
});

const db = await D1Database("database", {
  migrationsDir: "../../packages/db/src/migrations",
  adopt: true,
});

export const web = await Vite("web", {
  cwd: "../../apps/web",
  assets: "dist",
  // Fixed name so the production URL drops the stage suffix.
  name: isProduction
    ? "shaxsiy-oyin-web"
    : isDevDeploy
      ? "shaxsiy-oyin-web-dev"
      : undefined,
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
  name: isProduction
    ? "shaxsiy-oyin-server"
    : isDevDeploy
      ? "shaxsiy-oyin-server-dev"
      : undefined,
  adopt: true,
  // Sweeps abandoned "waiting" rooms; previously piggybacked on GET /.
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
