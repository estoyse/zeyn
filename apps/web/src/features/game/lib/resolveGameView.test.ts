import { describe, it, expect } from "vitest";
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
  isAuthed: false,
  hasIdentity: false,
  isSpectating: false,
  sessionLoading: false,
  isConnecting: false,
  isConnected: false,
};

describe("resolveGameView", () => {
  it("waits for the room preview before deciding anything", () => {
    expect(resolveGameView({ ...base, previewLoading: true })).toEqual({
      kind: "loading",
      message: "Loading room...",
    });
  });

  it("shows a finished game's archive to a logged-out visitor, without an auth gate", () => {
    const view = resolveGameView({
      ...base,
      isFinished: true,
      hasResults: true,
      hasIdentity: false,
      isAuthed: false,
    });
    expect(view).toEqual({ kind: "archive" });
  });

  it("never asks a finished game to connect", () => {
    const view = resolveGameView({
      ...base,
      isFinished: true,
      resultsPending: true,
      hasIdentity: true,
    });
    expect(view).toEqual({
      kind: "loading",
      message: "Fetching final results...",
    });
  });

  it("reports not-found when an archived room has no results", () => {
    const view = resolveGameView({ ...base, roomMissing: true, hasIdentity: true });
    expect(view).toEqual({
      kind: "connectionError",
      message: "This room no longer exists",
      retry: "dashboard",
    });
  });

  it("prompts for a password before connecting", () => {
    const view = resolveGameView({
      ...base,
      needsPassword: true,
      hasPasswordEntered: false,
      hasIdentity: true,
    });
    expect(view).toEqual({ kind: "passwordPrompt" });
  });

  it("still gates a live room behind identity", () => {
    const view = resolveGameView({ ...base, hasIdentity: false });
    expect(view).toEqual({ kind: "loginRequired" });
  });

  it("does not flash a connection error in the frame before the socket opens", () => {
    const view = resolveGameView({
      ...base,
      hasIdentity: true,
      hasState: false,
      isConnecting: false,
      isConnected: false,
      error: null,
    });
    expect(view).toEqual({ kind: "connecting" });
  });

  it("connects a live room once identity and password are settled", () => {
    const view = resolveGameView({
      ...base,
      hasIdentity: true,
      isConnecting: true,
    });
    expect(view).toEqual({ kind: "connecting" });
  });

  it("plays once state has arrived", () => {
    const view = resolveGameView({
      ...base,
      hasIdentity: true,
      hasState: true,
      isConnected: true,
      status: "PLAYING",
    });
    expect(view).toEqual({ kind: "play" });
  });

  it("archives a game that finishes while connected", () => {
    const view = resolveGameView({
      ...base,
      hasIdentity: true,
      hasState: true,
      status: "FINISHED",
      hasResults: true,
    });
    expect(view).toEqual({ kind: "archive" });
  });
});
