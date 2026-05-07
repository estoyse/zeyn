import { useState, useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence } from "framer-motion";
import { useGame } from "../lib/game-client";
import { authClient } from "../lib/auth-client";
import { trpc } from "../utils/trpc";

// Components
import { LoadingView, ConnectingView } from "@/components/game/LoadingView";
import { LoginRequiredView } from "@/components/game/LoginRequiredView";
import { PasswordPromptView } from "@/components/game/PasswordPromptView";
import { ConnectionErrorView } from "@/components/game/ErrorViews";
import { ArchiveView } from "@/components/game/ArchiveView";
import { GameHeader } from "@/components/game/GameHeader";
import { GameLobby } from "@/components/game/GameLobby";
import { GamePlaying } from "@/components/game/GamePlaying";

export const Route = createFileRoute("/game/$roomId")({
  component: GamePage,
});

function GamePage() {
  const { roomId } = Route.useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [answerInput, setAnswerInput] = useState("");
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);

  const { data: session, isPending: sessionLoading } = authClient.useSession();
  const userId = session?.user?.id;
  const userName = session?.user?.name;

  const { state, error, errorCode, sendAction, isConnecting, isConnected } = useGame(
    roomId,
    userId || "",
    userName || "",
    password
  );

  const resultsQuery = useQuery(trpc.game.getResults.queryOptions({ roomId }));

  // Refetch results when game finishes
  useEffect(() => {
    if (state?.status === "FINISHED") {
      resultsQuery.refetch();
    }
  }, [state?.status, resultsQuery]);

  // Archive results view (Either game is finished or we had a connection error but data exists)
  if ((state?.status === "FINISHED" || error || !state) && resultsQuery.data) {
    return (
      <ArchiveView
        data={resultsQuery.data}
        onBack={() => navigate({ to: "/dashboard" })}
      />
    );
  }

  // If game is finished but data hasn't arrived yet
  if (state?.status === "FINISHED") {
    return <LoadingView message="Fetching final results..." />;
  }

  // Session loading
  if (errorCode === "PASSWORD_REQUIRED" || showPasswordPrompt) {
    return (
      <PasswordPromptView
        onJoin={pwd => {
          setPassword(pwd);
          setShowPasswordPrompt(false);
        }}
        onBack={() => navigate({ to: "/dashboard" })}
      />
    );
  }

  // Session loading
  if (sessionLoading) {
    return <LoadingView message='Checking session...' />;
  }

  // Not logged in
  if (!session) {
    return <LoginRequiredView roomId={roomId} />;
  }

  // Still connecting or waiting for initial state
  if (!state && (isConnecting || isConnected) && !error) {
    return <ConnectingView />;
  }

  // Connection error
  if (error && !state) {
    const errorMessages: Record<string, string> = {
      NOT_FOUND: "This room no longer exists",
      ALREADY_STARTED: "Game has already started",
      ALREADY_FINISHED: "This game has ended",
    };
    return (
      <ConnectionErrorView
        error={errorMessages[errorCode || ""] || error}
        onRetry={() => navigate({ to: "/dashboard" })}
      />
    );
  }

  // No state after connection attempts
  if (!state) {
    return (
      <ConnectionErrorView
        error="Could not connect to game"
        onRetry={() => window.location.reload()}
      />
    );
  }

  // Action handlers
  const handleStart = () => {
    sendAction({
      type: "START",
      playerId: userId!,
      subjectIds: [],
    });
  };

  const handleBuzz = () => {
    sendAction({ type: "BUZZ", playerId: userId! });
  };

  const handleSubmitAnswer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!answerInput.trim()) return;
    sendAction({
      type: "SUBMIT_ANSWER",
      playerId: userId!,
      answer: answerInput,
    });
    setAnswerInput("");
  };

  return (
    <div className='min-h-screen bg-background p-4 md:p-6'>
      <div className='mx-auto max-w-7xl space-y-6'>
        <GameHeader
          roomId={roomId}
          state={state}
          onLeave={() => navigate({ to: "/dashboard" })}
        />

        <AnimatePresence mode='wait'>
          {state.status === "WAITING" && (
            <GameLobby
              key='lobby'
              state={state}
              playerId={userId!}
              onStart={handleStart}
            />
          )}

          {state.status === "PLAYING" && (
            <GamePlaying
              key='playing'
              state={state}
              playerId={userId!}
              answerInput={answerInput}
              setAnswerInput={setAnswerInput}
              onBuzz={handleBuzz}
              onSubmitAnswer={handleSubmitAnswer}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
