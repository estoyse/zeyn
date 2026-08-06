import {
  useGameEventStream,
  useGameFeedback,
} from "@/features/game/hooks/useGameEvents";
import type { GamePlayViewProps } from "@/features/games/types";

import { diffLivebuzzer } from "./events";
import type { LivebuzzerView } from "./types";

export function useLivebuzzerEvents(room: GamePlayViewProps["room"]) {
  const onEvent = useGameFeedback();

  useGameEventStream<LivebuzzerView>(
    room.state as LivebuzzerView | null,
    room.isConnected,
    room.playerId,
    diffLivebuzzer,
    onEvent
  );
}
