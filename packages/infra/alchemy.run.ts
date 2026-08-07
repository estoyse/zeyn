import alchemy from "alchemy";
import { Vite } from "alchemy/cloudflare";
import { Worker, DurableObjectNamespace, RateLimit } from "alchemy/cloudflare";
import { D1Database } from "alchemy/cloudflare";
import { CloudflareStateStore } from "alchemy/state";
import { config } from "dotenv";

const loadEnvs = () => {
  config({ path: "./.env" });
  // Production config comes from the environment (CI secrets); load dev .env
  // files only outside production.
  if (process.env.NODE_ENV !== "production") {
    config({ path: "../../apps/web/.env" });
    config({ path: "../../apps/admin/.env" });
    config({ path: "../../apps/server/.env" });
  }
};

loadEnvs();

const isProduction = process.env.NODE_ENV === "production";
const stage =
  process.env.ALCHEMY_STAGE ?? (isProduction ? "production" : undefined);

const workerName = (base: string) =>
  stage === "production" ? base : stage ? `${base}-${stage}` : undefined;

const domainsByStage = {
  production: {
    web: "zeyn.uz",
    admin: "admin.zeyn.uz",
    server: "api.zeyn.uz",
  },
  dev: {
    web: "dev.zeyn.uz",
    admin: "dev-admin.zeyn.uz",
    server: "dev-api.zeyn.uz",
  },
} as const;

const domains =
  stage && stage in domainsByStage
    ? domainsByStage[stage as keyof typeof domainsByStage]
    : undefined;

const webUrl = domains ? `https://${domains.web}` : undefined;
const adminUrl = domains ? `https://${domains.admin}` : undefined;
const serverUrl = domains ? `https://${domains.server}` : undefined;

const viteServerUrl = serverUrl ?? process.env.VITE_SERVER_URL;
const corsOrigin = domains
  ? [webUrl, adminUrl].filter(Boolean).join(",")
  : process.env.CORS_ORIGIN;
const betterAuthUrl = serverUrl ?? process.env.BETTER_AUTH_URL;

const hasRemoteState =
  !!process.env.CLOUDFLARE_API_TOKEN && !!process.env.ALCHEMY_STATE_TOKEN;

const app = await alchemy("zeyn", {
  // Alchemy derives the stage from $USER; pin it so CI and local deploys target
  // the same resources instead of separate per-user copies.
  stage,
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
  assets: { directory: "dist", run_worker_first: ["/"] },
  build: "pnpm run build",
  // Fixed name so the production URL drops the stage suffix.
  name: workerName("zeyn-web"),
  adopt: true,
  domains: domains ? [domains.web] : undefined,
  script: `
    export default {
      async fetch(request, env) {
        const url = new URL(request.url);
        if (url.pathname === "/") {
          return env.ASSETS.fetch(new URL("/home.html", url));
        }
        return env.ASSETS.fetch(request);
      },
    };
  `,
  bindings: {
    VITE_SERVER_URL: viteServerUrl!,
  },
});

export const admin = await Vite("admin", {
  cwd: "../../apps/admin",
  assets: "dist",
  name: workerName("zeyn-admin"),
  adopt: true,
  domains: domains ? [domains.admin] : undefined,
  bindings: {
    VITE_SERVER_URL: viteServerUrl!,
  },
});

export const server = await Worker("server", {
  cwd: "../../apps/server",
  entrypoint: "src/index.ts",
  compatibility: "node",
  compatibilityDate: "2024-09-23",
  name: workerName("zeyn-server"),
  adopt: true,
  domains: domains ? [domains.server] : undefined,
  // Sweeps abandoned "waiting" rooms; previously piggybacked on GET /.
  crons: ["*/15 * * * *"],
  bindings: {
    GAME_ROOM: DurableObjectNamespace("game_room", {
      className: "GameRoom",
      sqlite: true,
    }),
    DB: db,
    GUEST_TOKEN_LIMITER: RateLimit({
      namespace_id: 1001,
      simple: { limit: 5, period: 60 },
    }),
    CORS_ORIGIN: corsOrigin!,
    BETTER_AUTH_SECRET: alchemy.secret.env.BETTER_AUTH_SECRET!,
    BETTER_AUTH_URL: betterAuthUrl!,
    RESEND_API_KEY: alchemy.secret.env.RESEND_API_KEY!,
    GOOGLE_CLIENT_ID: alchemy.secret.env(
      "GOOGLE_CLIENT_ID",
      process.env.GOOGLE_CLIENT_ID ?? "",
    ),
    GOOGLE_CLIENT_SECRET: alchemy.secret.env(
      "GOOGLE_CLIENT_SECRET",
      process.env.GOOGLE_CLIENT_SECRET ?? "",
    ),
    NODE_ENV: process.env.NODE_ENV!,
  },
  dev: {
    port: 3000,
  },
});

console.log(`Web    -> ${web.url}`);
console.log(`Admin  -> ${admin.url}`);
console.log(`Server -> ${server.url}`);

await app.finalize();
