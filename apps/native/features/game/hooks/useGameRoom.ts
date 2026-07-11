import { useCallback, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import type { ClientMessage } from "@zeyn/api/game-types";
import { authClient } from "@/lib/auth-client";
import { trpc } from "@/utils/trpc";
import { useGame } from "./game-client";
import { haptics } from "@/lib/haptics";
import { resolveGameView } from "@/features/game/lib/resolveGameView";
import {
  loadGuestIdentity,
  saveGuestIdentity,
  type GuestIdentity,
} from "@/features/game/lib/guest-identity";

export function useGameRoom(gameId: string) {
  const [password, setPassword] = useState("");
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);

  const { data: session, isPending: sessionLoading } = authClient.useSession();
  const isAuthed = !!session;

  const [guest, setGuest] = useState<GuestIdentity | null>(() =>
    loadGuestIdentity()
  );
  const [spectating, setSpectating] = useState(false);

  const previewQuery = useQuery(
    trpc.game.getRoomPreview.queryOptions({ gameId })
  );
  const preview = previewQuery.data;
  const previewLoading = !previewQuery.isFetchedAfterMount;
  const isFinished = preview?.status === "finished";
  const roomMissing = previewQuery.isSuccess && preview === null;
  const isArchived = isFinished || roomMissing;
  const needsPassword = !!preview?.hasPassword;
  const allowGuests = preview?.allowGuests ?? true;

  const authedId = session?.user?.id ?? "";
  const authedName = session?.user?.name ?? "";

  const playerId = isAuthed ? authedId : (guest?.gid ?? "");
  const playerName = isAuthed ? authedName : (guest?.name ?? "");
  const guestToken = isAuthed ? undefined : guest?.token;
  const cookie = isAuthed ? (authClient.getCookie() ?? undefined) : undefined;
  const isSpectator = spectating;
  const hasIdentity = isAuthed || !!guest;

  const shouldConnect =
    !previewLoading &&
    !isArchived &&
    !(needsPassword && !password) &&
    (hasIdentity || spectating);

  const {
    state,
    serverTimeOffset,
    error,
    errorCode,
    sendAction,
    isConnecting,
    isConnected,
  } = useGame({
    gameId,
    playerId,
    playerName,
    password,
    guestToken,
    cookie,
    spectate: isSpectator,
    connect: shouldConnect,
  });

  const mintGuest = useMutation(trpc.game.createGuestToken.mutationOptions());

  const joinAsGuest = useCallback(
    async (name: string) => {
      const res = await mintGuest.mutateAsync({ name });
      const identity: GuestIdentity = {
        token: res.token,
        gid: res.guestId,
        name: res.name,
      };
      saveGuestIdentity(identity);
      setGuest(identity);
    },
    [mintGuest]
  );

  const watchAsSpectator = useCallback(() => setSpectating(true), []);

  const wantResults =
    isArchived ||
    state?.status === "FINISHED" ||
    errorCode === "ALREADY_FINISHED";
  const resultsQuery = useQuery({
    ...trpc.game.getResults.queryOptions({ gameId }),
    enabled: wantResults,
  });

  const send = useCallback(
    (message: ClientMessage) => sendAction(message),
    [sendAction]
  );

  const start = useCallback(() => {
    haptics.medium();
    send({ type: "START", playerId });
  }, [send, playerId]);

  const view = resolveGameView({
    status: state?.status,
    hasState: !!state,
    hasResults: !!resultsQuery.data,
    resultsPending: wantResults && resultsQuery.isPending,
    previewLoading,
    isFinished,
    roomMissing,
    needsPassword,
    hasPasswordEntered: !!password,
    error,
    errorCode,
    showPasswordPrompt,
    isAuthed,
    hasIdentity,
    isSpectating: spectating,
    sessionLoading,
    isConnecting,
    isConnected,
  });

  return {
    view,
    state,
    userId: playerId,
    playerId,
    isSpectator,
    allowGuests,
    roomName: preview?.name,
    serverTimeOffset,
    send,
    start,
    joinAsGuest,
    watchAsSpectator,
    mintPending: mintGuest.isPending,
    results: resultsQuery.data,
    password,
    setPassword,
    showPasswordPrompt,
    setShowPasswordPrompt,
    isConnected,
    isConnecting,
  };
}
