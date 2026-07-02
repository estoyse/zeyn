import { useState } from "react";
import { GamePlaying } from "@/features/game/components/GamePlaying";
import type { GamePlayViewProps } from "@/features/games/types";
import type { BuzzerView } from "./types";

export function BuzzerPlaying({ room }: GamePlayViewProps) {
  const [answerInput, setAnswerInput] = useState("");
  const state = room.state as BuzzerView | null;
  if (!state) return null;

  const adjusted: BuzzerView = state.activeQuestionState
    ? {
        ...state,
        activeQuestionState: {
          ...state.activeQuestionState,
          timerExpiresAt:
            state.activeQuestionState.timerExpiresAt - room.serverTimeOffset,
        },
      }
    : state;

  const onBuzz = () => room.send({ type: "BUZZ", playerId: room.userId });

  const onSubmitAnswer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!answerInput.trim()) return;
    room.send({
      type: "SUBMIT_ANSWER",
      playerId: room.userId,
      answer: answerInput,
    });
    setAnswerInput("");
  };

  return (
    <GamePlaying
      state={adjusted}
      playerId={room.userId}
      answerInput={answerInput}
      setAnswerInput={setAnswerInput}
      onBuzz={onBuzz}
      onSubmitAnswer={onSubmitAnswer}
    />
  );
}
