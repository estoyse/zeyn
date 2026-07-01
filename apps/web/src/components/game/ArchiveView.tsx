import { Button } from "@shaxsiy-oyin/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@shaxsiy-oyin/ui/components/card";
import { Trophy, LayoutGrid } from "lucide-react";

const QUESTIONS_PER_SUBJECT = 5;

interface ResultsData {
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
    correct: boolean;
  }>;
}

interface ArchiveViewProps {
  data: ResultsData;
  onBack: () => void;
}

export function ArchiveView({ data, onBack }: ArchiveViewProps) {
  const { subjects, playerResults, questionResults } = data;

  // (userId, subjectPos, questionPos) -> pointsAwarded, for O(1) cell lookup.
  const cellPoints = new Map<string, number>();
  for (const r of questionResults) {
    cellPoints.set(
      `${r.userId}:${r.subjectPosition}:${r.questionPosition}`,
      r.pointsAwarded
    );
  }

  const questionSlots = Array.from(
    { length: QUESTIONS_PER_SUBJECT },
    (_, i) => i
  );

  return (
    <div className="min-h-screen bg-background p-6 md:p-12">
      <div className="mx-auto max-w-6xl space-y-8 py-12">
        <div className="text-center space-y-4">
          <div className="mx-auto inline-block bg-primary/10 p-4 rounded-lg">
            <Trophy className="size-12 text-primary" />
          </div>
          <h1 className="text-4xl md:text-6xl font-bold">Game Results</h1>
          <p className="text-muted-foreground text-sm uppercase tracking-widest">
            Fetched from Archive
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LayoutGrid className="size-5" />
              Detailed Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b">
                    <th
                      rowSpan={2}
                      className="px-2 py-2 text-center text-xs text-muted-foreground uppercase border-r"
                    >
                      T/r
                    </th>
                    <th
                      rowSpan={2}
                      className="px-3 py-2 text-left text-xs text-muted-foreground uppercase border-r"
                    >
                      Ishtirokchi
                    </th>
                    {subjects.map((name, si) => (
                      <th
                        key={si}
                        colSpan={QUESTIONS_PER_SUBJECT}
                        className="px-2 py-2 text-center text-xs font-semibold uppercase border-r"
                        title={name}
                      >
                        {name || `${si + 1}-mavzu`}
                      </th>
                    ))}
                    <th
                      rowSpan={2}
                      className="px-3 py-2 text-center text-xs text-muted-foreground uppercase"
                    >
                      Jami
                    </th>
                  </tr>
                  <tr className="border-b">
                    {subjects.map((_, si) =>
                      questionSlots.map(qi => (
                        <th
                          key={`${si}:${qi}`}
                          className={`px-2 py-1 text-center text-xs text-muted-foreground ${
                            qi === QUESTIONS_PER_SUBJECT - 1 ? "border-r" : ""
                          }`}
                        >
                          {qi + 1}
                        </th>
                      ))
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {playerResults.map((p, rowIdx) => (
                    <tr key={p.userId} className="hover:bg-muted/50">
                      <td className="px-2 py-2 text-center text-muted-foreground border-r tabular-nums">
                        {rowIdx + 1}
                      </td>
                      <td className="px-3 py-2 font-medium border-r whitespace-nowrap">
                        {p.playerName}
                      </td>
                      {subjects.map((_, si) =>
                        questionSlots.map(qi => {
                          const points = cellPoints.get(
                            `${p.userId}:${si}:${qi}`
                          );
                          const isSubjectEnd = qi === QUESTIONS_PER_SUBJECT - 1;
                          return (
                            <td
                              key={`${si}:${qi}`}
                              className={`px-2 py-2 text-center tabular-nums ${
                                isSubjectEnd ? "border-r" : ""
                              }`}
                            >
                              {points !== undefined ? (
                                <span
                                  className={`font-semibold ${
                                    points > 0
                                      ? "text-green-500"
                                      : "text-red-500"
                                  }`}
                                >
                                  {points}
                                </span>
                              ) : (
                                <span className="text-muted-foreground opacity-20">
                                  ·
                                </span>
                              )}
                            </td>
                          );
                        })
                      )}
                      <td
                        className={`px-3 py-2 text-center font-bold tabular-nums ${
                          p.score > 0
                            ? "bg-yellow-400/20 text-yellow-500"
                            : ""
                        }`}
                      >
                        {p.score}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <div className="text-center">
          <Button onClick={onBack}>Back to Dashboard</Button>
        </div>
      </div>
    </div>
  );
}
