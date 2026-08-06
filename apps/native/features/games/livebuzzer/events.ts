import type { GameEvent } from "@/features/game/lib/gameEvents";
import type { LivebuzzerView } from "./types";

export function diffLivebuzzer(
  prev: LivebuzzerView,
  next: LivebuzzerView,
  selfId: string
): GameEvent[] {
  const events: GameEvent[] = [];

  if (prev.status === "WAITING" && next.status === "PLAYING") {
    events.push({ type: "gameStart" });
  }

  if (prev.phase !== "ARMED" && next.phase === "ARMED") {
    events.push({ type: "questionStart", questionIndex: next.round });
  }

  if (!prev.lockedPlayerId && next.lockedPlayerId) {
    events.push({
      type: "buzz",
      playerId: next.lockedPlayerId,
      isSelf: next.lockedPlayerId === selfId,
    });
  }

  if (next.judgedCount > prev.judgedCount && next.lastResult) {
    events.push({
      type: "answer",
      playerId: next.lastResult.playerId,
      isSelf: next.lastResult.playerId === selfId,
      correct: next.lastResult.correct,
      points: next.lastResult.pointsAwarded,
    });
    events.push({
      type: "reveal",
      solved: next.lastResult.correct,
      selfScored: next.lastResult.correct && next.lastResult.playerId === selfId,
    });
  }

  if (prev.status === "PLAYING" && next.status === "FINISHED") {
    events.push({ type: "gameEnd" });
  }

  return events;
}
