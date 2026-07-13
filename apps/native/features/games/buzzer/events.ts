import type { GameEvent } from "@/features/game/lib/gameEvents";
import type { BuzzerView } from "./types";

export function diffBuzzer(
  prev: BuzzerView,
  next: BuzzerView,
  selfId: string
): GameEvent[] {
  const events: GameEvent[] = [];

  if (prev.status === "WAITING" && next.status === "PLAYING") {
    events.push({ type: "gameStart" });
  }

  const newRows = next.questionResults.slice(prev.questionResults.length);

  const prevBuzzed = prev.activeQuestionState?.buzzedPlayerId ?? null;
  const nextBuzzed = next.activeQuestionState?.buzzedPlayerId ?? null;
  if (!prevBuzzed && nextBuzzed) {
    events.push({
      type: "buzz",
      playerId: nextBuzzed,
      isSelf: nextBuzzed === selfId,
    });
  }

  for (const row of newRows) {
    events.push({
      type: "answer",
      playerId: row.userId,
      isSelf: row.userId === selfId,
      correct: row.correct,
      points: row.pointsAwarded,
    });
  }

  if (prev.phase !== "REVEALED" && next.phase === "REVEALED") {
    const solvedRow = newRows.find(row => row.correct);
    events.push({
      type: "reveal",
      solved: !!solvedRow,
      selfScored: solvedRow?.userId === selfId,
    });
  }

  const cursorMoved =
    prev.currentSubjectIndex !== next.currentSubjectIndex ||
    prev.currentQuestionIndex !== next.currentQuestionIndex;
  const reArmed = prev.phase === "REVEALED" && next.phase === "ACTIVE";
  if (next.status === "PLAYING" && (cursorMoved || reArmed)) {
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
