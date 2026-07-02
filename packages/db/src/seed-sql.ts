import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  SUBJECTS,
  QUESTIONS,
  fetchMusicContent,
  type ArtistSeed,
  type QuestionSeed,
  type SongSeed,
  type SubjectSeed,
} from "./seed-data";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROWS_PER_STATEMENT = 50;

type Cell = string | number | null;

function sqlValue(v: Cell): string {
  if (v === null) return "NULL";
  if (typeof v === "number") return String(v);
  return `'${v.replace(/'/g, "''")}'`;
}

function insertStatements(
  table: string,
  columns: string[],
  rows: Cell[][]
): string {
  if (rows.length === 0) return "";
  const statements: string[] = [];
  for (let i = 0; i < rows.length; i += ROWS_PER_STATEMENT) {
    const batch = rows.slice(i, i + ROWS_PER_STATEMENT);
    const values = batch
      .map(r => `  (${r.map(sqlValue).join(", ")})`)
      .join(",\n");
    statements.push(
      `INSERT INTO ${table} (${columns.join(", ")}) VALUES\n${values}\nON CONFLICT DO NOTHING;`
    );
  }
  return statements.join("\n\n");
}

function subjectRows(items: SubjectSeed[]): Cell[][] {
  return items.map(s => [s.id, s.name]);
}
function questionRows(items: QuestionSeed[]): Cell[][] {
  return items.map(q => [q.id, q.subjectId, q.text, q.answer, q.points]);
}
function artistRows(items: ArtistSeed[]): Cell[][] {
  return items.map(a => [a.id, a.name, a.artworkUrl]);
}
function songRows(items: SongSeed[]): Cell[][] {
  return items.map(s => [s.id, s.artistId, s.title, s.previewUrl, s.artworkUrl]);
}

async function main() {
  const outArg = process.argv[2];
  const outPath = outArg
    ? path.resolve(process.cwd(), outArg)
    : path.resolve(__dirname, "../seed.sql");

  console.error("Fetching music previews from iTunes...");
  const music = await fetchMusicContent(msg => console.error(msg));

  const blocks = [
    "PRAGMA foreign_keys=OFF;",
    insertStatements("subjects", ["id", "name"], subjectRows(SUBJECTS)),
    insertStatements(
      "questions",
      ["id", "subject_id", "text", "answer", "points"],
      questionRows(QUESTIONS)
    ),
    insertStatements(
      "artists",
      ["id", "name", "artwork_url"],
      artistRows(music.artists)
    ),
    insertStatements(
      "songs",
      ["id", "artist_id", "title", "preview_url", "artwork_url"],
      songRows(music.songs)
    ),
    "PRAGMA foreign_keys=ON;",
  ].filter(Boolean);

  fs.writeFileSync(outPath, blocks.join("\n\n") + "\n", "utf8");

  console.error(
    `\nWrote ${outPath}\n` +
      `  ${SUBJECTS.length} subjects, ${QUESTIONS.length} questions, ` +
      `${music.artists.length} artists, ${music.songs.length} songs.\n\n` +
      "To apply to your remote (prod) D1:\n" +
      "  1. pnpm --filter server exec wrangler d1 list      # find the DB name/id\n" +
      `  2. pnpm --filter server exec wrangler d1 execute <DB_NAME> --remote --file="${outPath}"\n`
  );
}

main().catch(err => {
  console.error("Failed to generate seed SQL:", err);
  process.exit(1);
});
