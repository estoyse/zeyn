// All database access for a GameRoom, kept out of the Durable Object and the
// pure engine. The DO holds one instance and calls these methods to hydrate a
// room, flip its status, and flush results when a match ends.

import { createDb, inArray, eq, schema } from "@zeyn/db";
import type { GameState, Subject } from "@zeyn/api/game-types";
import { mapSubjects, type RoomRow } from "./engine";

// Cloudflare D1 rejects any query with more than 100 bound parameters, so
// multi-row inserts are chunked to keep (columns * rows) under this ceiling.
const D1_MAX_PARAMS_PER_QUERY = 99;

function chunk<T>(items: T[], size: number): T[][] {
  const maxPerChunk = Math.max(1, Math.floor(size));
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += maxPerChunk) {
    chunks.push(items.slice(i, i + maxPerChunk));
  }
  return chunks;
}

/** The room row plus the fields the DO needs beyond `RoomRow` (subject ids). */
export interface RoomRecord extends RoomRow {
  id: string;
  subjectIds: string[];
}

export class GameRepository {
  private readonly db: ReturnType<typeof createDb>;

  constructor(binding: D1Database) {
    this.db = createDb(binding);
  }

  /** Load the room row, or `undefined` if it no longer exists. */
  async getRoom(gameId: string): Promise<RoomRecord | undefined> {
    const room = await this.db
      .select()
      .from(schema.activeGames)
      .where(eq(schema.activeGames.id, gameId))
      .get();

    if (!room) return undefined;
    const config = JSON.parse(room.config) as { subjectIds?: string[] };
    return {
      id: room.id,
      name: room.name,
      hostId: room.hostId,
      maxPlayers: room.maxPlayers,
      isPublic: room.isPublic,
      password: room.password,
      status: room.status,
      subjectIds: config.subjectIds ?? [],
    };
  }

  /** Load the given subjects with their questions, ready for the game state. */
  async loadSubjects(subjectIds: string[]): Promise<Subject[]> {
    const [subjectsData, questionsData] = await Promise.all([
      this.db
        .select()
        .from(schema.subjects)
        .where(inArray(schema.subjects.id, subjectIds)),
      this.db
        .select()
        .from(schema.questions)
        .where(inArray(schema.questions.subjectId, subjectIds)),
    ]);
    return mapSubjects(subjectsData, questionsData);
  }

  /**
   * Persist a finished match: one history row, its per-question results, and the
   * final player scoreboard. Inserts are chunked to respect D1's parameter cap
   * (9-column rows -> 11/query, 5-column rows -> 20/query).
   */
  async persistResults(state: GameState): Promise<void> {
    if (!state.hostId) return;
    const historyId = crypto.randomUUID();

    await this.db.insert(schema.gameHistory).values({
      id: historyId,
      gameId: state.gameId || "unknown",
      gameType: "buzzer",
      hostId: state.hostId,
      subjects: JSON.stringify(state.subjects.map(s => s.name)),
      createdAt: new Date(),
    });

    if (state.questionResults.length > 0) {
      const rows = state.questionResults.map(r => ({
        id: crypto.randomUUID(),
        gameId: historyId,
        userId: r.userId,
        questionId: r.questionId,
        subjectName: r.subjectName,
        subjectPosition: r.subjectIndex,
        questionPosition: r.questionIndex,
        correct: r.correct,
        pointsAwarded: r.pointsAwarded,
      }));
      for (const part of chunk(rows, D1_MAX_PARAMS_PER_QUERY / 9)) {
        await this.db.insert(schema.gameQuestionResults).values(part);
      }
    }

    const players = Object.values(state.players);
    if (players.length > 0) {
      const rows = players.map(p => ({
        id: crypto.randomUUID(),
        gameId: historyId,
        userId: p.id,
        playerName: p.name,
        score: p.score,
      }));
      for (const part of chunk(rows, D1_MAX_PARAMS_PER_QUERY / 5)) {
        await this.db.insert(schema.gamePlayerResults).values(part);
      }
    }
  }
}
