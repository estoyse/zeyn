import type { Player } from "@zeyn/api/game-types";
import type { LivebuzzerPublicState, LivebuzzerState } from "@zeyn/api/games";
import { hasLiveClock } from "./engine";

export class LivebuzzerSerializer {
  private lastBroadcastPlayers: Record<string, string> = {};

  toPublic(
    state: LivebuzzerState,
    forceFullPlayers = false
  ): LivebuzzerPublicState {
    const playerDeltas: Record<string, Partial<Player>> = {};
    let hasChanges = false;
    for (const [id, player] of Object.entries(state.players)) {
      const json = JSON.stringify(player);
      if (forceFullPlayers || this.lastBroadcastPlayers[id] !== json) {
        playerDeltas[id] = player;
        this.lastBroadcastPlayers[id] = json;
        hasChanges = true;
      }
    }

    const lockedBuzz = state.buzzes.find(
      b => b.playerId === state.lockedPlayerId
    );
    const lastResult = state.roundResults[state.roundResults.length - 1];

    const publicState: LivebuzzerPublicState = {
      status: state.status,
      gameType: state.gameType,
      gameId: state.gameId,
      gameName: state.gameName,
      hostId: state.hostId,
      maxPlayers: state.maxPlayers,
      isPublic: state.isPublic,
      hasPassword: state.hasPassword,
      allowGuests: state.allowGuests,
      config: state.config,
      phase: state.phase,
      round: state.round,
      timerExpiresAt: hasLiveClock(state) ? state.timerExpiresAt : 0,
      buzzedPlayerIds: state.buzzes.map(b => b.playerId),
      lockedPlayerId: state.lockedPlayerId,
      lockedReactionMs: lockedBuzz?.reactionMs ?? null,
      lockedOutPlayerIds: [...state.lockedOutPlayerIds],
      wrongAttempts: state.wrongAttempts,
      judgedCount: state.roundResults.length,
    };

    if (lastResult) publicState.lastResult = lastResult;

    if (!state.config.hostPlays && state.hostId) {
      publicState.nonScoringPlayerIds = [state.hostId];
    }

    if (hasChanges || forceFullPlayers) {
      publicState.players = playerDeltas;
    }

    return publicState;
  }
}
