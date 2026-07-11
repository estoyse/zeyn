import { canonicalizeGameId } from "@zeyn/api/game-code";
import { router, useLocalSearchParams, type Href } from "expo-router";
import { useEffect, type ReactNode } from "react";
import { ScrollView, View } from "react-native";
import { ScopedTheme } from "uniwind";

import { ConnectingView } from "@/features/game/components/ConnectingView";
import { ConnectionErrorView } from "@/features/game/components/ConnectionErrorView";
import { FocusLayout } from "@/features/game/components/FocusLayout";
import { FocusTopBar } from "@/features/game/components/FocusTopBar";
import { GameHeader } from "@/features/game/components/GameHeader";
import { GameLobby } from "@/features/game/components/GameLobby";
import { JoinChoiceView } from "@/features/game/components/JoinChoiceView";
import { LoadingView } from "@/features/game/components/LoadingView";
import { PasswordPromptView } from "@/features/game/components/PasswordPromptView";
import { ReconnectingBanner } from "@/features/game/components/ReconnectingBanner";
import { Scoreboard } from "@/features/game/components/Scoreboard";
import { useGameRoom } from "@/features/game/hooks/useGameRoom";
import { getClientGame } from "@/features/games/registry";
import type { GameResultsData } from "@/features/games/types";

export default function GameRoomScreen() {
  const { gameId: rawGameId } = useLocalSearchParams<{ gameId: string }>();
  const gameId = canonicalizeGameId(rawGameId ?? "");

  useEffect(() => {
    if (rawGameId && gameId !== rawGameId) {
      router.replace(`/game/${gameId}` as Href);
    }
  }, [rawGameId, gameId]);

  if (rawGameId && gameId !== rawGameId) return null;

  return (
    <ScopedTheme theme="arcade">
      <GameRoom gameId={gameId} />
    </ScopedTheme>
  );
}

function GameRoom({ gameId }: { gameId: string }) {
  const room = useGameRoom(gameId);
  const { view } = room;
  const toDashboard = () => router.replace("/(tabs)/home" as Href);

  const secondary = (content: ReactNode) => (
    <FocusLayout header={<FocusTopBar onLeave={toDashboard} />}>
      {content}
    </FocusLayout>
  );

  switch (view.kind) {
    case "archive":
      return room.results ? (
        <ArchiveScreen results={room.results} onBack={toDashboard} />
      ) : (
        secondary(<LoadingView message="loading.resultsReady" />)
      );

    case "loading":
      return secondary(<LoadingView message={view.message} />);

    case "passwordPrompt":
      return secondary(
        <PasswordPromptView
          onJoin={pwd => {
            room.setPassword(pwd);
            room.setShowPasswordPrompt(false);
          }}
          onBack={toDashboard}
        />
      );

    case "loginRequired":
      return secondary(
        <JoinChoiceView
          gameId={gameId}
          onJoinAsGuest={room.joinAsGuest}
          onWatch={room.watchAsSpectator}
          pending={room.mintPending}
          allowGuests={room.allowGuests}
        />
      );

    case "connecting":
      return secondary(<ConnectingView />);

    case "connectionError":
      return secondary(
        <ConnectionErrorView error={view.message} onRetry={toDashboard} />
      );

    case "play":
      return <GameScreen room={room} gameId={gameId} onLeave={toDashboard} />;
  }
}

function GameScreen({
  room,
  gameId,
  onLeave,
}: {
  room: ReturnType<typeof useGameRoom>;
  gameId: string;
  onLeave: () => void;
}) {
  const { state, userId, isConnected, isSpectator } = room;
  if (!state) return null;

  const game = getClientGame(state.gameType);
  const Playing = game?.Playing;
  const isPlaying = state.status === "PLAYING";

  return (
    <FocusLayout header={<GameHeader gameId={gameId} onLeave={onLeave} />}>
      {!isConnected && <ReconnectingBanner />}

      {state.status === "WAITING" && (
        <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
          <GameLobby
            state={state}
            playerId={userId}
            onStart={room.start}
            minPlayers={game?.meta.minPlayers ?? 2}
            description={game?.meta.description ?? ""}
            isSpectator={isSpectator}
          />
        </ScrollView>
      )}

      {isPlaying && Playing && (
        <View className="flex-1">
          <View className="px-4 pt-3">
            <Scoreboard state={state} playerId={userId} variant="strip" />
          </View>
          <Playing room={room} />
        </View>
      )}
    </FocusLayout>
  );
}

function ArchiveScreen({
  results,
  onBack,
}: {
  results: GameResultsData;
  onBack: () => void;
}) {
  const game = getClientGame(results.game.gameType);
  const Results = game?.Results;

  return (
    <FocusLayout header={<FocusTopBar onLeave={onBack} />}>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
        {Results ? (
          <Results results={results} onBack={onBack} />
        ) : (
          <LoadingView message="loading.resultsReady" />
        )}
      </ScrollView>
    </FocusLayout>
  );
}
