import type { BaseGameState, EngineDirectives } from "@zeyn/api/game-types";
import type { JoinParams, RoomGame } from "@zeyn/game-engine";

export type { JoinParams, RoomGame };

/** What `hydrate` reports back to the durable object after the first join. */
export interface HydrateResult {
  /** Error directives if the room can't be joined; otherwise an empty object. */
  directives: EngineDirectives;
  /** The room's secret password for the DO to persist; null if the room is open. */
  roomPassword: string | null;
}

export interface ServerRoomGame extends RoomGame {
  hydrate(state: BaseGameState, gameId: string): Promise<HydrateResult>;
  persistResults(state: BaseGameState): Promise<void>;
}

/** Creates a per-room game instance for a given game type. */
export type RoomGameFactory = (db: D1Database) => ServerRoomGame;
