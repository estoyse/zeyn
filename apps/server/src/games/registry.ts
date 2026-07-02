import { getGameMeta } from "@shaxsiy-oyin/api/games";
import { createDb, eq, schema } from "@shaxsiy-oyin/db";
import type { RoomGame, RoomGameFactory } from "./contract";
import { createBuzzerGame } from "./buzzer";
import { createMusicGame } from "./music";

// Maps a game type to the factory that builds its per-room engine instance. The
// GameRoom durable object reads the room's `gameType` and resolves the engine
// here — it never imports a specific game. Adding a game type is one entry here
// plus its meta in `@shaxsiy-oyin/api/games`.
const factories: Record<string, RoomGameFactory> = {
  buzzer: createBuzzerGame,
  music: createMusicGame,
};

export const DEFAULT_GAME_TYPE = "buzzer";

/**
 * Build the engine for a room's game type. Falls back to the default type for an
 * unknown/empty value (e.g. legacy rows written before `gameType` existed).
 */
export function createRoomGame(gameType: string, db: D1Database): RoomGame {
  const factory = factories[gameType] ?? factories[DEFAULT_GAME_TYPE]!;
  return factory(db);
}

export function isKnownGameType(gameType: string): boolean {
  return getGameMeta(gameType) !== undefined && gameType in factories;
}

/**
 * Read a room's game type before its engine is chosen. Returns the default type
 * for a missing/legacy value; returns null only if the room row doesn't exist.
 */
export async function getRoomGameType(
  db: D1Database,
  gameId: string
): Promise<string | null> {
  const row = await createDb(db)
    .select({ gameType: schema.activeGames.gameType })
    .from(schema.activeGames)
    .where(eq(schema.activeGames.id, gameId))
    .get();
  if (!row) return null;
  return row.gameType || DEFAULT_GAME_TYPE;
}

/** Update a room's lifecycle status. Platform-level; game-type agnostic. */
export async function updateRoomStatus(
  db: D1Database,
  gameId: string,
  status: "waiting" | "playing" | "finished"
): Promise<void> {
  await createDb(db)
    .update(schema.activeGames)
    .set({ status })
    .where(eq(schema.activeGames.id, gameId));
}
