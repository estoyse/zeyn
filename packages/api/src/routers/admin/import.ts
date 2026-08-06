import { count, eq, inArray } from "@zeyn/db";
import { artists, questions, songs, subjects } from "@zeyn/db/schema";
import { TRPCError } from "@trpc/server";
import z from "zod";

import { adminProcedure, router } from "../../index";
import { chunk, recordAudit, rowsPerStatement } from "./_shared";

const itunesArtistSchema = z.object({
  id: z.string().regex(/^a_\d+$/, "Expected an iTunes artist id"),
  name: z.string().trim().min(1).max(120),
  artworkUrl: z.url().max(500).nullable(),
});

const itunesSongSchema = z.object({
  id: z.string().regex(/^s_\d+$/, "Expected an iTunes track id"),
  artistId: z.string().regex(/^a_\d+$/),
  title: z.string().trim().min(1).max(200),
  previewUrl: z.url().max(500),
  artworkUrl: z.url().max(500).nullable(),
});

const QUESTION_COLUMNS = 5;
const SONG_COLUMNS = 5;

export const importRowSchema = z.object({
  text: z.string().trim().min(1).max(2000),
  answer: z.string().trim().min(1).max(500),
  points: z.number().int().min(1).max(1000),
});

export const importQuestionsRouter = router({
  bulkImportQuestions: adminProcedure
    .input(
      z.object({
        subjectId: z.string(),
        rows: z.array(importRowSchema).min(1).max(500),
        dryRun: z.boolean().default(false),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const subject = await ctx.db
        .select({ id: subjects.id, name: subjects.name })
        .from(subjects)
        .where(eq(subjects.id, input.subjectId))
        .limit(1)
        .get();

      if (!subject) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Subject not found" });
      }

      const existing = await ctx.db
        .select({ text: questions.text })
        .from(questions)
        .where(eq(questions.subjectId, input.subjectId));

      const existingTexts = new Set(
        existing.map(row => row.text.trim().toLowerCase())
      );

      const seenInBatch = new Set<string>();
      const toInsert: {
        id: string;
        subjectId: string;
        text: string;
        answer: string;
        points: number;
      }[] = [];
      let duplicates = 0;

      for (const row of input.rows) {
        const key = row.text.trim().toLowerCase();
        if (existingTexts.has(key) || seenInBatch.has(key)) {
          duplicates += 1;
          continue;
        }
        seenInBatch.add(key);
        toInsert.push({
          id: crypto.randomUUID(),
          subjectId: input.subjectId,
          text: row.text,
          answer: row.answer,
          points: row.points,
        });
      }

      if (input.dryRun) {
        return {
          created: 0,
          wouldCreate: toInsert.length,
          duplicates,
          dryRun: true as const,
        };
      }

      const batches = chunk(toInsert, rowsPerStatement(QUESTION_COLUMNS));
      for (const batch of batches) {
        if (batch.length === 0) continue;
        await ctx.db.insert(questions).values(batch);
      }

      await recordAudit(
        ctx,
        "question.bulkImport",
        "subject",
        input.subjectId,
        {
          subjectName: subject.name,
          created: toInsert.length,
          duplicates,
        }
      );

      return {
        created: toInsert.length,
        wouldCreate: toInsert.length,
        duplicates,
        dryRun: false as const,
      };
    }),

  importedArtistIds: adminProcedure
    .input(z.object({ artistIds: z.array(z.string().max(64)).max(60) }))
    .query(async ({ ctx, input }) => {
      if (input.artistIds.length === 0) return [];
      const rows = await ctx.db
        .select({ id: artists.id })
        .from(artists)
        .where(inArray(artists.id, input.artistIds));
      return rows.map(row => row.id);
    }),

  importArtist: adminProcedure
    .input(
      z.object({
        artist: itunesArtistSchema,
        songs: z.array(itunesSongSchema).min(1).max(30),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const validSongs = input.songs
        .filter(song => song.artistId === input.artist.id)
        .slice(0, 30);

      if (validSongs.length === 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No songs were supplied for this artist",
        });
      }

      await ctx.db
        .insert(artists)
        .values({
          id: input.artist.id,
          name: input.artist.name,
          artworkUrl: input.artist.artworkUrl,
        })
        .onConflictDoNothing();

      const batches = chunk(validSongs, rowsPerStatement(SONG_COLUMNS));
      for (const batch of batches) {
        if (batch.length === 0) continue;
        await ctx.db.insert(songs).values(batch).onConflictDoNothing();
      }

      const totalRow = await ctx.db
        .select({ value: count() })
        .from(songs)
        .where(eq(songs.artistId, input.artist.id))
        .get();

      await recordAudit(ctx, "artist.importItunes", "artist", input.artist.id, {
        artistName: input.artist.name,
        songsSubmitted: validSongs.length,
      });

      return {
        artistId: input.artist.id,
        artistName: input.artist.name,
        songsFetched: validSongs.length,
        songsTotal: totalRow?.value ?? 0,
      };
    }),
});
