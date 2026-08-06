import type { MusicQuizState } from "@zeyn/api/games";
import type {
  BaseGameState,
  BasePublicGameState,
  EngineDirectives,
} from "@zeyn/api/game-types";
import type { HydrateResult, ServerRoomGame } from "../contract";
import type { JoinParams } from "@zeyn/game-engine";
import { hydrateBase, joinPlayer } from "@zeyn/game-engine";
import {
  answer,
  buildQuestions,
  createInitialState,
  handleTimeout,
  start,
} from "./engine";
import { MusicRepository } from "./repository";
import { MusicSerializer } from "./serializer";

class MusicGame implements ServerRoomGame {
  readonly type = "music";
  private readonly repo: MusicRepository;
  private readonly serializer = new MusicSerializer();

  constructor(db: D1Database) {
    this.repo = new MusicRepository(db);
  }

  createInitialState(): BaseGameState {
    return createInitialState();
  }

  async hydrate(base: BaseGameState, gameId: string): Promise<HydrateResult> {
    const state = base as MusicQuizState;
    const room = await this.repo.getRoom(gameId);
    const directives = hydrateBase(state, gameId, room);
    if (directives.reply) return { directives, roomPassword: null };
    state.artistIds = room!.artistIds;
    return { directives, roomPassword: room!.password };
  }

  join(base: BaseGameState, params: JoinParams): EngineDirectives {
    return joinPlayer(base, params);
  }

  async start(
    base: BaseGameState,
    playerId: string,
    now: number
  ): Promise<EngineDirectives> {
    const state = base as MusicQuizState;
    if (state.questions.length === 0) {
      const songs = await this.repo.loadSongs(state.artistIds);
      state.questions = buildQuestions(songs);
    }
    return start(state, playerId, now);
  }

  handleAction(
    base: BaseGameState,
    action: unknown,
    now: number
  ): EngineDirectives {
    const msg = action as { type: string; playerId: string; optionIndex?: number };
    if (msg.type === "ANSWER") {
      return answer(base as MusicQuizState, msg.playerId, msg.optionIndex ?? -1, now);
    }
    return { noChange: true };
  }

  handleTimeout(base: BaseGameState, now: number): EngineDirectives {
    return handleTimeout(base as MusicQuizState, now);
  }

  toPublic(base: BaseGameState, forceFullPlayers = false): BasePublicGameState {
    return this.serializer.toPublic(base as MusicQuizState, forceFullPlayers);
  }

  async persistResults(base: BaseGameState): Promise<void> {
    await this.repo.persistResults(base as MusicQuizState);
  }
}

export function createMusicGame(db: D1Database): ServerRoomGame {
  return new MusicGame(db);
}
