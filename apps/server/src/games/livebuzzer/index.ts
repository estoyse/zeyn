import type { LivebuzzerState } from "@zeyn/api/games";
import type {
  BaseGameState,
  BasePublicGameState,
  EngineDirectives,
  LivebuzzerAction,
} from "@zeyn/api/game-types";
import type { HydrateResult, ServerRoomGame } from "../contract";
import type { JoinParams } from "@zeyn/game-engine";
import { hydrateBase, joinPlayer } from "@zeyn/game-engine";
import {
  adjustScore,
  arm,
  buzz,
  createInitialState,
  endGame,
  handleTimeout,
  judge,
  skipRound,
  start,
} from "@zeyn/game-engine/livebuzzer/engine";
import { LivebuzzerSerializer } from "@zeyn/game-engine/livebuzzer/serializer";
import { LivebuzzerRepository } from "./repository";

class LivebuzzerGame implements ServerRoomGame {
  readonly type = "livebuzzer";
  private readonly repo: LivebuzzerRepository;
  private readonly serializer = new LivebuzzerSerializer();

  constructor(db: D1Database) {
    this.repo = new LivebuzzerRepository(db);
  }

  createInitialState(): BaseGameState {
    return createInitialState();
  }

  async hydrate(base: BaseGameState, gameId: string): Promise<HydrateResult> {
    const state = base as LivebuzzerState;
    const room = await this.repo.getRoom(gameId);
    const directives = hydrateBase(state, gameId, room);
    if (directives.reply) return { directives, roomPassword: null };
    state.config = room!.config;
    return { directives, roomPassword: room!.password };
  }

  join(base: BaseGameState, params: JoinParams): EngineDirectives {
    return joinPlayer(base, { ...params, allowLateJoin: true });
  }

  async start(
    base: BaseGameState,
    playerId: string,
    now: number
  ): Promise<EngineDirectives> {
    return start(base as LivebuzzerState, playerId, now);
  }

  handleAction(
    base: BaseGameState,
    action: unknown,
    now: number
  ): EngineDirectives {
    const state = base as LivebuzzerState;
    const msg = action as LivebuzzerAction;
    switch (msg.type) {
      case "BUZZ":
        return buzz(state, msg.playerId, msg.reactionMs, now);
      case "ARM":
        return arm(state, msg.playerId, now);
      case "JUDGE":
        return judge(state, msg.playerId, msg.correct, now);
      case "SKIP_ROUND":
        return skipRound(state, msg.playerId, now);
      case "ADJUST_SCORE":
        return adjustScore(state, msg.playerId, msg.targetId, msg.delta);
      case "END_GAME":
        return endGame(state, msg.playerId, now);
      default:
        return { noChange: true };
    }
  }

  handleTimeout(base: BaseGameState, now: number): EngineDirectives {
    return handleTimeout(base as LivebuzzerState, now);
  }

  toPublic(base: BaseGameState, forceFullPlayers = false): BasePublicGameState {
    return this.serializer.toPublic(base as LivebuzzerState, forceFullPlayers);
  }

  async persistResults(base: BaseGameState): Promise<void> {
    await this.repo.persistResults(base as LivebuzzerState);
  }
}

export function createLivebuzzerGame(db: D1Database): ServerRoomGame {
  return new LivebuzzerGame(db);
}
