import { eq, schema } from "@zeyn/db";
import type { createDb } from "@zeyn/db";

// Server-only: this file runs SQL, so it is NOT re-exported from `./index`
// (which the web bundle imports). The `getResults` router dispatches here.

type Db = ReturnType<typeof createDb>;
type HistoryRow = typeof schema.gameHistory.$inferSelect;

export interface BuzzerResultsDetail {
  subjects: string[];
  questionResults: Array<{
    userId: string;
    subjectName: string;
    subjectPosition: number;
    questionPosition: number;
    correct: boolean;
    pointsAwarded: number;
  }>;
}

// Union of every game's result-detail shape. Currently just buzzer; a second
// game adds its own member here. Once shapes diverge enough that one endpoint is
// awkward, `getResults` splits into per-game endpoints (see migration plan §4).
export type GameResultsDetail = BuzzerResultsDetail;

export interface GameResultsProvider {
  /** Load the game-specific result detail for one finished match. */
  loadDetail(db: Db, history: HistoryRow): Promise<GameResultsDetail>;
}

const buzzerResultsProvider: GameResultsProvider = {
  async loadDetail(db, history) {
    const questionResults = await db
      .select({
        userId: schema.gameQuestionResults.userId,
        subjectName: schema.gameQuestionResults.subjectName,
        subjectPosition: schema.gameQuestionResults.subjectPosition,
        questionPosition: schema.gameQuestionResults.questionPosition,
        correct: schema.gameQuestionResults.correct,
        pointsAwarded: schema.gameQuestionResults.pointsAwarded,
      })
      .from(schema.gameQuestionResults)
      .where(eq(schema.gameQuestionResults.gameId, history.id));

    return {
      subjects: JSON.parse(history.subjects) as string[],
      questionResults,
    };
  },
};

// Platform owns the universal scoreboard (game_history + game_player_results);
// each game owns its own detail loader, keyed by game type here.
const resultsProviders: Record<string, GameResultsProvider> = {
  buzzer: buzzerResultsProvider,
};

const EMPTY_DETAIL: GameResultsDetail = { subjects: [], questionResults: [] };

/** Dispatch to the finished match's game-owned detail loader. */
export function loadResultsDetail(
  db: Db,
  history: HistoryRow
): Promise<GameResultsDetail> {
  const provider = resultsProviders[history.gameType];
  return provider ? provider.loadDetail(db, history) : Promise.resolve(EMPTY_DETAIL);
}
