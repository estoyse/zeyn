import { View } from "react-native";

import type { GamePlayViewProps } from "@/features/games/types";

import { LivebuzzerHostPanel } from "./LivebuzzerHostPanel";
import { LivebuzzerPlayerBuzzer } from "./LivebuzzerPlayerBuzzer";
import type { LivebuzzerView } from "./types";
import { useLivebuzzerEvents } from "./useLivebuzzerEvents";

export function LivebuzzerPlaying({ room }: GamePlayViewProps) {
  useLivebuzzerEvents(room);
  const state = room.state as LivebuzzerView | null;
  if (!state) return null;
  const isHost = state.hostId === room.playerId;
  if (!isHost) return <LivebuzzerPlayerBuzzer room={room} />;
  return (
    <View className="flex-1">
      <LivebuzzerHostPanel room={room} />
      {state.config.hostPlays && <LivebuzzerPlayerBuzzer room={room} />}
    </View>
  );
}
