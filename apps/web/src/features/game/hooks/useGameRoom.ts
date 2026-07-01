import { useCallback, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { ClientMessage } from "@shaxsiy-oyin/api/game-types";
import { authClient } from "@/features/auth/lib/auth-client";
import { useGame } from "./game-client";
import { resolveGameView } from "@/features/game/lib/resolveGameView";
import { trpc } from "@/shared/lib/trpc";

// Owns everything the game page needs: session, socket, results query, local
// input/prompt state, and the derived view. The route component stays a thin
// switch over `view` and forwards `actions`.
export function useGameRoom(gameId: string) {
  const [password, setPassword] = useState("");
  const [answerInput, setAnswerInput] = useState("");
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);

  const { data: session, isPending: sessionLoading } = authClient.useSession();
  const userId = session?.user?.id ?? "";
  const userName = session?.user?.name ?? "";

  const { state, error, errorCode, sendAction, isConnecting, isConnected } =
    useGame(gameId, userId, userName, password);

  // Only fetch results once the game is actually over (see the getResults fix).
  const wantResults =
    state?.status === "FINISHED" || errorCode === "ALREADY_FINISHED";
  const resultsQuery = useQuery({
    ...trpc.game.getResults.queryOptions({ gameId }),
    enabled: wantResults,
  });

  const send = useCallback(
    (message: ClientMessage) => sendAction(message),
    [sendAction]
  );

  const start = useCallback(
    () => send({ type: "START", playerId: userId, subjectIds: [] }),
    [send, userId]
  );
  const buzz = useCallback(
    () => send({ type: "BUZZ", playerId: userId }),
    [send, userId]
  );
  const submitAnswer = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!answerInput.trim()) return;
      send({ type: "SUBMIT_ANSWER", playerId: userId, answer: answerInput });
      setAnswerInput("");
    },
    [answerInput, send, userId]
  );

  const view = resolveGameView({
    status: state?.status,
    hasState: !!state,
    hasResults: !!resultsQuery.data,
    error,
    errorCode,
    showPasswordPrompt,
    isAuthed: !!session,
    sessionLoading,
    isConnecting,
    isConnected,
  });

  return {
    view,
    state,
    userId,
    results: resultsQuery.data,
    password,
    setPassword,
    showPasswordPrompt,
    setShowPasswordPrompt,
    answerInput,
    setAnswerInput,
    actions: { start, buzz, submitAnswer },
  };
}
