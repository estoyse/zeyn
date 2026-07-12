import {
  useGameEventStream,
  useGameFeedback,
} from "@/features/game/hooks/useGameEvents";
import type { GamePlayViewProps } from "@/features/games/types";

import { diffBuzzer } from "./events";
import type { BuzzerView } from "./types";

export function useBuzzerEvents(room: GamePlayViewProps["room"]) {
  const onEvent = useGameFeedback();

  useGameEventStream<BuzzerView>(
    room.state as BuzzerView | null,
    room.isConnected,
    room.playerId,
    diffBuzzer,
    onEvent
  );
}
