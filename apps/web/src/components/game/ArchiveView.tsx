import { Button } from "@shaxsiy-oyin/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@shaxsiy-oyin/ui/components/card";
import { Trophy, LayoutGrid, Crown, UserCircle2 } from "lucide-react";

interface ResultsData {
  results: Array<{
    id: string;
    playerName: string;
    score: number;
  }>;
}

interface ArchiveViewProps {
  data: ResultsData;
  onBack: () => void;
}

export function ArchiveView({ data, onBack }: ArchiveViewProps) {
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
              Leaderboard
            </CardTitle>
          </CardHeader>
          <CardContent>
            <table className="w-full">
              <thead>
                <tr className="border-b text-left">
                  <th className="pb-4 text-xs text-muted-foreground uppercase">Rank</th>
                  <th className="pb-4 text-xs text-muted-foreground uppercase">Player</th>
                  <th className="pb-4 text-right text-xs text-muted-foreground uppercase">Score</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {data.results.map((p, idx) => (
                  <tr
                    key={p.id}
                    className={`hover:bg-muted/50 ${idx === 0 ? "text-primary" : ""}`}
                  >
                    <td className="py-4 font-bold text-2xl opacity-50">{idx + 1}</td>
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex size-10 items-center justify-center rounded-lg border ${
                            idx === 0
                              ? "bg-primary/10 border-primary/20"
                              : "bg-muted border-border"
                          }`}
                        >
                          {idx === 0 ? (
                            <Crown className="size-5" />
                          ) : (
                            <UserCircle2 className="size-5 text-muted-foreground" />
                          )}
                        </div>
                        <span className="font-medium">{p.playerName}</span>
                      </div>
                    </td>
                    <td className="py-4 text-right">
                      <span className="text-3xl font-bold tabular-nums">{p.score}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        <div className="text-center">
          <Button onClick={onBack}>Back to Dashboard</Button>
        </div>
      </div>
    </div>
  );
}