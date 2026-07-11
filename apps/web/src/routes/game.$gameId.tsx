import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { canonicalizeGameId } from "@zeyn/api/game-code";
import type { ReactNode } from "react";
import { useGameRoom } from "@/features/game/hooks/useGameRoom";

import { LoadingView, ConnectingView } from "@/features/game/components/LoadingView";
import { LoginRequiredView } from "@/features/game/components/LoginRequiredView";
import { PasswordPromptView } from "@/features/game/components/PasswordPromptView";
import { ConnectionErrorView } from "@/features/game/components/ErrorViews";
import { FocusLayout } from "@/features/game/components/FocusLayout";
import { FocusTopBar } from "@/features/game/components/FocusTopBar";
import { GameHeader } from "@/features/game/components/GameHeader";
import { GameLobby } from "@/features/game/components/GameLobby";
import { ReconnectingBanner } from "@/features/game/components/ReconnectingBanner";
import { Scoreboard } from "@/features/game/components/Scoreboard";
import { getClientGame } from "@/features/games/registry";

export const Route = createFileRoute("/game/$gameId")({
  beforeLoad: ({ params }) => {
    const canonical = canonicalizeGameId(params.gameId);
    if (canonical !== params.gameId) {
      throw redirect({
        to: "/game/$gameId",
        params: { gameId: canonical },
        replace: true,
      });
    }
  },
  component: GamePage,
});

function GamePage() {
  const { gameId } = Route.useParams();
  const navigate = useNavigate();
  const room = useGameRoom(gameId);
  const { view } = room;
  const toDashboard = () => navigate({ to: "/" });

  const secondary = (content: ReactNode) => (
    <FocusLayout header={<FocusTopBar onLeave={toDashboard} />}>
      {content}
    </FocusLayout>
  );

  switch (view.kind) {
    case "archive": {
      const results = room.results!;
      const resultsGame = getClientGame(results.game.gameType);
      if (!resultsGame) return null;
      const Results = resultsGame.Results;
      return secondary(<Results results={results} onBack={toDashboard} />);
    }

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
        <LoginRequiredView
          gameId={gameId}
          onJoinAsGuest={room.joinAsGuest}
          onWatch={room.watchAsSpectator}
          pending={room.mintPending}
        />
      );

    case "connecting":
      return secondary(<ConnectingView />);

    case "connectionError":
      return secondary(
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
  const { state, userId, isConnected, isSpectator } = room;
  if (!state) return null;

  const game = getClientGame(state.gameType);
  const Playing = game?.Playing;
  const isPlaying = state.status === "PLAYING";

  return (
    <FocusLayout
      header={
        <GameHeader gameId={gameId} onLeave={onLeave} isSpectator={isSpectator} />
      }
    >
      {!isConnected && <ReconnectingBanner />}

      <div className='min-h-full p-4 md:p-6'>
        <div className='mx-auto max-w-7xl'>
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

            {isPlaying && Playing && (
              <motion.div
                key='playing'
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className='grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]'
              >
                <div className='min-w-0 space-y-6'>
                  <div className='lg:hidden'>
                    <Scoreboard state={state} playerId={userId} variant='strip' />
                  </div>
                  <Playing room={room} />
                </div>

                <aside className='hidden lg:block'>
                  <div className='sticky top-4'>
                    <Scoreboard state={state} playerId={userId} variant='rail' />
                  </div>
                </aside>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </FocusLayout>
  );
}
