import type { GameEvent } from "@/features/game/lib/gameEvents";
import type { MusicView } from "./types";

export function diffMusic(
  prev: MusicView,
  next: MusicView,
  selfId: string
): GameEvent[] {
  const events: GameEvent[] = [];

  if (prev.status === "WAITING" && next.status === "PLAYING") {
    events.push({ type: "gameStart" });
  }

  const previouslyAnswered = new Set(prev.answeredPlayerIds);
  for (const playerId of next.answeredPlayerIds) {
    if (!previouslyAnswered.has(playerId)) {
      events.push({
        type: "lockIn",
        playerId,
        isSelf: playerId === selfId,
      });
    }
  }

  if (prev.phase !== "REVEAL" && next.phase === "REVEAL" && next.reveal) {
    const answers = next.reveal.answers;
    const own = answers[selfId];

    if (own) {
      events.push({
        type: "answer",
        playerId: selfId,
        isSelf: true,
        correct: own.correct,
        points: own.pointsAwarded,
      });
    }

    events.push({
      type: "reveal",
      solved: Object.values(answers).some(answer => answer.correct),
      selfScored: !!own?.correct,
    });
  }

  if (prev.currentQuestionIndex !== next.currentQuestionIndex) {
    events.push({
      type: "questionStart",
      questionIndex: next.currentQuestionIndex,
    });
  }

  if (prev.status === "PLAYING" && next.status === "FINISHED") {
    events.push({ type: "gameEnd" });
  }

  return events;
}
