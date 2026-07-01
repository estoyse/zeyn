import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AnimatePresence } from "framer-motion";
import { useGameRoom } from "@/lib/useGameRoom";

// Components
import { LoadingView, ConnectingView } from "@/components/game/LoadingView";
import { LoginRequiredView } from "@/components/game/LoginRequiredView";
import { PasswordPromptView } from "@/components/game/PasswordPromptView";
import { ConnectionErrorView } from "@/components/game/ErrorViews";
import { ArchiveView } from "@/components/game/ArchiveView";
import { GameHeader } from "@/components/game/GameHeader";
import { GameLobby } from "@/components/game/GameLobby";
import { GamePlaying } from "@/components/game/GamePlaying";

export const Route = createFileRoute("/game/$gameId")({
  component: GamePage,
});

function GamePage() {
  const { gameId } = Route.useParams();
  const navigate = useNavigate();
  const room = useGameRoom(gameId);
  const { view } = room;
  const toDashboard = () => navigate({ to: "/dashboard" });

  switch (view.kind) {
    case "archive":
      return <ArchiveView data={room.results!} onBack={toDashboard} />;

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
  const { state, userId, actions } = room;
  if (!state) return null;

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
              onStart={actions.start}
            />
          )}

          {state.status === "PLAYING" && (
            <GamePlaying
              key='playing'
              state={state}
              playerId={userId}
              answerInput={room.answerInput}
              setAnswerInput={room.setAnswerInput}
              onBuzz={actions.buzz}
              onSubmitAnswer={actions.submitAnswer}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
