// Turns the private `GameState` into the `PublicGameState` broadcast to clients:
// hides the subject/answer bank, and sends only the players that changed since
// the last broadcast (full snapshot on demand, e.g. for a freshly connected
// socket). Owns the per-player diff cache, so one instance lives per DO.

import type {
  GameState,
  Player,
  PublicGameState,
} from "@shaxsiy-oyin/api/game-types";

export class StateSerializer {
  // playerId -> JSON of the last player state we broadcast, for delta detection.
  private lastBroadcastPlayers: Record<string, string> = {};

  /**
   * Build the public view. When `forceFullPlayers` is true every player is
   * included (used for the initial snapshot); otherwise only players whose state
   * changed since the previous call are sent.
   */
  toPublic(state: GameState, forceFullPlayers = false): PublicGameState {
    const { subjects, players, ...baseState } = state;

    const playerDeltas: Record<string, Partial<Player>> = {};
    let hasChanges = false;
    for (const [id, player] of Object.entries(players)) {
      const playerJson = JSON.stringify(player);
      if (forceFullPlayers || this.lastBroadcastPlayers[id] !== playerJson) {
        playerDeltas[id] = player;
        this.lastBroadcastPlayers[id] = playerJson;
        hasChanges = true;
      }
    }

    const publicState: PublicGameState = {
      ...baseState,
      subjectCount: subjects.length,
    };

    if (hasChanges || forceFullPlayers) {
      publicState.players = playerDeltas;
    }

    if (state.status === "PLAYING") {
      const currentSubject = subjects[state.currentSubjectIndex];
      const currentQuestion =
        currentSubject?.questions?.[state.currentQuestionIndex];

      if (currentSubject) {
        publicState.currentSubjectName = currentSubject.name;
      }
      if (currentQuestion) {
        publicState.currentQuestion = {
          text: currentQuestion.text,
          points: currentQuestion.points,
          ...(state.phase === "REVEALED"
            ? { answer: currentQuestion.answer }
            : {}),
        };
      }
    }

    return publicState;
  }
}
