import { Trophy, Medal } from "lucide-react";
import { Button } from "@shaxsiy-oyin/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@shaxsiy-oyin/ui/components/card";
import type { GameResultsViewProps } from "@/features/games/types";

const RANK_COLORS = ["text-yellow-500", "text-slate-400", "text-amber-700"];

export function MusicResults({ results, onBack }: GameResultsViewProps) {
  const rows = [...results.playerResults].sort((a, b) => b.score - a.score);

  return (
    <div className='min-h-screen bg-background p-6 md:p-12'>
      <div className='mx-auto max-w-2xl space-y-8 py-12'>
        <div className='text-center space-y-4'>
          <div className='mx-auto inline-block bg-primary/10 p-4 rounded-lg'>
            <Trophy className='size-12 text-primary' />
          </div>
          <h1 className='text-4xl md:text-6xl font-bold'>Final Leaderboard</h1>
          <p className='text-muted-foreground text-sm uppercase tracking-widest'>
            Music Quiz
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Standings</CardTitle>
          </CardHeader>
          <CardContent className='space-y-2'>
            {rows.map((p, i) => (
              <div
                key={p.userId}
                className={`flex items-center justify-between rounded-lg border p-4 ${
                  i === 0 ? "bg-primary/5 border-primary/40" : "bg-muted/20"
                }`}
              >
                <div className='flex items-center gap-3'>
                  <div className='flex size-8 items-center justify-center font-bold'>
                    {i < 3 ? (
                      <Medal className={`size-5 ${RANK_COLORS[i]}`} />
                    ) : (
                      <span className='text-muted-foreground'>{i + 1}</span>
                    )}
                  </div>
                  <span className='font-semibold'>{p.playerName}</span>
                </div>
                <span className='text-lg font-bold tabular-nums'>{p.score}</span>
              </div>
            ))}
            {rows.length === 0 && (
              <p className='text-center text-sm text-muted-foreground'>
                No scores recorded.
              </p>
            )}
          </CardContent>
        </Card>

        <div className='flex justify-center'>
          <Button onClick={onBack}>Back to Dashboard</Button>
        </div>
      </div>
    </div>
  );
}
