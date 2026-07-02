import { GamePlaying } from "@/features/game/components/GamePlaying";
import type { GamePlayViewProps } from "@/features/games/types";

export function BuzzerPlaying({ room }: GamePlayViewProps) {
  if (!room.state) return null;

  return (
    <GamePlaying
      state={room.state}
      playerId={room.userId}
      answerInput={room.answerInput}
      setAnswerInput={room.setAnswerInput}
      onBuzz={room.actions.buzz}
      onSubmitAnswer={room.actions.submitAnswer}
    />
  );
}
