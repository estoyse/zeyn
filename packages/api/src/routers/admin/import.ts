import { count, eq, inArray } from "@zeyn/db";
import {
  searchItunesTracks,
  toArtistAndSongs,
  usableTracks,
} from "@zeyn/db/itunes";
import { artists, questions, songs, subjects } from "@zeyn/db/schema";
import { TRPCError } from "@trpc/server";
import z from "zod";

import { adminProcedure, router } from "../../index";
import { chunk, recordAudit, rowsPerStatement } from "./_shared";

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

  searchItunes: adminProcedure
    .input(
      z.object({
        term: z.string().trim().min(2).max(100),
        limit: z.number().int().min(1).max(60).default(60),
      })
    )
    .query(async ({ ctx, input }) => {
      let tracks;
      try {
        tracks = await searchItunesTracks(input.term, input.limit);
      } catch (error) {
        throw new TRPCError({
          code: "BAD_GATEWAY",
          message: `iTunes search failed: ${(error as Error).message}`,
        });
      }

      const usable = usableTracks(tracks);
      const byArtist = new Map<
        number,
        {
          itunesArtistId: number;
          artistId: string;
          name: string;
          artworkUrl: string | null;
          trackCount: number;
          tracksWithoutPreview: number;
        }
      >();

      for (const track of tracks) {
        const existing = byArtist.get(track.artistId);
        const hasPreview = Boolean(track.previewUrl && track.trackName);
        if (existing) {
          if (hasPreview) existing.trackCount += 1;
          else existing.tracksWithoutPreview += 1;
          continue;
        }
        byArtist.set(track.artistId, {
          itunesArtistId: track.artistId,
          artistId: `a_${track.artistId}`,
          name: track.artistName,
          artworkUrl: track.artworkUrl100 ?? null,
          trackCount: hasPreview ? 1 : 0,
          tracksWithoutPreview: hasPreview ? 0 : 1,
        });
      }

      const candidates = [...byArtist.values()].sort(
        (a, b) => b.trackCount - a.trackCount
      );

      const imported =
        candidates.length > 0
          ? await ctx.db
              .select({ id: artists.id })
              .from(artists)
              .where(
                inArray(
                  artists.id,
                  candidates.map(candidate => candidate.artistId)
                )
              )
          : [];
      const importedIds = new Set(imported.map(row => row.id));

      return {
        totalTracks: tracks.length,
        usableTracks: usable.length,
        artists: candidates.map(candidate => ({
          ...candidate,
          alreadyImported: importedIds.has(candidate.artistId),
        })),
      };
    }),

  importItunesArtist: adminProcedure
    .input(
      z.object({
        term: z.string().trim().min(1).max(100),
        songLimit: z.number().int().min(1).max(30).default(15),
      })
    )
    .mutation(async ({ ctx, input }) => {
      let tracks;
      try {
        tracks = await searchItunesTracks(input.term);
      } catch (error) {
        throw new TRPCError({
          code: "BAD_GATEWAY",
          message: `iTunes search failed: ${(error as Error).message}`,
        });
      }

      const built = toArtistAndSongs(tracks, input.songLimit);
      if (!built) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "No tracks with playable previews were found for that term",
        });
      }

      await ctx.db
        .insert(artists)
        .values(built.artist)
        .onConflictDoNothing();

      const batches = chunk(built.songs, rowsPerStatement(SONG_COLUMNS));
      for (const batch of batches) {
        if (batch.length === 0) continue;
        await ctx.db.insert(songs).values(batch).onConflictDoNothing();
      }

      const totalRow = await ctx.db
        .select({ value: count() })
        .from(songs)
        .where(eq(songs.artistId, built.artist.id))
        .get();

      await recordAudit(ctx, "artist.importItunes", "artist", built.artist.id, {
        term: input.term,
        artistName: built.artist.name,
        songsFetched: built.songs.length,
      });

      return {
        artistId: built.artist.id,
        artistName: built.artist.name,
        songsFetched: built.songs.length,
        songsTotal: totalRow?.value ?? 0,
      };
    }),
});
