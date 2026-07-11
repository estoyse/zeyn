// Pure decision logic for what the game page should render. Extracted from the
// route so the ordering rules are testable in isolation and the component is a
// straight switch over the result.

export interface GameViewInputs {
  status?: "WAITING" | "PLAYING" | "FINISHED";
  hasState: boolean;
  hasResults: boolean;
  resultsPending: boolean;
  previewLoading: boolean;
  isFinished: boolean;
  roomMissing: boolean;
  needsPassword: boolean;
  hasPasswordEntered: boolean;
  error: string | null;
  errorCode: string | null;
  showPasswordPrompt: boolean;
  isAuthed: boolean;
  hasIdentity: boolean;
  isSpectating: boolean;
  sessionLoading: boolean;
  isConnecting: boolean;
  isConnected: boolean;
}

export type GameViewState =
  | { kind: "archive" }
  | { kind: "loading"; message: string }
  | { kind: "passwordPrompt" }
  | { kind: "loginRequired" }
  | { kind: "connecting" }
  | { kind: "connectionError"; message: string; retry: "dashboard" | "reload" }
  | { kind: "play" };

const CONNECTION_ERROR_MESSAGES: Record<string, string> = {
  NOT_FOUND: "This room no longer exists",
  ALREADY_STARTED: "Game has already started",
  ALREADY_FINISHED: "This game has ended",
};

export function resolveGameView(i: GameViewInputs): GameViewState {
  if (i.previewLoading) {
    return { kind: "loading", message: "Loading room..." };
  }

  // An archived (or missing) room is served entirely from REST — no socket, and
  // no auth gate, since the results are public.
  if (i.isFinished || i.roomMissing) {
    if (i.hasResults) return { kind: "archive" };
    if (i.resultsPending) {
      return { kind: "loading", message: "Fetching final results..." };
    }
    return {
      kind: "connectionError",
      message: CONNECTION_ERROR_MESSAGES.NOT_FOUND,
      retry: "dashboard",
    };
  }

  // Game is over (or unreachable) and the archived results have arrived.
  const isOver = i.status === "FINISHED" || !!i.error || !i.hasState;
  if (isOver && i.hasResults) return { kind: "archive" };

  // Finished but results still loading.
  if (i.status === "FINISHED") {
    return { kind: "loading", message: "Fetching final results..." };
  }

  if (
    (i.needsPassword && !i.hasPasswordEntered) ||
    i.errorCode === "PASSWORD_REQUIRED" ||
    i.showPasswordPrompt
  ) {
    return { kind: "passwordPrompt" };
  }

  if (i.sessionLoading) {
    return { kind: "loading", message: "Checking session..." };
  }

  if (!i.hasIdentity && !i.isSpectating) return { kind: "loginRequired" };

  if (!i.hasState && (i.isConnecting || i.isConnected) && !i.error) {
    return { kind: "connecting" };
  }

  if (!i.hasState) {
    if (i.error) {
      const message =
        (i.errorCode && CONNECTION_ERROR_MESSAGES[i.errorCode]) || i.error;
      return { kind: "connectionError", message, retry: "dashboard" };
    }
    return {
      kind: "connectionError",
      message: "Could not connect to game",
      retry: "reload",
    };
  }

  return { kind: "play" };
}
