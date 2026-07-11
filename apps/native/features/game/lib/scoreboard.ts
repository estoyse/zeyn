import { gameConfig } from "@zeyn/api/game-types";

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
  cells: (number | null)[][];
}

export interface Scoreboard {
  subjects: string[];
  questionsPerSubject: number;
  rows: ScoreboardRow[];
}

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
