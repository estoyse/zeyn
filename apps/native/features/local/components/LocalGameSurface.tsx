import { formatLocalCode } from "@zeyn/api/local-code";
import type { ReactNode } from "react";
import { ScrollView, View } from "react-native";

import { FocusLayout } from "@/features/game/components/FocusLayout";
import { GameHeader } from "@/features/game/components/GameHeader";
import { GameLobby } from "@/features/game/components/GameLobby";
import { ReconnectingBanner } from "@/features/game/components/ReconnectingBanner";
import { Scoreboard } from "@/features/game/components/Scoreboard";
import { getClientGame } from "@/features/games/registry";
import type { GameRoomView } from "@/features/games/types";
import { localResults } from "@/features/local/local-room";
import { haptics } from "@/lib/haptics";

interface LocalGameSurfaceProps {
  room: GameRoomView;
  code: string;
  hero: ReactNode;
  onLeave: () => void;
}

export function LocalGameSurface({
  room,
  code,
  hero,
  onLeave,
}: LocalGameSurfaceProps) {
  const { state, playerId, isConnected } = room;
  if (!state) return null;

  const game = getClientGame(state.gameType);
  const Playing = game?.Playing;
  const Results = game?.Results;

  const start = () => {
    haptics.medium();
    room.send({ type: "START", playerId });
  };

  return (
    <FocusLayout
      header={<GameHeader gameId={formatLocalCode(code)} onLeave={onLeave} />}
    >
      {!isConnected && <ReconnectingBanner />}

      {state.status === "WAITING" && (
        <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
          <GameLobby
            state={state}
            playerId={playerId}
            onStart={start}
            minPlayers={game?.meta.minPlayers ?? 2}
            description={game?.meta.description ?? ""}
            hero={hero}
          />
        </ScrollView>
      )}

      {state.status === "PLAYING" && Playing && (
        <View className="flex-1">
          <View className="px-4 pt-3">
            <Scoreboard state={state} playerId={playerId} variant="strip" />
          </View>
          <Playing room={room} />
        </View>
      )}

      {state.status === "FINISHED" && Results && (
        <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
          <Results results={localResults(state)} onBack={onLeave} />
        </ScrollView>
      )}
    </FocusLayout>
  );
}
