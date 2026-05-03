import { Button } from "@shaxsiy-oyin/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@shaxsiy-oyin/ui/components/card";
import { Trophy, LayoutGrid, Crown, UserCircle2 } from "lucide-react";
import { motion } from "framer-motion";

interface GameFinishedProps {
  state: {
    players: Record<string, { id: string; name: string; score: number }>;
    subjects: Array<{ id: string; name: string }>;
  };
  playerId: string;
  onReturn: () => void;
}

export function GameFinished({ state, playerId, onReturn }: GameFinishedProps) {
  const sortedPlayers = Object.values(state.players).sort((a, b) => b.score - a.score);

  return (
    <motion.div
      key="finished"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="space-y-6"
    >
      <div className="text-center space-y-3">
        <div className="mx-auto inline-block bg-primary/10 p-3 rounded-lg">
          <Trophy className="size-10 text-primary" />
        </div>
        <h1 className="text-3xl md:text-4xl font-bold">Game Over</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-[1fr_250px]">
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
                  <th className="pb-3 text-xs text-muted-foreground uppercase">Rank</th>
                  <th className="pb-3 text-xs text-muted-foreground uppercase">Player</th>
                  <th className="pb-3 text-right text-xs text-muted-foreground uppercase">Score</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {sortedPlayers.map((p, idx) => (
                  <motion.tr
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    key={p.id}
                    className={`hover:bg-muted/50 ${idx === 0 ? "text-primary" : ""}`}
                  >
                    <td className="py-3 font-bold text-xl opacity-50">{idx + 1}</td>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <div
                          className={`flex size-8 items-center justify-center rounded-lg border ${
                            idx === 0
                              ? "bg-primary/10 border-primary/20"
                              : "bg-muted border-border"
                          }`}
                        >
                          {idx === 0 ? (
                            <Crown className="size-4" />
                          ) : (
                            <UserCircle2 className="size-4 text-muted-foreground" />
                          )}
                        </div>
                        <span className="font-medium">{p.name}</span>
                      </div>
                    </td>
                    <td className="py-3 text-right">
                      <span className="text-2xl font-bold">{p.score}</span>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="bg-primary text-primary-foreground">
            <CardContent className="p-4 space-y-3">
              <p className="font-medium">Game Over!</p>
              <p className="text-sm opacity-80">Great game! Ready for a rematch?</p>
              <Button variant="secondary" className="w-full" onClick={onReturn}>
                New Game
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Quick Stats</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subjects Played</span>
                <span className="font-medium">{state.subjects.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Avg Score</span>
                  <span className="font-medium">
                    {sortedPlayers.length > 0
                      ? Math.round(
                          sortedPlayers.reduce((acc, p) => acc + p.score, 0) / sortedPlayers.length
                        )
                      : 0}
                  </span>
                </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}