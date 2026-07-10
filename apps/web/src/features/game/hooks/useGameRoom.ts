import { useCallback, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { ClientMessage } from "@zeyn/api/game-types";
import { authClient } from "@/features/auth/lib/auth-client";
import { useGame } from "./game-client";
import { resolveGameView } from "@/features/game/lib/resolveGameView";
import { trpc } from "@/shared/lib/trpc";

export function useGameRoom(gameId: string) {
  const [password, setPassword] = useState("");
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);

  const { data: session, isPending: sessionLoading } = authClient.useSession();
  const userId = session?.user?.id ?? "";
  const userName = session?.user?.name ?? "";

  const {
    state,
    serverTimeOffset,
    error,
    errorCode,
    sendAction,
    isConnecting,
    isConnected,
  } = useGame(gameId, userId, userName, password);

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
    () => send({ type: "START", playerId: userId }),
    [send, userId]
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
    serverTimeOffset,
    send,
    start,
    results: resultsQuery.data,
    password,
    setPassword,
    showPasswordPrompt,
    setShowPasswordPrompt,
    isConnected,
    isConnecting,
  };
}
