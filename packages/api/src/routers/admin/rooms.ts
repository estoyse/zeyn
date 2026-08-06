import { and, count, desc, eq, lt, sql } from "@zeyn/db";
import {
  activeGames,
  gameHistory,
  gamePlayerResults,
  gameQuestionResults,
  user,
} from "@zeyn/db/schema";
import { TRPCError } from "@trpc/server";
import z from "zod";

import { adminProcedure, router } from "../../index";
import { cursorInput, recordAudit } from "./_shared";

const roomStatus = z.enum(["waiting", "playing", "finished"]);

interface RoomStub {
  adminClose(reason?: string): Promise<{ closedSockets: number }>;
  adminSnapshot(): Promise<{
    connectedSockets: number;
    status: string | null;
  }>;
}

interface RoomNamespace {
  idFromName(name: string): unknown;
  get(id: unknown): unknown;
}

function roomStub(env: unknown, gameId: string): RoomStub {
  const ns = (env as { GAME_ROOM: RoomNamespace }).GAME_ROOM;
  return ns.get(ns.idFromName(gameId)) as RoomStub;
}

export const roomsRouter = router({
  listActive: adminProcedure
    .input(
      cursorInput.extend({
        status: roomStatus.optional(),
        gameType: z.string().max(40).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const conditions = [];
      if (input.status) conditions.push(eq(activeGames.status, input.status));
      if (input.gameType) {
        conditions.push(eq(activeGames.gameType, input.gameType));
      }
      if (input.cursor) {
        conditions.push(lt(activeGames.createdAt, new Date(input.cursor)));
      }

      const items = await ctx.db
        .select({
          id: activeGames.id,
          name: activeGames.name,
          gameType: activeGames.gameType,
          status: activeGames.status,
          isPublic: activeGames.isPublic,
          allowGuests: activeGames.allowGuests,
          maxPlayers: activeGames.maxPlayers,
          hostId: activeGames.hostId,
          hostName: user.name,
          createdAt: activeGames.createdAt,
          updatedAt: activeGames.updatedAt,
        })
        .from(activeGames)
        .leftJoin(user, eq(user.id, activeGames.hostId))
        .where(conditions.length ? and(...conditions) : undefined)
        .orderBy(desc(activeGames.createdAt))
        .limit(input.limit);

      const last = items.at(-1);
      return {
        items,
        nextCursor:
          items.length === input.limit && last
            ? last.createdAt.getTime()
            : null,
      };
    }),

  get: adminProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const room = await ctx.db
        .select({
          id: activeGames.id,
          name: activeGames.name,
          gameType: activeGames.gameType,
          status: activeGames.status,
          isPublic: activeGames.isPublic,
          allowGuests: activeGames.allowGuests,
          maxPlayers: activeGames.maxPlayers,
          config: activeGames.config,
          hostId: activeGames.hostId,
          hostName: user.name,
          createdAt: activeGames.createdAt,
          updatedAt: activeGames.updatedAt,
        })
        .from(activeGames)
        .leftJoin(user, eq(user.id, activeGames.hostId))
        .where(eq(activeGames.id, input.id))
        .limit(1)
        .get();

      if (!room) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Room not found" });
      }

      let live: { connectedSockets: number; status: string | null } | null =
        null;
      if (room.status !== "finished") {
        try {
          live = await roomStub(ctx.env, room.id).adminSnapshot();
        } catch {
          live = null;
        }
      }

      let parsedConfig: unknown = null;
      try {
        parsedConfig = JSON.parse(room.config);
      } catch {
        parsedConfig = null;
      }

      return { ...room, parsedConfig, live };
    }),

  forceClose: adminProcedure
    .input(
      z.object({ id: z.string(), reason: z.string().trim().max(200).optional() })
    )
    .mutation(async ({ ctx, input }) => {
      const room = await ctx.db
        .select({ id: activeGames.id, status: activeGames.status })
        .from(activeGames)
        .where(eq(activeGames.id, input.id))
        .limit(1)
        .get();

      if (!room) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Room not found" });
      }

      let closedSockets = 0;
      try {
        const result = await roomStub(ctx.env, room.id).adminClose(input.reason);
        closedSockets = result.closedSockets;
      } catch (error) {
        console.error("adminClose failed", error);
      }

      await ctx.db
        .update(activeGames)
        .set({ status: "finished", updatedAt: new Date() })
        .where(eq(activeGames.id, input.id));

      await recordAudit(ctx, "room.forceClose", "room", input.id, {
        previousStatus: room.status,
        reason: input.reason ?? null,
        closedSockets,
      });

      return { closedSockets };
    }),

  purgeFinished: adminProcedure
    .input(
      z.object({
        olderThanDays: z.number().int().min(1).max(365).default(7),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const cutoff = new Date(
        Date.now() - input.olderThanDays * 24 * 60 * 60 * 1000
      );

      const deleted = await ctx.db
        .delete(activeGames)
        .where(
          and(
            eq(activeGames.status, "finished"),
            lt(activeGames.updatedAt, cutoff)
          )
        )
        .returning({ id: activeGames.id });

      await recordAudit(ctx, "room.purgeFinished", "room", null, {
        olderThanDays: input.olderThanDays,
        deleted: deleted.length,
      });

      return { deleted: deleted.length };
    }),

  listHistory: adminProcedure
    .input(
      cursorInput.extend({
        gameType: z.string().max(40).optional(),
        hostId: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const conditions = [];
      if (input.gameType) {
        conditions.push(eq(gameHistory.gameType, input.gameType));
      }
      if (input.hostId) conditions.push(eq(gameHistory.hostId, input.hostId));
      if (input.cursor) {
        conditions.push(lt(gameHistory.createdAt, new Date(input.cursor)));
      }

      const items = await ctx.db
        .select({
          id: gameHistory.id,
          gameId: gameHistory.gameId,
          gameType: gameHistory.gameType,
          subjects: gameHistory.subjects,
          hostId: gameHistory.hostId,
          hostName: user.name,
          createdAt: gameHistory.createdAt,
          playerCount: sql<number>`(select count(*) from ${gamePlayerResults} where ${gamePlayerResults.gameId} = ${gameHistory.id})`.mapWith(
            Number
          ),
        })
        .from(gameHistory)
        .leftJoin(user, eq(user.id, gameHistory.hostId))
        .where(conditions.length ? and(...conditions) : undefined)
        .orderBy(desc(gameHistory.createdAt))
        .limit(input.limit);

      const last = items.at(-1);
      return {
        items,
        nextCursor:
          items.length === input.limit && last
            ? last.createdAt.getTime()
            : null,
      };
    }),

  getHistory: adminProcedure
    .input(z.object({ historyId: z.string() }))
    .query(async ({ ctx, input }) => {
      const history = await ctx.db
        .select({
          id: gameHistory.id,
          gameId: gameHistory.gameId,
          gameType: gameHistory.gameType,
          subjects: gameHistory.subjects,
          hostId: gameHistory.hostId,
          hostName: user.name,
          createdAt: gameHistory.createdAt,
        })
        .from(gameHistory)
        .leftJoin(user, eq(user.id, gameHistory.hostId))
        .where(eq(gameHistory.id, input.historyId))
        .limit(1)
        .get();

      if (!history) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Game not found" });
      }

      const [players, questionResults] = await Promise.all([
        ctx.db
          .select({
            id: gamePlayerResults.id,
            userId: gamePlayerResults.userId,
            playerName: gamePlayerResults.playerName,
            score: gamePlayerResults.score,
          })
          .from(gamePlayerResults)
          .where(eq(gamePlayerResults.gameId, input.historyId))
          .orderBy(desc(gamePlayerResults.score)),
        ctx.db
          .select({
            id: gameQuestionResults.id,
            userId: gameQuestionResults.userId,
            subjectName: gameQuestionResults.subjectName,
            subjectPosition: gameQuestionResults.subjectPosition,
            questionPosition: gameQuestionResults.questionPosition,
            correct: gameQuestionResults.correct,
            pointsAwarded: gameQuestionResults.pointsAwarded,
          })
          .from(gameQuestionResults)
          .where(eq(gameQuestionResults.gameId, input.historyId)),
      ]);

      let subjectNames: string[] = [];
      try {
        const parsed: unknown = JSON.parse(history.subjects);
        if (Array.isArray(parsed)) {
          subjectNames = parsed.filter(
            (item): item is string => typeof item === "string"
          );
        }
      } catch {
        subjectNames = [];
      }

      return { ...history, subjectNames, players, questionResults };
    }),

  deleteHistory: adminProcedure
    .input(z.object({ historyId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const deleted = await ctx.db
        .delete(gameHistory)
        .where(eq(gameHistory.id, input.historyId))
        .returning({ id: gameHistory.id });

      if (deleted.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Game not found" });
      }

      await recordAudit(ctx, "history.delete", "history", input.historyId, {});
      return { success: true as const };
    }),

  gameTypes: adminProcedure.query(async ({ ctx }) => {
    const [live, past] = await Promise.all([
      ctx.db
        .select({ gameType: activeGames.gameType, value: count() })
        .from(activeGames)
        .groupBy(activeGames.gameType),
      ctx.db
        .select({ gameType: gameHistory.gameType, value: count() })
        .from(gameHistory)
        .groupBy(gameHistory.gameType),
    ]);

    const types = new Set<string>();
    for (const row of [...live, ...past]) types.add(row.gameType);
    return [...types].sort();
  }),
});
