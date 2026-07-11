export interface GameViewInputs {
  status?: "WAITING" | "PLAYING" | "FINISHED";
  hasState: boolean;
  hasResults: boolean;
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
  NOT_FOUND: "errors.connection.notFound",
  ALREADY_STARTED: "errors.connection.alreadyStarted",
  ALREADY_FINISHED: "errors.connection.alreadyFinished",
};

export function resolveGameView(i: GameViewInputs): GameViewState {
  const isOver = i.status === "FINISHED" || !!i.error || !i.hasState;
  if (isOver && i.hasResults) return { kind: "archive" };

  if (i.status === "FINISHED") {
    return { kind: "loading", message: "loading.results" };
  }

  if (i.errorCode === "PASSWORD_REQUIRED" || i.showPasswordPrompt) {
    return { kind: "passwordPrompt" };
  }

  if (i.sessionLoading) {
    return { kind: "loading", message: "loading.checkingSession" };
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
      message: "errors.connection.generic",
      retry: "reload",
    };
  }

  return { kind: "play" };
}
