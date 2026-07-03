import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AnimatePresence } from "framer-motion";
import { useGameRoom } from "@/features/game/hooks/useGameRoom";

import { LoadingView, ConnectingView } from "@/features/game/components/LoadingView";
import { LoginRequiredView } from "@/features/game/components/LoginRequiredView";
import { PasswordPromptView } from "@/features/game/components/PasswordPromptView";
import { ConnectionErrorView } from "@/features/game/components/ErrorViews";
import { GameHeader } from "@/features/game/components/GameHeader";
import { GameLobby } from "@/features/game/components/GameLobby";
import { getClientGame } from "@/features/games/registry";

export const Route = createFileRoute("/_app/game/$gameId")({
  component: GamePage,
});

function GamePage() {
  const { gameId } = Route.useParams();
  const navigate = useNavigate();
  const room = useGameRoom(gameId);
  const { view } = room;
  const toDashboard = () => navigate({ to: "/" });

  switch (view.kind) {
    case "archive": {
      const results = room.results!;
      const resultsGame = getClientGame(results.game.gameType);
      if (!resultsGame) return null;
      const Results = resultsGame.Results;
      return <Results results={results} onBack={toDashboard} />;
    }

    case "loading":
      return <LoadingView message={view.message} />;

    case "passwordPrompt":
      return (
        <PasswordPromptView
          onJoin={pwd => {
            room.setPassword(pwd);
            room.setShowPasswordPrompt(false);
          }}
          onBack={toDashboard}
        />
      );

    case "loginRequired":
      return <LoginRequiredView gameId={gameId} />;

    case "connecting":
      return <ConnectingView />;

    case "connectionError":
      return (
        <ConnectionErrorView
          error={view.message}
          onRetry={
            view.retry === "reload"
              ? () => window.location.reload()
              : toDashboard
          }
        />
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
  const { state, userId } = room;
  if (!state) return null;

  const game = getClientGame(state.gameType);
  const Playing = game?.Playing;

  return (
    <div className='min-h-screen bg-background p-4 md:p-6'>
      <div className='mx-auto max-w-7xl space-y-6'>
        <GameHeader gameId={gameId} state={state} onLeave={onLeave} />

        <AnimatePresence mode='wait'>
          {state.status === "WAITING" && (
            <GameLobby
              key='lobby'
              state={state}
              playerId={userId}
              onStart={room.start}
              minPlayers={game?.meta.minPlayers ?? 2}
              description={game?.meta.description ?? ""}
            />
          )}

          {state.status === "PLAYING" && Playing && (
            <Playing key='playing' room={room} />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
