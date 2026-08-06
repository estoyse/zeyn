import type { GamePlayViewProps } from "@/features/games/types";
import type { LivebuzzerView } from "./types";
import { LivebuzzerHostPanel } from "./LivebuzzerHostPanel";
import { LivebuzzerPlayerBuzzer } from "./LivebuzzerPlayerBuzzer";

export function LivebuzzerPlaying({ room }: GamePlayViewProps) {
  const state = room.state as LivebuzzerView | null;
  if (!state) return null;

  const isHost = state.hostId === room.userId;

  if (!isHost) {
    return <LivebuzzerPlayerBuzzer room={room} />;
  }

  return (
    <div className="space-y-6">
      <LivebuzzerHostPanel room={room} />
      {state.config.hostPlays && <LivebuzzerPlayerBuzzer room={room} />}
    </div>
  );
}
