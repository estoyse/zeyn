import { describe, it, expect } from "vitest";
import { musicGameConfig, type MusicQuizState } from "@shaxsiy-oyin/api/games";
import {
  answer,
  buildQuestions,
  createInitialState,
  handleTimeout,
  start,
  type SongRow,
} from "./engine";

const NOW = 1_000_000;

function playingState(): MusicQuizState {
  const state = createInitialState();
  state.gameId = "g1";
  state.hostId = "host";
  state.status = "PLAYING";
  state.players = {
    host: { id: "host", name: "Host", score: 0, connected: true },
    p1: { id: "p1", name: "P1", score: 0, connected: true },
  };
  state.questions = [
    {
      songId: "s1",
      previewUrl: "u1",
      correctTitle: "Song A",
      artistName: "Artist",
      options: ["Song A", "Song B", "Song C"],
      correctIndex: 0,
    },
    {
      songId: "s2",
      previewUrl: "u2",
      correctTitle: "Song D",
      artistName: "Artist",
      options: ["Song E", "Song D", "Song F"],
      correctIndex: 1,
    },
  ];
  state.currentQuestionIndex = 0;
  state.phase = "QUESTION";
  state.timerExpiresAt = NOW + musicGameConfig.questionTimeMs;
  state.answers = {};
  state.streaks = {};
  return state;
}

describe("music answer scoring", () => {
  it("awards base + full speed bonus for an instant correct answer", () => {
    const state = playingState();
    answer(state, "host", 0, NOW);
    expect(state.players.host!.score).toBe(
      musicGameConfig.basePoints + musicGameConfig.maxSpeedBonus
    );
    expect(state.streaks.host).toBe(1);
  });

  it("gives no points and resets streak on a wrong answer", () => {
    const state = playingState();
    state.streaks.p1 = 3;
    answer(state, "p1", 2, NOW);
    expect(state.players.p1!.score).toBe(0);
    expect(state.streaks.p1).toBe(0);
    expect(state.answers.p1!.correct).toBe(false);
  });

  it("adds a streak bonus on consecutive correct answers", () => {
    const state = playingState();
    state.streaks.host = 2;
    answer(state, "host", 0, NOW);
    const expected =
      musicGameConfig.basePoints +
      musicGameConfig.maxSpeedBonus +
      2 * musicGameConfig.streakBonusPerLevel;
    expect(state.players.host!.score).toBe(expected);
    expect(state.streaks.host).toBe(3);
  });

  it("ignores a second answer from the same player", () => {
    const state = playingState();
    answer(state, "host", 0, NOW);
    const score = state.players.host!.score;
    answer(state, "host", 1, NOW);
    expect(state.players.host!.score).toBe(score);
  });

  it("reveals once every connected player has answered", () => {
    const state = playingState();
    answer(state, "host", 0, NOW);
    expect(state.phase).toBe("QUESTION");
    const d = answer(state, "p1", 0, NOW);
    expect(state.phase).toBe("REVEAL");
    expect(d.alarmAt).toBe(NOW + musicGameConfig.revealTimeMs);
  });
});

describe("music timeouts", () => {
  it("QUESTION timeout reveals and resets streaks of non-answerers", () => {
    const state = playingState();
    state.streaks.p1 = 5;
    answer(state, "host", 0, NOW);
    const d = handleTimeout(state, NOW + musicGameConfig.questionTimeMs);
    expect(state.phase).toBe("REVEAL");
    expect(state.streaks.p1).toBe(0);
    expect(state.streaks.host).toBe(1);
    expect(d.alarmAt).toBeGreaterThan(0);
  });

  it("REVEAL timeout advances to the next question", () => {
    const state = playingState();
    state.phase = "REVEAL";
    handleTimeout(state, NOW);
    expect(state.currentQuestionIndex).toBe(1);
    expect(state.phase).toBe("QUESTION");
  });

  it("REVEAL timeout on the last question finishes and persists", () => {
    const state = playingState();
    state.currentQuestionIndex = state.questions.length - 1;
    state.phase = "REVEAL";
    const d = handleTimeout(state, NOW);
    expect(state.status).toBe("FINISHED");
    expect(d.persistResults).toBe(true);
    expect(d.updateRoomStatus).toBe("finished");
  });
});

describe("music start", () => {
  it("rejects a non-host", () => {
    const state = playingState();
    state.status = "WAITING";
    const d = start(state, "p1", NOW);
    expect(d.reply?.type).toBe("ERROR");
    expect(state.status).toBe("WAITING");
  });

  it("starts for the host with questions loaded", () => {
    const state = playingState();
    state.status = "WAITING";
    const d = start(state, "host", NOW);
    expect(state.status).toBe("PLAYING");
    expect(d.updateRoomStatus).toBe("playing");
    expect(d.alarmAt).toBe(NOW + musicGameConfig.questionTimeMs);
  });
});

describe("buildQuestions", () => {
  it("builds questions with the correct title among the options", () => {
    const songs: SongRow[] = Array.from({ length: 12 }, (_, i) => ({
      id: `s${i}`,
      title: `Title ${i}`,
      previewUrl: `u${i}`,
      artistName: "Artist",
    }));
    const questions = buildQuestions(songs);
    expect(questions.length).toBe(musicGameConfig.questionCount);
    for (const q of questions) {
      expect(q.options.length).toBe(musicGameConfig.optionsPerQuestion);
      expect(q.options[q.correctIndex]).toBe(q.correctTitle);
      expect(new Set(q.options).size).toBe(q.options.length);
    }
  });

  it("returns nothing when the pool is too small", () => {
    expect(buildQuestions([])).toEqual([]);
  });
});
