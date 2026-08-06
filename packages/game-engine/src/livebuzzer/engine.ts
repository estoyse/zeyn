import {
  BUZZ_COLLECTION_MS,
  LIVEBUZZER_FINISHED_CLEANUP_GRACE_MS,
  LIVEBUZZER_INACTIVITY_MS,
  LIVEBUZZER_MIN_PLAYERS,
  MIN_REACTION_MS,
  livebuzzerConfigSchema,
  type LivebuzzerBuzz,
  type LivebuzzerState,
} from "@zeyn/api/games";
import type { EngineDirectives } from "@zeyn/api/game-types";
import { gameError, initBaseState } from "../base";

export function createInitialState(): LivebuzzerState {
  return {
    ...initBaseState("livebuzzer"),
    config: livebuzzerConfigSchema.parse({}),
    phase: "IDLE",
    round: 0,
    armedAt: 0,
    timerExpiresAt: 0,
    buzzes: [],
    lockedPlayerId: null,
    lockedOutPlayerIds: [],
    wrongAttempts: 0,
    roundResults: [],
  };
}

export function hasLiveClock(state: LivebuzzerState): boolean {
  if (state.status !== "PLAYING") return false;
  switch (state.phase) {
    case "IDLE":
      return false;
    case "ARMED":
      return state.config.buzzWindowMs > 0;
    case "COLLECTING":
      return false;
    case "LOCKED":
      return state.config.answerTimeMs > 0;
  }
}

export function isEligibleBuzzer(
  state: LivebuzzerState,
  playerId: string
): boolean {
  const player = state.players[playerId];
  if (!player?.connected) return false;
  if (playerId === state.hostId && !state.config.hostPlays) return false;
  if (state.lockedOutPlayerIds.includes(playerId)) return false;
  return true;
}

function eligibleBuzzerIds(state: LivebuzzerState): string[] {
  return Object.keys(state.players).filter(id => isEligibleBuzzer(state, id));
}

function hostOnly(
  state: LivebuzzerState,
  playerId: string,
  action: string
): EngineDirectives | null {
  if (state.hostId !== playerId) {
    return { reply: gameError(`Only the host can ${action}`) };
  }
  return null;
}

function idleDeadline(now: number): number {
  return now + LIVEBUZZER_INACTIVITY_MS;
}

function armedDeadline(state: LivebuzzerState, now: number): number {
  const window = state.config.buzzWindowMs;
  return now + (window > 0 ? window : LIVEBUZZER_INACTIVITY_MS);
}

function lockedDeadline(state: LivebuzzerState, now: number): number {
  const window = state.config.answerTimeMs;
  return now + (window > 0 ? window : LIVEBUZZER_INACTIVITY_MS);
}

function toIdle(state: LivebuzzerState, now: number): EngineDirectives {
  state.phase = "IDLE";
  state.lockedPlayerId = null;
  state.buzzes = [];
  state.timerExpiresAt = idleDeadline(now);
  return { alarmAt: state.timerExpiresAt };
}

function openBuzzWindow(state: LivebuzzerState, now: number): EngineDirectives {
  state.phase = "ARMED";
  state.armedAt = now;
  state.buzzes = [];
  state.lockedPlayerId = null;
  state.timerExpiresAt = armedDeadline(state, now);
  return { alarmAt: state.timerExpiresAt };
}

function finishGame(state: LivebuzzerState, now: number): EngineDirectives {
  state.status = "FINISHED";
  state.phase = "IDLE";
  state.lockedPlayerId = null;
  state.timerExpiresAt = 0;
  return {
    updateRoomStatus: "finished",
    persistResults: true,
    alarmAt: now + LIVEBUZZER_FINISHED_CLEANUP_GRACE_MS,
  };
}

export function start(
  state: LivebuzzerState,
  playerId: string,
  now: number
): EngineDirectives {
  const denied = hostOnly(state, playerId, "start the game");
  if (denied) return denied;
  if (state.status !== "WAITING") {
    return { reply: gameError("Game already started") };
  }
  if (Object.keys(state.players).length < LIVEBUZZER_MIN_PLAYERS) {
    return {
      reply: gameError(
        `Need at least ${LIVEBUZZER_MIN_PLAYERS} players to start`
      ),
    };
  }
  if (eligibleBuzzerIds(state).length === 0) {
    return { reply: gameError("Need at least one player who can buzz") };
  }

  state.status = "PLAYING";
  state.round = 0;
  state.armedAt = 0;
  state.buzzes = [];
  state.lockedPlayerId = null;
  state.lockedOutPlayerIds = [];
  state.wrongAttempts = 0;
  state.roundResults = [];
  state.phase = "IDLE";
  state.timerExpiresAt = idleDeadline(now);
  return { updateRoomStatus: "playing", alarmAt: state.timerExpiresAt };
}

export function arm(
  state: LivebuzzerState,
  playerId: string,
  now: number
): EngineDirectives {
  const denied = hostOnly(state, playerId, "open the buzzer");
  if (denied) return denied;
  if (state.status !== "PLAYING") {
    return { reply: gameError("Game is not in progress") };
  }
  if (state.phase !== "IDLE") {
    return { reply: gameError("A round is already in progress") };
  }

  state.round += 1;
  state.lockedOutPlayerIds = [];
  state.wrongAttempts = 0;
  return openBuzzWindow(state, now);
}

export function clampReactionMs(
  reactionMs: number,
  roundAgeMs: number
): number {
  if (!Number.isFinite(reactionMs)) return MIN_REACTION_MS;
  const ceiling = Math.max(MIN_REACTION_MS, roundAgeMs);
  return Math.min(Math.max(reactionMs, MIN_REACTION_MS), ceiling);
}

