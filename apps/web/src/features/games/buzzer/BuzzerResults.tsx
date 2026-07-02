import { ArchiveView } from "@/features/game/components/ArchiveView";
import type { GameResultsViewProps } from "@/features/games/types";

export function BuzzerResults({ results, onBack }: GameResultsViewProps) {
  return (
    <ArchiveView
      data={{
        subjects: results.subjects,
        playerResults: results.playerResults,
        questionResults: results.questionResults,
      }}
      onBack={onBack}
    />
  );
}
