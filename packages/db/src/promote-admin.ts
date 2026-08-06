import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { eq } from "drizzle-orm";
import { user } from "./schema";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../../..");

function resolveLocalD1Path(): string {
  if (process.env.D1_LOCAL_PATH) return process.env.D1_LOCAL_PATH;

  const candidateDirs = [
    path.join(repoRoot, ".alchemy/miniflare/v3/d1/miniflare-D1DatabaseObject"),
    path.join(
      repoRoot,
      "packages/infra/.alchemy/miniflare/v3/d1/miniflare-D1DatabaseObject"
    ),
    path.join(
      repoRoot,
      "apps/server/.wrangler/state/v3/d1/miniflare-D1DatabaseObject"
    ),
  ];

  for (const dir of candidateDirs) {
    if (!fs.existsSync(dir)) continue;
    const file = fs
      .readdirSync(dir)
      .find(f => f.endsWith(".sqlite") && f !== "metadata.sqlite");
    if (file) return path.join(dir, file);
  }

  return path.join(repoRoot, "packages/db/local.sqlite");
}

async function main() {
  const email = process.argv[2];
  const demote = process.argv.includes("--demote");

  if (!email) {
    console.error(
      "Usage: pnpm db:promote <email> [--demote]\n\n" +
        "Grants (or with --demote, revokes) the admin role on the local D1 database.\n" +
        "For remote D1, use:\n" +
        "  pnpm --filter server exec wrangler d1 execute <DB> --remote \\\n" +
        `    --command "UPDATE user SET role='admin' WHERE email='you@example.com'"`
    );
    process.exit(1);
  }

  const dbPath = resolveLocalD1Path();
  if (!fs.existsSync(dbPath)) {
    console.error(
      `Local D1 database not found at:\n  ${dbPath}\n\n` +
        "Run the dev server once (pnpm dev:no-mobile) or `pnpm db:push` first so " +
        "the database and tables exist.\n" +
        "You can also point at a specific file with D1_LOCAL_PATH=/abs/path."
    );
    process.exit(1);
  }

  const client = createClient({ url: `file:${dbPath}` });
  const db = drizzle(client);

  const role = demote ? "user" : "admin";
  const updated = await db
    .update(user)
    .set({ role })
    .where(eq(user.email, email))
    .returning({ id: user.id, email: user.email, role: user.role });

  if (updated.length === 0) {
    console.error(`No user found with email: ${email}`);
    client.close();
    process.exit(1);
  }

  for (const row of updated) {
    console.log(`${row.email} -> role=${row.role}`);
  }
  client.close();
}

main().catch(err => {
  console.error("Promote failed:", err);
  process.exit(1);
});
