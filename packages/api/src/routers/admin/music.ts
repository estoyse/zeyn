import { and, count, eq } from "@zeyn/db";
import { artists, songs } from "@zeyn/db/schema";
import { TRPCError } from "@trpc/server";
import z from "zod";

import { adminProcedure, router } from "../../index";
import { musicGameConfig } from "../../games/music";
import {
  assertForceWhenChildrenExist,
  assertNotUsedByLiveRoom,
  pageInput,
  recordAudit,
  searchLike,
} from "./_shared";

const artistNameSchema = z.string().trim().min(1).max(120);
const songTitleSchema = z.string().trim().min(1).max(200);
const urlSchema = z.url().max(500);

export const musicRouter = router({
  listArtists: adminProcedure.input(pageInput).query(async ({ ctx, input }) => {
    const where = input.search
      ? searchLike(artists.name, input.search)
      : undefined;

    const [items, totalRow] = await Promise.all([
      ctx.db
        .select({
          id: artists.id,
          name: artists.name,
          artworkUrl: artists.artworkUrl,
          songCount: count(songs.id),
        })
        .from(artists)
        .leftJoin(songs, eq(songs.artistId, artists.id))
        .where(where)
        .groupBy(artists.id)
        .orderBy(artists.name)
        .limit(input.limit)
        .offset(input.offset),
      ctx.db.select({ value: count() }).from(artists).where(where).get(),
    ]);

    return {
      items,
      total: totalRow?.value ?? 0,
      limit: input.limit,
      offset: input.offset,
      minSongs: musicGameConfig.optionsPerQuestion,
    };
  }),

  getArtist: adminProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const artist = await ctx.db
        .select()
        .from(artists)
        .where(eq(artists.id, input.id))
        .limit(1)
        .get();

      if (!artist) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Artist not found" });
      }

      const artistSongs = await ctx.db
        .select()
        .from(songs)
        .where(eq(songs.artistId, input.id))
        .orderBy(songs.title);

      return {
        ...artist,
        songs: artistSongs,
        minSongs: musicGameConfig.optionsPerQuestion,
      };
    }),

  createArtist: adminProcedure
    .input(
      z.object({
        name: artistNameSchema,
        artworkUrl: urlSchema.optional().or(z.literal("")),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const id = crypto.randomUUID();
      await ctx.db.insert(artists).values({
        id,
        name: input.name,
        artworkUrl: input.artworkUrl || null,
      });
      await recordAudit(ctx, "artist.create", "artist", id, {
        name: input.name,
      });
      return { id };
    }),

  updateArtist: adminProcedure
    .input(
      z.object({
        id: z.string(),
        name: artistNameSchema,
        artworkUrl: urlSchema.optional().or(z.literal("")),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const updated = await ctx.db
        .update(artists)
        .set({ name: input.name, artworkUrl: input.artworkUrl || null })
        .where(eq(artists.id, input.id))
        .returning({ id: artists.id });

      if (updated.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Artist not found" });
      }

      await recordAudit(ctx, "artist.update", "artist", input.id, {
        name: input.name,
      });
      return { success: true as const };
    }),

  deleteArtist: adminProcedure
    .input(z.object({ id: z.string(), force: z.boolean().default(false) }))
    .mutation(async ({ ctx, input }) => {
      await assertNotUsedByLiveRoom(ctx, input.id, "artist");

      const childRow = await ctx.db
        .select({ value: count() })
        .from(songs)
        .where(eq(songs.artistId, input.id))
        .get();
      const childCount = childRow?.value ?? 0;

      assertForceWhenChildrenExist(
        childCount,
        input.force,
        n => `Deleting this artist also deletes ${n} song(s).`
      );

      const deleted = await ctx.db
        .delete(artists)
        .where(eq(artists.id, input.id))
        .returning({ id: artists.id });

      if (deleted.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Artist not found" });
      }

      await recordAudit(ctx, "artist.delete", "artist", input.id, {
        deletedSongs: childCount,
      });
      return { deletedSongs: childCount };
    }),

  listSongs: adminProcedure
    .input(pageInput.extend({ artistId: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      const conditions = [];
      if (input.search) {
        conditions.push(searchLike(songs.title, input.search));
      }
      if (input.artistId) {
        conditions.push(eq(songs.artistId, input.artistId));
      }
      const where = conditions.length ? and(...conditions) : undefined;

      const [items, totalRow] = await Promise.all([
        ctx.db
          .select({
            id: songs.id,
            artistId: songs.artistId,
            artistName: artists.name,
            title: songs.title,
            previewUrl: songs.previewUrl,
            artworkUrl: songs.artworkUrl,
          })
          .from(songs)
          .innerJoin(artists, eq(artists.id, songs.artistId))
          .where(where)
          .orderBy(artists.name, songs.title)
          .limit(input.limit)
          .offset(input.offset),
        ctx.db.select({ value: count() }).from(songs).where(where).get(),
      ]);

      return {
        items,
        total: totalRow?.value ?? 0,
        limit: input.limit,
        offset: input.offset,
      };
    }),

  createSong: adminProcedure
    .input(
      z.object({
        artistId: z.string(),
        title: songTitleSchema,
        previewUrl: urlSchema,
        artworkUrl: urlSchema.optional().or(z.literal("")),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const artist = await ctx.db
        .select({ id: artists.id })
        .from(artists)
        .where(eq(artists.id, input.artistId))
        .limit(1)
        .get();

      if (!artist) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Artist not found" });
      }

      const id = crypto.randomUUID();
      await ctx.db.insert(songs).values({
        id,
        artistId: input.artistId,
        title: input.title,
        previewUrl: input.previewUrl,
        artworkUrl: input.artworkUrl || null,
      });

      await recordAudit(ctx, "song.create", "song", id, {
        artistId: input.artistId,
      });
      return { id };
    }),

  updateSong: adminProcedure
    .input(
      z.object({
        id: z.string(),
        title: songTitleSchema.optional(),
        previewUrl: urlSchema.optional(),
        artworkUrl: urlSchema.optional().or(z.literal("")),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, artworkUrl, ...rest } = input;
      const patch: Record<string, unknown> = Object.fromEntries(
        Object.entries(rest).filter(([, value]) => value !== undefined)
      );
      if (artworkUrl !== undefined) {
        patch.artworkUrl = artworkUrl || null;
      }

      if (Object.keys(patch).length === 0) {
        return { success: true as const };
      }

      const updated = await ctx.db
        .update(songs)
        .set(patch)
        .where(eq(songs.id, id))
        .returning({ id: songs.id });

      if (updated.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Song not found" });
      }

      await recordAudit(ctx, "song.update", "song", id, patch);
      return { success: true as const };
    }),

  deleteSong: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const deleted = await ctx.db
        .delete(songs)
        .where(eq(songs.id, input.id))
        .returning({ artistId: songs.artistId });

      const row = deleted[0];
      if (!row) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Song not found" });
      }

      const remainingRow = await ctx.db
        .select({ value: count() })
        .from(songs)
        .where(eq(songs.artistId, row.artistId))
        .get();
      const remaining = remainingRow?.value ?? 0;

      await recordAudit(ctx, "song.delete", "song", input.id, {
        artistId: row.artistId,
      });

      return {
        success: true as const,
        warning:
          remaining < musicGameConfig.optionsPerQuestion
            ? `This artist now has ${remaining} song(s); music rooms need at least ${musicGameConfig.optionsPerQuestion}.`
            : null,
      };
    }),
});
