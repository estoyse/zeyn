import { Button } from "@zeyn/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@zeyn/ui/components/card";
import { Trophy, LayoutGrid } from "lucide-react";
import { useTranslation } from "react-i18next";
import { buildScoreboard, type ScoreboardResults } from "@/features/game/lib/scoreboard";

interface ArchiveViewProps {
  data: ScoreboardResults;
  onBack: () => void;
}

export function ArchiveView({ data, onBack }: ArchiveViewProps) {
  const { t } = useTranslation();
  const { subjects, questionsPerSubject, rows } = buildScoreboard(data);
  const questionSlots = Array.from(
    { length: questionsPerSubject },
    (_, i) => i
  );

  return (
    <div className="min-h-screen bg-background p-6 md:p-12">
      <div className="mx-auto max-w-6xl space-y-8 py-12">
        <div className="text-center space-y-4">
          <div className="mx-auto inline-block bg-brand/10 p-4 text-brand">
            <Trophy className="size-12" />
          </div>
          <h1 className="text-4xl md:text-6xl font-bold">{t("game:archive.title")}</h1>
          <p className="text-muted-foreground text-sm uppercase tracking-widest">
            {t("game:archive.subtitle")}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LayoutGrid className="size-5" />
              {t("game:archive.detailedResults")}
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
                      {t("game:archive.rank")}
                    </th>
                    <th
                      rowSpan={2}
                      className="px-3 py-2 text-left text-xs text-muted-foreground uppercase border-r"
                    >
                      {t("game:archive.participant")}
                    </th>
                    {subjects.map((name, si) => (
                      <th
                        key={si}
                        colSpan={questionsPerSubject}
                        className="px-2 py-2 text-center text-xs font-semibold uppercase border-r"
                        title={name}
                      >
                        {name || t("game:archive.subjectFallback", { index: si + 1 })}
                      </th>
                    ))}
                    <th
                      rowSpan={2}
                      className="px-3 py-2 text-center text-xs text-muted-foreground uppercase"
                    >
                      {t("game:archive.total")}
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
                                      ? "text-success"
                                      : "text-destructive"
                                  }`}
                                >
                                  {points}
                                </span>
                              ) : (
                                <span className="text-muted-foreground/30">
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
                            ? "bg-brand/10 text-brand"
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
          <Button variant="brand" onClick={onBack}>
            {t("game:archive.backToDashboard")}
          </Button>
        </div>
      </div>
    </div>
  );
}
