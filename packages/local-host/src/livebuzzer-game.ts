import type {
  EngineDirectives,
  LivebuzzerAction,
} from "@zeyn/api/game-types";
import type { LivebuzzerPublicState, LivebuzzerState } from "@zeyn/api/games";
import type { JoinParams } from "@zeyn/game-engine";
import { joinPlayer } from "@zeyn/game-engine";
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

export interface LocalRoomGame {
  createInitialState(): LivebuzzerState;
  join(state: LivebuzzerState, params: JoinParams): EngineDirectives;
  start(
    state: LivebuzzerState,
    playerId: string,
    now: number
  ): EngineDirectives;
  handleAction(
    state: LivebuzzerState,
    action: unknown,
    now: number
  ): EngineDirectives;
  handleTimeout(state: LivebuzzerState, now: number): EngineDirectives;
  toPublic(
    state: LivebuzzerState,
    forceFullPlayers?: boolean
  ): LivebuzzerPublicState;
}

class LivebuzzerLocalGame implements LocalRoomGame {
  private readonly serializer = new LivebuzzerSerializer();

  createInitialState(): LivebuzzerState {
    return createInitialState();
  }

  join(state: LivebuzzerState, params: JoinParams): EngineDirectives {
    return joinPlayer(state, { ...params, allowLateJoin: true });
  }

  start(
    state: LivebuzzerState,
    playerId: string,
    now: number
  ): EngineDirectives {
    return start(state, playerId, now);
  }

  handleAction(
    state: LivebuzzerState,
    action: unknown,
    now: number
  ): EngineDirectives {
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

  handleTimeout(state: LivebuzzerState, now: number): EngineDirectives {
    return handleTimeout(state, now);
  }

  toPublic(
    state: LivebuzzerState,
    forceFullPlayers = false
  ): LivebuzzerPublicState {
    return this.serializer.toPublic(state, forceFullPlayers);
  }
}

export function createLivebuzzerLocalGame(): LocalRoomGame {
  return new LivebuzzerLocalGame();
}
