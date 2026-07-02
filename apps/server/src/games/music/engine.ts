import {
  musicGameConfig,
  type MusicQuestion,
  type MusicQuizState,
} from "@shaxsiy-oyin/api/games";
import type { EngineDirectives } from "@shaxsiy-oyin/api/game-types";
import { gameError, initBaseState } from "../base";

export interface SongRow {
  id: string;
  title: string;
  previewUrl: string;
  artistName: string;
}

export function createInitialState(): MusicQuizState {
  return {
    ...initBaseState("music"),
    artistIds: [],
    questions: [],
    currentQuestionIndex: 0,
    phase: "QUESTION",
    timerExpiresAt: 0,
    answers: {},
    streaks: {},
  };
}

function shuffle<T>(items: T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

export function buildQuestions(songs: SongRow[]): MusicQuestion[] {
  const pool = songs.filter(s => s.previewUrl && s.title);
  const uniqueTitles = new Set(pool.map(s => s.title));
  if (pool.length < musicGameConfig.optionsPerQuestion || uniqueTitles.size < 2) {
    return [];
  }

  const picked = shuffle(pool).slice(0, musicGameConfig.questionCount);

  return picked.map(song => {
    const distractors = shuffle(
      pool.filter(s => s.title.toLowerCase() !== song.title.toLowerCase())
    );
    const optionTitles = [song.title];
    for (const d of distractors) {
      if (optionTitles.length >= musicGameConfig.optionsPerQuestion) break;
      if (!optionTitles.some(t => t.toLowerCase() === d.title.toLowerCase())) {
        optionTitles.push(d.title);
      }
    }
    const options = shuffle(optionTitles);
    return {
      songId: song.id,
      previewUrl: song.previewUrl,
      correctTitle: song.title,
      artistName: song.artistName,
      options,
      correctIndex: options.indexOf(song.title),
    };
  });
}

function beginQuestion(state: MusicQuizState, now: number): number {
  state.phase = "QUESTION";
  state.answers = {};
  state.timerExpiresAt = now + musicGameConfig.questionTimeMs;
  return state.timerExpiresAt;
}

export function start(
  state: MusicQuizState,
  playerId: string,
  now: number
): EngineDirectives {
  if (state.hostId !== playerId) {
    return { reply: gameError("Only the host can start the game") };
  }
  if (state.status !== "WAITING") {
    return { reply: gameError("Game already started") };
  }
  if (Object.keys(state.players).length < musicGameConfig.minPlayers) {
    return {
      reply: gameError(
        `Need at least ${musicGameConfig.minPlayers} players to start`
      ),
    };
  }
  if (state.questions.length === 0) {
    return { reply: gameError("Not enough songs to start this quiz") };
  }

  state.status = "PLAYING";
  state.currentQuestionIndex = 0;
  state.streaks = {};
  const alarmAt = beginQuestion(state, now);
  return { updateRoomStatus: "playing", alarmAt };
}

function scoreCorrect(
  state: MusicQuizState,
  playerId: string,
  now: number
): number {
  const remaining = Math.max(0, state.timerExpiresAt - now);
  const ratio = Math.min(1, remaining / musicGameConfig.questionTimeMs);
  const speedBonus = Math.round(musicGameConfig.maxSpeedBonus * ratio);
  const currentStreak = state.streaks[playerId] ?? 0;
  const streakBonus = Math.min(
    currentStreak * musicGameConfig.streakBonusPerLevel,
    musicGameConfig.maxStreakBonus
  );
  state.streaks[playerId] = currentStreak + 1;
  return musicGameConfig.basePoints + speedBonus + streakBonus;
}

function connectedCount(state: MusicQuizState): number {
  return Object.values(state.players).filter(p => p.connected).length;
}

export function answer(
  state: MusicQuizState,
  playerId: string,
  optionIndex: number,
  now: number
): EngineDirectives {
  if (state.status !== "PLAYING" || state.phase !== "QUESTION") return {};
  const player = state.players[playerId];
  if (!player?.connected) return {};
  if (state.answers[playerId]) return {};

  const question = state.questions[state.currentQuestionIndex];
  if (!question) return {};

  const correct = optionIndex === question.correctIndex;
  const pointsAwarded = correct ? scoreCorrect(state, playerId, now) : 0;
  if (!correct) state.streaks[playerId] = 0;
  player.score += pointsAwarded;

  state.answers[playerId] = {
    optionIndex,
    answeredAt: now,
    correct,
    pointsAwarded,
  };

  if (Object.keys(state.answers).length >= connectedCount(state)) {
    return reveal(state, now);
  }
  return {};
}

function reveal(state: MusicQuizState, now: number): EngineDirectives {
  for (const id of Object.keys(state.players)) {
    if (!state.answers[id]) state.streaks[id] = 0;
  }
  state.phase = "REVEAL";
  state.timerExpiresAt = now + musicGameConfig.revealTimeMs;
  return { alarmAt: state.timerExpiresAt };
}

function nextQuestion(state: MusicQuizState, now: number): EngineDirectives {
  state.currentQuestionIndex++;
  if (state.currentQuestionIndex >= state.questions.length) {
    state.status = "FINISHED";
    state.phase = "REVEAL";
    return {
      updateRoomStatus: "finished",
      persistResults: true,
      cancelAlarm: true,
    };
  }
  const alarmAt = beginQuestion(state, now);
  return { alarmAt };
}

export function handleTimeout(
  state: MusicQuizState,
  now: number
): EngineDirectives {
  if (state.status !== "PLAYING") return {};
  switch (state.phase) {
    case "QUESTION":
      return reveal(state, now);
    case "REVEAL":
      return nextQuestion(state, now);
    default:
      return {};
  }
}
