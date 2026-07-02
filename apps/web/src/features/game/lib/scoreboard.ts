import { gameConfig } from "@zeyn/api/game-types";

// Raw shape returned by trpc.game.getResults (the parts the scoreboard needs).
export interface ScoreboardResults {
  subjects: string[];
  playerResults: Array<{
    userId: string;
    playerName: string;
    score: number;
  }>;
  questionResults: Array<{
    userId: string;
    subjectPosition: number;
    questionPosition: number;
    pointsAwarded: number;
  }>;
}

export interface ScoreboardRow {
  userId: string;
  playerName: string;
  score: number;
  // cells[subjectPosition][questionPosition] = points awarded, or null if the
  // player never answered that question.
  cells: (number | null)[][];
}

export interface Scoreboard {
  subjects: string[];
  questionsPerSubject: number;
  rows: ScoreboardRow[];
}

// Pure transform: builds the participant x (subject, question) matrix the
// ArchiveView renders. Kept out of the component so it can be unit-tested and
// so the component is purely presentational.
export function buildScoreboard(data: ScoreboardResults): Scoreboard {
  const { subjects, playerResults, questionResults } = data;
  const questionsPerSubject = gameConfig.questionsPerSubject;

  const points = new Map<string, number>();
  for (const r of questionResults) {
    points.set(
      `${r.userId}:${r.subjectPosition}:${r.questionPosition}`,
      r.pointsAwarded
    );
  }

  const rows: ScoreboardRow[] = playerResults.map(p => ({
    userId: p.userId,
    playerName: p.playerName,
    score: p.score,
    cells: subjects.map((_, si) =>
      Array.from({ length: questionsPerSubject }, (_, qi) => {
        const v = points.get(`${p.userId}:${si}:${qi}`);
        return v === undefined ? null : v;
      })
    ),
  }));

  return { subjects, questionsPerSubject, rows };
}
