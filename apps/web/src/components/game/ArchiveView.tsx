import { Button } from "@shaxsiy-oyin/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@shaxsiy-oyin/ui/components/card";
import { Trophy, LayoutGrid } from "lucide-react";
import { buildScoreboard, type ScoreboardResults } from "@/lib/scoreboard";

interface ArchiveViewProps {
  data: ScoreboardResults;
  onBack: () => void;
}

export function ArchiveView({ data, onBack }: ArchiveViewProps) {
  const { subjects, questionsPerSubject, rows } = buildScoreboard(data);
  const questionSlots = Array.from(
    { length: questionsPerSubject },
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
                        colSpan={questionsPerSubject}
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
                            qi === questionsPerSubject - 1 ? "border-r" : ""
                          }`}
                        >
                          {qi + 1}
                        </th>
                      ))
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {rows.map((row, rowIdx) => (
                    <tr key={row.userId} className="hover:bg-muted/50">
                      <td className="px-2 py-2 text-center text-muted-foreground border-r tabular-nums">
                        {rowIdx + 1}
                      </td>
                      <td className="px-3 py-2 font-medium border-r whitespace-nowrap">
                        {row.playerName}
                      </td>
                      {row.cells.map((subjectCells, si) =>
                        subjectCells.map((points, qi) => {
                          const isSubjectEnd = qi === questionsPerSubject - 1;
                          return (
                            <td
                              key={`${si}:${qi}`}
                              className={`px-2 py-2 text-center tabular-nums ${
                                isSubjectEnd ? "border-r" : ""
                              }`}
                            >
                              {points !== null ? (
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
                          row.score > 0
                            ? "bg-yellow-400/20 text-yellow-500"
                            : ""
                        }`}
                      >
                        {row.score}
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