export function buzz(
  state: LivebuzzerState,
  playerId: string,
  reactionMs: number,
  now: number
): EngineDirectives {
  if (state.status !== "PLAYING") return { noChange: true };
  if (state.phase !== "ARMED" && state.phase !== "COLLECTING") {
    return { noChange: true };
  }
  if (!isEligibleBuzzer(state, playerId)) return { noChange: true };
  if (state.buzzes.some(b => b.playerId === playerId)) return { noChange: true };

  state.buzzes.push({
    playerId,
    reactionMs: clampReactionMs(reactionMs, now - state.armedAt),
    arrivedAt: now,
  });

  if (state.phase === "COLLECTING") return {};

  state.phase = "COLLECTING";
  state.timerExpiresAt = now + BUZZ_COLLECTION_MS;
  return { alarmAt: state.timerExpiresAt };
}

function fastestBuzz(state: LivebuzzerState): LivebuzzerBuzz | undefined {
  let best: LivebuzzerBuzz | undefined;
  for (const candidate of state.buzzes) {
    if (!isEligibleBuzzer(state, candidate.playerId)) continue;
    if (!best || beats(candidate, best)) best = candidate;
  }
  return best;
}

function beats(candidate: LivebuzzerBuzz, best: LivebuzzerBuzz): boolean {
  if (candidate.reactionMs !== best.reactionMs) {
    return candidate.reactionMs < best.reactionMs;
  }
  if (candidate.arrivedAt !== best.arrivedAt) {
    return candidate.arrivedAt < best.arrivedAt;
  }
  return candidate.playerId < best.playerId;
}

function lockFastestBuzzer(
  state: LivebuzzerState,
  now: number
): EngineDirectives {
  const winner = fastestBuzz(state);
  if (!winner) return toIdle(state, now);

  state.phase = "LOCKED";
  state.lockedPlayerId = winner.playerId;
  state.timerExpiresAt = lockedDeadline(state, now);
  return { alarmAt: state.timerExpiresAt };
}

function applyJudgement(
  state: LivebuzzerState,
  correct: boolean,
  now: number,
  autoJudged: boolean
): EngineDirectives {
  const judgedId = state.lockedPlayerId;
  if (!judgedId) return toIdle(state, now);

  const player = state.players[judgedId];
  const winningBuzz = state.buzzes.find(b => b.playerId === judgedId);
  const pointsAwarded = correct
    ? state.config.pointsPerCorrect
    : -state.config.penaltyPerWrong;
  if (player) player.score += pointsAwarded;

  state.roundResults.push({
    round: state.round,
    playerId: judgedId,
    playerName: player?.name ?? "",
    correct,
    pointsAwarded,
    reactionMs: winningBuzz?.reactionMs ?? 0,
    autoJudged,
    judgedAt: now,
  });

  state.lockedPlayerId = null;
  if (correct) return toIdle(state, now);

  if (!state.lockedOutPlayerIds.includes(judgedId)) {
    state.lockedOutPlayerIds.push(judgedId);
  }
  state.wrongAttempts += 1;

  if (state.wrongAttempts >= state.config.maxWrongPerRound) {
    return toIdle(state, now);
  }
  if (eligibleBuzzerIds(state).length === 0) return toIdle(state, now);
  return openBuzzWindow(state, now);
}

export function judge(
  state: LivebuzzerState,
  playerId: string,
  correct: boolean,
  now: number
): EngineDirectives {
  const denied = hostOnly(state, playerId, "judge an answer");
  if (denied) return denied;
  if (state.status !== "PLAYING" || state.phase !== "LOCKED") {
    return { reply: gameError("There is no answer to judge") };
  }
  return applyJudgement(state, correct, now, false);
}

export function skipRound(
  state: LivebuzzerState,
  playerId: string,
  now: number
): EngineDirectives {
  const denied = hostOnly(state, playerId, "skip the round");
  if (denied) return denied;
  if (state.status !== "PLAYING") {
    return { reply: gameError("Game is not in progress") };
  }
  if (state.phase === "IDLE") {
    return { reply: gameError("There is no round to skip") };
  }
  return toIdle(state, now);
}

export function adjustScore(
  state: LivebuzzerState,
  playerId: string,
  targetId: string,
  delta: number
): EngineDirectives {
  const denied = hostOnly(state, playerId, "adjust scores");
  if (denied) return denied;
  if (state.status !== "PLAYING") {
    return { reply: gameError("Game is not in progress") };
  }
  const target = state.players[targetId];
  if (!target) return { reply: gameError("Unknown player") };

  target.score += delta;
  return {};
}

export function endGame(
  state: LivebuzzerState,
  playerId: string,
  now: number
): EngineDirectives {
  const denied = hostOnly(state, playerId, "end the game");
  if (denied) return denied;
  if (state.status !== "PLAYING") {
    return { reply: gameError("Game is not in progress") };
  }
  return finishGame(state, now);
}

export function handleTimeout(
  state: LivebuzzerState,
  now: number
): EngineDirectives {
  if (state.status !== "PLAYING") return { noChange: true };
  if (now < state.timerExpiresAt) {
    return { noChange: true, alarmAt: state.timerExpiresAt };
  }

  switch (state.phase) {
    case "IDLE":
      return finishGame(state, now);
    case "ARMED":
      return state.config.buzzWindowMs > 0
        ? toIdle(state, now)
        : finishGame(state, now);
    case "COLLECTING":
      return lockFastestBuzzer(state, now);
    case "LOCKED":
      return state.config.answerTimeMs > 0
        ? applyJudgement(state, false, now, true)
        : finishGame(state, now);
  }
}
