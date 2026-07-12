import {
  useGameEventStream,
  useGameFeedback,
} from "@/features/game/hooks/useGameEvents";
import type { GamePlayViewProps } from "@/features/games/types";

import { diffMusic } from "./events";
import type { MusicView } from "./types";

export function useMusicEvents(room: GamePlayViewProps["room"]) {
  const onEvent = useGameFeedback();

  useGameEventStream<MusicView>(
    room.state as MusicView | null,
    room.isConnected,
    room.playerId,
    diffMusic,
    onEvent
  );
}
