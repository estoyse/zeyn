import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { subjects, questions, artists, songs } from "./schema";

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

const SUBJECTS = [
  { id: "s1", name: "Science" },
  { id: "s2", name: "History" },
  { id: "s3", name: "Geography" },
  { id: "s4", name: "Movies" },
  { id: "s5", name: "Sports" },
  { id: "s6", name: "Music" },
];

const QUESTIONS = [
  { id: "q1_10", subjectId: "s1", text: "What is the chemical symbol for water?", answer: "H2O", points: 10 },
  { id: "q1_20", subjectId: "s1", text: "Which planet is known as the Red Planet?", answer: "Mars", points: 20 },
  { id: "q1_30", subjectId: "s1", text: "What is the hardest natural substance on Earth?", answer: "Diamond", points: 30 },
  { id: "q1_40", subjectId: "s1", text: "What is the speed of light in a vacuum (approx km/s)?", answer: "300000", points: 40 },
  { id: "q1_50", subjectId: "s1", text: "What is the most abundant gas in Earth's atmosphere?", answer: "Nitrogen", points: 50 },
  { id: "q2_10", subjectId: "s2", text: "Who was the first President of the United States?", answer: "George Washington", points: 10 },
  { id: "q2_20", subjectId: "s2", text: "In which year did the Titanic sink?", answer: "1912", points: 20 },
  { id: "q2_30", subjectId: "s2", text: "Which empire was ruled by Julius Caesar?", answer: "Roman Empire", points: 30 },
  { id: "q2_40", subjectId: "s2", text: "Who was the primary author of the Declaration of Independence?", answer: "Thomas Jefferson", points: 40 },
  { id: "q2_50", subjectId: "s2", text: "What was the name of the first artificial satellite launched into space?", answer: "Sputnik 1", points: 50 },
  { id: "q3_10", subjectId: "s3", text: "What is the largest continent on Earth?", answer: "Asia", points: 10 },
  { id: "q3_20", subjectId: "s3", text: "Which river is the longest in the world?", answer: "Nile", points: 20 },
  { id: "q3_30", subjectId: "s3", text: "What is the capital city of France?", answer: "Paris", points: 30 },
  { id: "q3_40", subjectId: "s3", text: "Which mountain is the highest in the world?", answer: "Mount Everest", points: 40 },
  { id: "q3_50", subjectId: "s3", text: "What is the smallest country in the world by land area?", answer: "Vatican City", points: 50 },
  { id: "q4_10", subjectId: "s4", text: "Who played Iron Man in the Marvel Cinematic Universe?", answer: "Robert Downey Jr", points: 10 },
  { id: "q4_20", subjectId: "s4", text: "What was the first feature-length animated movie ever released?", answer: "Snow White", points: 20 },
  { id: "q4_30", subjectId: "s4", text: "Which movie features the line \"I'm gonna make him an offer he can't refuse\"?", answer: "The Godfather", points: 30 },
  { id: "q4_40", subjectId: "s4", text: "Who directed the 1994 film \"Pulp Fiction\"?", answer: "Quentin Tarantino", points: 40 },
  { id: "q4_50", subjectId: "s4", text: "Which movie holds the record for the highest box office gross of all time?", answer: "Avatar", points: 50 },
  { id: "q5_10", subjectId: "s5", text: "How many players are on a standard soccer team on the field?", answer: "11", points: 10 },
  { id: "q5_20", subjectId: "s5", text: "In which sport would you perform a \"slam dunk\"?", answer: "Basketball", points: 20 },
  { id: "q5_30", subjectId: "s5", text: "Who has won the most Olympic gold medals of all time?", answer: "Michael Phelps", points: 30 },
  { id: "q5_40", subjectId: "s5", text: "Which country has won the most FIFA World Cups?", answer: "Brazil", points: 40 },
  { id: "q5_50", subjectId: "s5", text: "What is the distance of a standard marathon in kilometers?", answer: "42.195", points: 50 },
  { id: "q6_10", subjectId: "s6", text: "Who is known as the \"King of Pop\"?", answer: "Michael Jackson", points: 10 },
  { id: "q6_20", subjectId: "s6", text: "Which legendary British band featured John Lennon and Paul McCartney?", answer: "The Beatles", points: 20 },
  { id: "q6_30", subjectId: "s6", text: "What is the most streamed song on Spotify as of 2024?", answer: "Blinding Lights", points: 30 },
  { id: "q6_40", subjectId: "s6", text: "Which female artist is known as the \"Queen of Soul\"?", answer: "Aretha Franklin", points: 40 },
  { id: "q6_50", subjectId: "s6", text: "What is the term for a musical composition for four voices or instruments?", answer: "Quartet", points: 50 },
];

