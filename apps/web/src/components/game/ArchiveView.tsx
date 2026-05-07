import { Button } from "@shaxsiy-oyin/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@shaxsiy-oyin/ui/components/card";
import { Trophy, LayoutGrid, UserCircle2 } from "lucide-react";

interface ResultsData {
  playerResults: Array<{
    userId: string;
    playerName: string;
    score: number;
  }>;
  questionResults: Array<{
    userId: string;
    points: number;
    pointsAwarded: number;
    correct: boolean;
  }>;
}

interface ArchiveViewProps {
  data: ResultsData;
  onBack: () => void;
}

export function ArchiveView({ data, onBack }: ArchiveViewProps) {
  const tiers = [10, 20, 30, 40, 50];

  const getPointsForTier = (userId: string, tier: number) => {
    return data.questionResults
      .filter((r) => r.userId === userId && r.points === tier)
      .reduce((acc, r) => acc + r.pointsAwarded, 0);
  };

  return (
    <div className="min-h-screen bg-background p-6 md:p-12">
      <div className="mx-auto max-w-5xl space-y-8 py-12">
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
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-4 text-xs text-muted-foreground uppercase">Player</th>
                    {tiers.map((t, i) => (
                      <th key={t} className="pb-4 text-center text-xs text-muted-foreground uppercase">
                        Q{i + 1} ({t})
                      </th>
                    ))}
                    <th className="pb-4 text-right text-xs text-muted-foreground uppercase">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {data.playerResults.map((p) => (
                    <tr key={p.userId} className="hover:bg-muted/50">
                      <td className="py-4">
                        <div className="flex items-center gap-3">
                          <UserCircle2 className="size-5 text-muted-foreground" />
                          <span className="font-medium">{p.playerName}</span>
                        </div>
                      </td>
                      {tiers.map((t) => {
                        const points = getPointsForTier(p.userId, t);
                        return (
                          <td key={t} className="py-4 text-center">
                            {points !== 0 ? (
                              <span className={`font-bold ${points > 0 ? "text-green-500" : "text-red-500"}`}>
                                {points > 0 ? `+${points}` : points}
                              </span>
                            ) : (
                              <span className="text-muted-foreground opacity-30">-</span>
                            )}
                          </td>
                        );
                      })}
                      <td className="py-4 text-right">
                        <span className="text-xl font-bold tabular-nums">{p.score}</span>
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