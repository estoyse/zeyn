import { count, desc, eq, gte, lt, sql, sum } from "@zeyn/db";
import {
  activeGames,
  artists,
  gameHistory,
  gamePlayerResults,
  questions,
  songs,
  subjects,
  user,
} from "@zeyn/db/schema";
import z from "zod";

import { adminProcedure, router } from "../../index";
import { gameConfig } from "../../game-types";
import { musicGameConfig } from "../../games/music";

function daysAgo(days: number): Date {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

const dayBucket = (column: unknown) =>
  sql<string>`strftime('%Y-%m-%d', ${column} / 1000, 'unixepoch')`;

export const statsRouter = router({
  overview: adminProcedure.query(async ({ ctx }) => {
    const week = daysAgo(7);
    const month = daysAgo(30);

    const [
      users,
      admins,
      banned,
      newUsers7d,
      newUsers30d,
      subjectCount,
      questionCount,
      artistCount,
      songCount,
      gamesPlayed,
      gamesPlayed7d,
      liveRooms,
    ] = await Promise.all([
      ctx.db.select({ value: count() }).from(user).get(),
      ctx.db
        .select({ value: count() })
        .from(user)
        .where(eq(user.role, "admin"))
        .get(),
      ctx.db
        .select({ value: count() })
        .from(user)
        .where(eq(user.banned, true))
        .get(),
      ctx.db
        .select({ value: count() })
        .from(user)
        .where(gte(user.createdAt, week))
        .get(),
      ctx.db
        .select({ value: count() })
        .from(user)
        .where(gte(user.createdAt, month))
        .get(),
      ctx.db.select({ value: count() }).from(subjects).get(),
      ctx.db.select({ value: count() }).from(questions).get(),
      ctx.db.select({ value: count() }).from(artists).get(),
      ctx.db.select({ value: count() }).from(songs).get(),
      ctx.db.select({ value: count() }).from(gameHistory).get(),
      ctx.db
        .select({ value: count() })
        .from(gameHistory)
        .where(gte(gameHistory.createdAt, week))
        .get(),
      ctx.db
        .select({ value: count() })
        .from(activeGames)
        .where(
          sql`${activeGames.status} in ('waiting','playing')`
        )
        .get(),
    ]);

    return {
      users: users?.value ?? 0,
      admins: admins?.value ?? 0,
      banned: banned?.value ?? 0,
      newUsers7d: newUsers7d?.value ?? 0,
      newUsers30d: newUsers30d?.value ?? 0,
      subjects: subjectCount?.value ?? 0,
      questions: questionCount?.value ?? 0,
      artists: artistCount?.value ?? 0,
      songs: songCount?.value ?? 0,
      gamesPlayed: gamesPlayed?.value ?? 0,
      gamesPlayed7d: gamesPlayed7d?.value ?? 0,
      liveRooms: liveRooms?.value ?? 0,
    };
  }),

  timeseries: adminProcedure
    .input(
      z.object({
        days: z.union([z.literal(7), z.literal(30), z.literal(90)]).default(30),
      })
    )
    .query(async ({ ctx, input }) => {
      const since = daysAgo(input.days);

      const [signups, games] = await Promise.all([
        ctx.db
          .select({
            day: dayBucket(user.createdAt),
            value: count(),
          })
          .from(user)
          .where(gte(user.createdAt, since))
          .groupBy(dayBucket(user.createdAt))
          .orderBy(dayBucket(user.createdAt)),
        ctx.db
          .select({
            day: dayBucket(gameHistory.createdAt),
            value: count(),
          })
          .from(gameHistory)
          .where(gte(gameHistory.createdAt, since))
          .groupBy(dayBucket(gameHistory.createdAt))
          .orderBy(dayBucket(gameHistory.createdAt)),
      ]);

      return { days: input.days, signups, games };
    }),

  gameTypeBreakdown: adminProcedure.query(async ({ ctx }) => {
    return ctx.db
      .select({ gameType: gameHistory.gameType, value: count() })
      .from(gameHistory)
      .groupBy(gameHistory.gameType)
      .orderBy(desc(count()));
  }),

  topHosts: adminProcedure
    .input(z.object({ limit: z.number().int().min(1).max(50).default(10) }))
    .query(async ({ ctx, input }) => {
      return ctx.db
        .select({
          userId: gameHistory.hostId,
          name: user.name,
          username: user.username,
          hosted: count(),
        })
        .from(gameHistory)
        .innerJoin(user, eq(user.id, gameHistory.hostId))
        .groupBy(gameHistory.hostId)
        .orderBy(desc(count()))
        .limit(input.limit);
    }),

  topPlayers: adminProcedure
    .input(z.object({ limit: z.number().int().min(1).max(50).default(10) }))
    .query(async ({ ctx, input }) => {
      return ctx.db
        .select({
          userId: gamePlayerResults.userId,
          name: user.name,
          username: user.username,
          games: count(),
          totalScore: sum(gamePlayerResults.score).mapWith(Number),
        })
        .from(gamePlayerResults)
        .innerJoin(user, eq(user.id, gamePlayerResults.userId))
        .groupBy(gamePlayerResults.userId)
        .orderBy(desc(sum(gamePlayerResults.score)))
        .limit(input.limit);
    }),

  contentHealth: adminProcedure.query(async ({ ctx }) => {
    const [thinSubjects, thinArtists] = await Promise.all([
      ctx.db
        .select({
          id: subjects.id,
          name: subjects.name,
          questionCount: count(questions.id),
        })
        .from(subjects)
        .leftJoin(questions, eq(questions.subjectId, subjects.id))
        .groupBy(subjects.id)
        .having(lt(count(questions.id), gameConfig.questionsPerSubject))
        .orderBy(subjects.name),
      ctx.db
        .select({
          id: artists.id,
          name: artists.name,
          songCount: count(songs.id),
        })
        .from(artists)
        .leftJoin(songs, eq(songs.artistId, artists.id))
        .groupBy(artists.id)
        .having(lt(count(songs.id), musicGameConfig.optionsPerQuestion))
        .orderBy(artists.name),
    ]);

    return {
      minQuestionsPerSubject: gameConfig.questionsPerSubject,
      minSongsPerArtist: musicGameConfig.optionsPerQuestion,
      thinSubjects,
      thinArtists,
    };
  }),

  recentSignups: adminProcedure
    .input(z.object({ limit: z.number().int().min(1).max(20).default(5) }))
    .query(async ({ ctx, input }) => {
      return ctx.db
        .select({
          id: user.id,
          name: user.name,
          email: user.email,
          username: user.username,
          image: user.image,
          createdAt: user.createdAt,
        })
        .from(user)
        .orderBy(desc(user.createdAt))
        .limit(input.limit);
    }),

  recentGames: adminProcedure
    .input(z.object({ limit: z.number().int().min(1).max(20).default(5) }))
    .query(async ({ ctx, input }) => {
      return ctx.db
        .select({
          id: gameHistory.id,
          gameId: gameHistory.gameId,
          gameType: gameHistory.gameType,
          hostName: user.name,
          createdAt: gameHistory.createdAt,
        })
        .from(gameHistory)
        .leftJoin(user, eq(user.id, gameHistory.hostId))
        .orderBy(desc(gameHistory.createdAt))
        .limit(input.limit);
    }),

  liveRooms: adminProcedure
    .input(z.object({ limit: z.number().int().min(1).max(20).default(5) }))
    .query(async ({ ctx, input }) => {
      return ctx.db
        .select({
          id: activeGames.id,
          name: activeGames.name,
          gameType: activeGames.gameType,
          status: activeGames.status,
          hostName: user.name,
          createdAt: activeGames.createdAt,
        })
        .from(activeGames)
        .leftJoin(user, eq(user.id, activeGames.hostId))
        .where(sql`${activeGames.status} in ('waiting','playing')`)
        .orderBy(desc(activeGames.createdAt))
        .limit(input.limit);
    }),
});
