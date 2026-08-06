import { createDb, inArray, eq, schema } from "@zeyn/db";
import type { MusicQuizState } from "@zeyn/api/games";
import type { RoomMeta } from "@zeyn/game-engine";
import type { SongRow } from "./engine";

const D1_MAX_PARAMS_PER_QUERY = 99;

function chunk<T>(items: T[], size: number): T[][] {
  const perChunk = Math.max(1, Math.floor(size));
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += perChunk) {
    chunks.push(items.slice(i, i + perChunk));
  }
  return chunks;
}

export interface MusicRoomRecord extends RoomMeta {
  id: string;
  artistIds: string[];
}

export class MusicRepository {
  private readonly db: ReturnType<typeof createDb>;

  constructor(binding: D1Database) {
    this.db = createDb(binding);
  }

  async getRoom(gameId: string): Promise<MusicRoomRecord | undefined> {
    const room = await this.db
      .select()
      .from(schema.activeGames)
      .where(eq(schema.activeGames.id, gameId))
      .get();
    if (!room) return undefined;

    const config = JSON.parse(room.config) as { artistIds?: string[] };
    return {
      id: room.id,
      name: room.name,
      hostId: room.hostId,
      maxPlayers: room.maxPlayers,
      isPublic: room.isPublic,
      password: room.password,
      allowGuests: room.allowGuests,
      status: room.status,
      artistIds: config.artistIds ?? [],
    };
  }

  async loadSongs(artistIds: string[]): Promise<SongRow[]> {
    if (artistIds.length === 0) return [];
    const rows = await this.db
      .select({
        id: schema.songs.id,
        title: schema.songs.title,
        previewUrl: schema.songs.previewUrl,
        artistName: schema.artists.name,
      })
      .from(schema.songs)
      .innerJoin(schema.artists, eq(schema.songs.artistId, schema.artists.id))
      .where(inArray(schema.songs.artistId, artistIds));
    return rows;
  }

  async persistResults(state: MusicQuizState): Promise<void> {
    if (!state.hostId) return;
    const historyId = state.gameId ?? crypto.randomUUID();

    const existing = await this.db
      .select({ id: schema.gameHistory.id })
      .from(schema.gameHistory)
      .where(eq(schema.gameHistory.id, historyId))
      .get();
    if (existing) return;

    const playerIds = Object.keys(state.players);
    const validUserIds = new Set(
      playerIds.length > 0
        ? (
            await this.db
              .select({ id: schema.user.id })
              .from(schema.user)
              .where(inArray(schema.user.id, playerIds))
          ).map(u => u.id)
        : []
    );

    const statements: Parameters<typeof this.db.batch>[0][number][] = [
      this.db.insert(schema.gameHistory).values({
        id: historyId,
        gameId: state.gameId || "unknown",
        gameType: "music",
        hostId: state.hostId,
        subjects: "[]",
        createdAt: new Date(),
      }),
    ];

    const players = Object.values(state.players).filter(p =>
      validUserIds.has(p.id)
    );
    if (players.length > 0) {
      const rows = players.map(p => ({
        id: crypto.randomUUID(),
        gameId: historyId,
        userId: p.id,
        playerName: p.name,
        score: p.score,
      }));
      for (const part of chunk(rows, D1_MAX_PARAMS_PER_QUERY / 5)) {
        statements.push(this.db.insert(schema.gamePlayerResults).values(part));
      }
    }

    await this.db.batch(
      statements as unknown as Parameters<typeof this.db.batch>[0]
    );
  }
}