const MUSIC_ARTISTS = [
  "Coldplay",
  "Taylor Swift",
  "Queen",
  "The Beatles",
  "Daft Punk",
  "Ed Sheeran",
  "Adele",
  "Imagine Dragons",
];

const SONGS_PER_ARTIST = 15;

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

interface ITunesTrack {
  artistId: number;
  artistName: string;
  trackId: number;
  trackName: string;
  previewUrl?: string;
  artworkUrl100?: string;
}

async function fetchArtistTracks(name: string): Promise<ITunesTrack[]> {
  const url = `https://itunes.apple.com/search?term=${encodeURIComponent(
    name
  )}&entity=song&limit=60`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`iTunes responded ${res.status}`);
  const data = (await res.json()) as { results?: ITunesTrack[] };
  return data.results ?? [];
}

async function seedMusic(db: ReturnType<typeof drizzle>) {
  const artistRows: (typeof artists.$inferInsert)[] = [];
  const songRows: (typeof songs.$inferInsert)[] = [];

  for (const name of MUSIC_ARTISTS) {
    try {
      const tracks = await fetchArtistTracks(name);
      const usable = tracks.filter(
        t => t.previewUrl && t.trackName && t.artistId
      );
      if (usable.length === 0) {
        console.warn(`  no preview tracks found for ${name}, skipping`);
        continue;
      }

      const primary = usable[0]!;
      const artistId = `a_${primary.artistId}`;
      artistRows.push({
        id: artistId,
        name: primary.artistName,
        artworkUrl: primary.artworkUrl100 ?? null,
      });

      const seen = new Set<string>();
      let picked = 0;
      for (const t of usable) {
        if (t.artistId !== primary.artistId) continue;
        const key = t.trackName.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        songRows.push({
          id: `s_${t.trackId}`,
          artistId,
          title: t.trackName,
          previewUrl: t.previewUrl!,
          artworkUrl: t.artworkUrl100 ?? null,
        });
        if (++picked >= SONGS_PER_ARTIST) break;
      }
      console.log(`  ${primary.artistName}: ${picked} songs`);
      await sleep(300);
    } catch (e) {
      console.warn(`  failed to fetch ${name}:`, (e as Error).message);
    }
  }

  if (artistRows.length) {
    await db.insert(artists).values(artistRows).onConflictDoNothing();
  }
  if (songRows.length) {
    await db.insert(songs).values(songRows).onConflictDoNothing();
  }
  return { artists: artistRows.length, songs: songRows.length };
}

async function main() {
  const dbPath = resolveLocalD1Path();
  if (!fs.existsSync(dbPath)) {
    console.error(
      `Local D1 database not found at:\n  ${dbPath}\n\n` +
        "Run the dev server once (pnpm dev:no-mobile) or `pnpm db:push` first so " +
        "the database and tables exist, then re-run `pnpm db:seed`.\n" +
        "You can also point at a specific file with D1_LOCAL_PATH=/abs/path."
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
  const music = await seedMusic(db);

  console.log(
    `Seed complete: ${SUBJECTS.length} subjects, ${QUESTIONS.length} questions, ` +
      `${music.artists} artists, ${music.songs} songs.`
  );
  client.close();
}

main().catch(err => {
  console.error("Seed failed:", err);
  process.exit(1);
});
