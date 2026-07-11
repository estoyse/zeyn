import type { Player } from "@zeyn/api/game-types";
import type { MusicPublicState, MusicQuizState } from "@zeyn/api/games";

export class MusicSerializer {
  private lastBroadcastPlayers: Record<string, string> = {};

  toPublic(state: MusicQuizState, forceFullPlayers = false): MusicPublicState {
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

    const question = state.questions[state.currentQuestionIndex];

    const publicState: MusicPublicState = {
      status: state.status,
      gameType: state.gameType,
      gameId: state.gameId,
      gameName: state.gameName,
      hostId: state.hostId,
      maxPlayers: state.maxPlayers,
      isPublic: state.isPublic,
      hasPassword: state.hasPassword,
      allowGuests: state.allowGuests,
      currentQuestionIndex: state.currentQuestionIndex,
      totalQuestions: state.questions.length,
      phase: state.phase,
      timerExpiresAt: state.timerExpiresAt,
      answeredPlayerIds: Object.keys(state.answers),
    };

    if (hasChanges || forceFullPlayers) {
      publicState.players = playerDeltas;
    }

    if (state.status === "PLAYING" && question) {
      publicState.question = {
        previewUrl: question.previewUrl,
        options: question.options,
      };
      if (state.phase === "REVEAL") {
        publicState.reveal = {
          correctIndex: question.correctIndex,
          correctTitle: question.correctTitle,
          artistName: question.artistName,
          answers: Object.fromEntries(
            Object.entries(state.answers).map(([id, a]) => [
              id,
              {
                optionIndex: a.optionIndex,
                correct: a.correct,
                pointsAwarded: a.pointsAwarded,
              },
            ])
          ),
        };
      }
    }

    return publicState;
  }
}
