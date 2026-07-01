import { motion } from "framer-motion";
import { Button } from "@shaxsiy-oyin/ui/components/button";
import { Input } from "@shaxsiy-oyin/ui/components/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@shaxsiy-oyin/ui/components/card";
import { toast } from "sonner";
import { Users, Play, Info, Crown, UserCircle2, Copy } from "lucide-react";
import { gameConfig } from "@shaxsiy-oyin/api/game-types";
import type { GameView } from "@/lib/useGameState";

interface GameLobbyProps {
  state: GameView;
  playerId: string;
  onStart: () => void;
}

export function GameLobby({ state, playerId, onStart }: GameLobbyProps) {
  const isHost = state.hostId === playerId;

  return (
    <motion.div
      key="lobby"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="grid gap-6 lg:grid-cols-[1fr_350px]"
    >
      <div className="space-y-6">
        <Card>
          <CardHeader className="space-y-4">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Users className="size-5" />
                Players in Lobby
              </CardTitle>
              <span className="text-xs text-muted-foreground">
                {Object.keys(state.players).length} / {state.maxPlayers} joined
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2">
              {Object.values(state.players).map((p) => (
                <motion.div
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  key={p.id}
                  className="flex items-center justify-between border bg-muted/20 p-3 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className={`flex size-8 items-center justify-center rounded-md ${p.connected ? "bg-muted" : "bg-muted/50 opacity-50"}`}>
                      <UserCircle2 className={`size-4 ${p.connected ? "text-muted-foreground" : "text-muted-foreground/50"}`} />
                    </div>
                    <span className={`font-medium text-sm ${p.connected ? "" : "line-through"}`}>{p.name}</span>
                  </div>
                  {p.id === state.hostId && (
                    <div className="flex items-center gap-1 bg-primary/10 px-2 py-1 rounded text-[10px] text-primary">
                      <Crown className="size-2" />
                      HOST
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-muted/10 border-dashed">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex size-10 items-center justify-center bg-primary/10 rounded-lg">
              <Info className="size-5 text-primary" />
            </div>
            <div>
              <p className="font-medium text-sm">Game Information</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Game consists of {state.subjectCount} categories.
                Each category has 5 questions worth 10-50 points.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <aside className="space-y-4">
        <Card className="h-fit sticky top-4">
          <CardHeader>
            <CardTitle className="text-lg">Game Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground uppercase">Game Progress</p>
              <div className="flex flex-wrap gap-1">
                {Array.from({ length: state.subjectCount }).map((_, i) => (
                  <div
                    key={i}
                    className="px-2 py-1 bg-background border rounded text-xs"
                  >
                    Category {i + 1}
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs text-muted-foreground uppercase">Share Entry Point</p>
              <div className="flex gap-1">
                <Input
                  readOnly
                  value={window.location.href}
                  className="text-xs h-8 bg-muted/50 font-mono"
                />
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    toast.success("Link copied!");
                  }}
                >
                  <Copy className="size-3" />
                </Button>
              </div>
            </div>

            {isHost ? (
              <Button
                className="w-full"
                onClick={onStart}
                disabled={Object.keys(state.players).length < gameConfig.minPlayers}
              >
                <Play className="size-4 mr-2" />
                Start Game
              </Button>
            ) : (
              <div className="flex flex-col items-center gap-2 p-4 text-center bg-muted/30 rounded-lg border border-dashed">
                <div className="size-2 bg-primary rounded-full animate-ping" />
                <p className="text-xs text-muted-foreground">Waiting for host to start...</p>
              </div>
            )}
          </CardContent>
        </Card>
      </aside>
    </motion.div>
  );
}