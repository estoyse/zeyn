import type {
  BaseGameState,
  EngineDirectives,
  GameState,
  PublicGameState,
} from "@zeyn/api/game-types";
import type { HydrateResult, JoinParams, RoomGame } from "../contract";
import {
  buzz,
  createInitialState,
  hydrateRoom,
  join,
  start,
  submitAnswer,
  handleTimeout,
} from "./engine";
import { GameRepository } from "./repository";
import { StateSerializer } from "./serializer";

/**
 * The buzzer trivia game as a platform game module. Wraps the pure engine
 * transitions, the DB repository, and the public-state serializer behind the
 * `RoomGame` interface the durable object dispatches to. The `state as GameState`
 * casts reflect that the DO holds this instance's state opaquely as
 * `BaseGameState` but it is always the buzzer's concrete state.
 */
class BuzzerGame implements RoomGame {
  readonly type = "buzzer";
  private readonly repo: GameRepository;
  private readonly serializer = new StateSerializer();

  constructor(db: D1Database) {
    this.repo = new GameRepository(db);
  }

  createInitialState(): BaseGameState {
    return createInitialState();
  }

  async hydrate(base: BaseGameState, gameId: string): Promise<HydrateResult> {
    const state = base as GameState;
    const room = await this.repo.getRoom(gameId);
    const directives = hydrateRoom(state, gameId, room);
    if (directives.reply) return { directives, roomPassword: null };

    state.subjects = await this.repo.loadSubjects(room!.subjectIds);
    return { directives, roomPassword: room!.password };
  }

  join(base: BaseGameState, params: JoinParams): EngineDirectives {
    return join(base as GameState, params);
  }

  async start(
    base: BaseGameState,
    playerId: string,
    now: number
  ): Promise<EngineDirectives> {
    return start(base as GameState, playerId, now);
  }

  handleAction(
    base: BaseGameState,
    action: unknown,
    now: number
  ): EngineDirectives {
    const state = base as GameState;
    const msg = action as { type: string; playerId: string; answer?: string };
    switch (msg.type) {
      case "BUZZ":
        return buzz(state, msg.playerId, now);
      case "SUBMIT_ANSWER":
        return submitAnswer(state, msg.playerId, msg.answer ?? "", now);
      default:
        return { noChange: true };
    }
  }

  handleTimeout(base: BaseGameState, now: number): EngineDirectives {
    return handleTimeout(base as GameState, now);
  }

  toPublic(base: BaseGameState, forceFullPlayers = false): PublicGameState {
    return this.serializer.toPublic(base as GameState, forceFullPlayers);
  }

  async persistResults(base: BaseGameState): Promise<void> {
    await this.repo.persistResults(base as GameState);
  }
}

export function createBuzzerGame(db: D1Database): RoomGame {
  return new BuzzerGame(db);
}
