import { describe, expect, it } from "vitest";

import { resolveGameView, type GameViewInputs } from "./resolveGameView";

const base: GameViewInputs = {
  status: undefined,
  hasState: false,
  hasResults: false,
  resultsPending: false,
  previewLoading: false,
  isFinished: false,
  roomMissing: false,
  needsPassword: false,
  hasPasswordEntered: false,
  error: null,
  errorCode: null,
  showPasswordPrompt: false,
  isAuthed: true,
  hasIdentity: true,
  isSpectating: false,
  sessionLoading: false,
  isConnecting: false,
  isConnected: false,
};

describe("resolveGameView", () => {
  it("does not flash a connection error in the frame before the socket opens", () => {
    expect(resolveGameView(base)).toEqual({ kind: "connecting" });
  });

  it("shows connecting once the socket is opening", () => {
    expect(resolveGameView({ ...base, isConnecting: true })).toEqual({
      kind: "connecting",
    });
  });

  it("plays once state has arrived", () => {
    expect(
      resolveGameView({ ...base, hasState: true, isConnected: true })
    ).toEqual({ kind: "play" });
  });

  it("still surfaces a real connection error", () => {
    expect(
      resolveGameView({ ...base, error: "boom", errorCode: "NOT_FOUND" })
    ).toEqual({
      kind: "connectionError",
      message: "errors.connection.notFound",
      retry: "dashboard",
    });
  });

  it("keeps showing the room while reconnecting mid-game", () => {
    expect(
      resolveGameView({
        ...base,
        status: "PLAYING",
        hasState: true,
        isConnected: false,
        isConnecting: false,
      })
    ).toEqual({ kind: "play" });
  });
});
