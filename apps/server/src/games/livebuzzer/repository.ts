import { createDb, inArray, eq, schema } from "@zeyn/db";
import {
  livebuzzerConfigSchema,
  type LivebuzzerConfig,
  type LivebuzzerState,
} from "@zeyn/api/games";
import type { RoomMeta } from "@zeyn/game-engine";

const D1_MAX_PARAMS_PER_QUERY = 99;

function chunk<T>(items: T[], size: number): T[][] {
  const perChunk = Math.max(1, Math.floor(size));
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += perChunk) {
    chunks.push(items.slice(i, i + perChunk));
  }
  return chunks;
}

export function parseLivebuzzerConfig(raw: string): LivebuzzerConfig {
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    json = {};
  }
  const parsed = livebuzzerConfigSchema.safeParse(json);
  return parsed.success ? parsed.data : livebuzzerConfigSchema.parse({});
}

export interface LivebuzzerRoomRecord extends RoomMeta {
  id: string;
  config: LivebuzzerConfig;
}

export class LivebuzzerRepository {
  private readonly db: ReturnType<typeof createDb>;

  constructor(binding: D1Database) {
    this.db = createDb(binding);
  }

  async getRoom(gameId: string): Promise<LivebuzzerRoomRecord | undefined> {
    const room = await this.db
      .select()
      .from(schema.activeGames)
      .where(eq(schema.activeGames.id, gameId))
      .get();
    if (!room) return undefined;

    return {
      id: room.id,
      name: room.name,
      hostId: room.hostId,
      maxPlayers: room.maxPlayers,
      isPublic: room.isPublic,
      password: room.password,
      allowGuests: room.allowGuests,
      status: room.status,
      config: parseLivebuzzerConfig(room.config),
    };
  }

  async persistResults(state: LivebuzzerState): Promise<void> {
    if (!state.hostId) return;
    const hostId = state.hostId;
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
        gameType: "livebuzzer",
        hostId,
        subjects: "[]",
        createdAt: new Date(),
      }),
    ];

    const scoringPlayers = Object.values(state.players).filter(p => {
      if (!validUserIds.has(p.id)) return false;
      return state.config.hostPlays || p.id !== hostId;
    });

    if (scoringPlayers.length > 0) {
      const rows = scoringPlayers.map(p => ({
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
