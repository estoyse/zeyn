import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { subjects, questions, artists, songs } from "./schema";
import { SUBJECTS, QUESTIONS, fetchMusicContent } from "./seed-data";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../../..");

// Locate the local SQLite file that Alchemy/Wrangler use for the D1 database.
// Priority matches what the running dev server reads from (and drizzle.config.ts).
// Override with D1_LOCAL_PATH=/abs/path when needed.
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

  // Fallback to the standalone drizzle-kit file.
  return path.join(repoRoot, "packages/db/local.sqlite");
}

async function main() {
  const dbPath = resolveLocalD1Path();
  if (!fs.existsSync(dbPath)) {
    console.error(
      `Local D1 database not found at:\n  ${dbPath}\n\n` +
        "Run the dev server once (pnpm dev:no-mobile) or `pnpm db:push` first so " +
        "the database and tables exist, then re-run `pnpm db:seed`.\n" +
        "You can also point at a specific file with D1_LOCAL_PATH=/abs/path.\n" +
        "To seed a remote/prod D1 instead, use `pnpm db:seed:sql` + wrangler."
    );
    process.exit(1);
  }

  console.log(`Seeding local D1 at: ${dbPath}`);
  const client = createClient({ url: `file:${dbPath}` });
  const db = drizzle(client);

  // Idempotent: existing rows are left untouched, so this is safe to re-run.
  await db.insert(subjects).values(SUBJECTS).onConflictDoNothing();
  await db.insert(questions).values(QUESTIONS).onConflictDoNothing();

  console.log("Seeding music (fetching previews from iTunes)...");
  const music = await fetchMusicContent(msg => console.log(msg));
  if (music.artists.length) {
    await db.insert(artists).values(music.artists).onConflictDoNothing();
  }
  if (music.songs.length) {
    await db.insert(songs).values(music.songs).onConflictDoNothing();
  }

  console.log(
    `Seed complete: ${SUBJECTS.length} subjects, ${QUESTIONS.length} questions, ` +
      `${music.artists.length} artists, ${music.songs.length} songs.`
  );
  client.close();
}

main().catch(err => {
  console.error("Seed failed:", err);
  process.exit(1);
});
