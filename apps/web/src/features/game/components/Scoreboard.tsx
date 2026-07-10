import { motion } from "framer-motion";
import { Badge } from "@zeyn/ui/components/badge";
import { cn } from "@zeyn/ui/lib/utils";
import { Crown, Trophy } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { ClientRoomState } from "@/features/game/hooks/useGameState";

interface ScoreboardProps {
  state: ClientRoomState;
  playerId: string;
  variant?: "rail" | "strip";
}

function rank(state: ClientRoomState) {
  return Object.values(state.players).sort(
    (a, b) => b.score - a.score || a.name.localeCompare(b.name)
  );
}

export function Scoreboard({ state, playerId, variant = "rail" }: ScoreboardProps) {
  const { t } = useTranslation();
  const players = rank(state);

  if (variant === "strip") {
    return (
      <div className='flex gap-2 overflow-x-auto pb-1'>
        {players.map((p, i) => (
          <motion.div
            layout
            key={p.id}
            className={cn(
              "flex shrink-0 items-center gap-2 border bg-muted px-3 py-2",
              p.id === playerId ? "border-brand" : "border-border",
              !p.connected && "opacity-50"
            )}
          >
            <span className='text-xs tabular-nums text-muted-foreground'>
              {i + 1}
            </span>
            <div className='flex flex-col'>
              <span className='flex items-center gap-1 text-xs text-muted-foreground'>
                {p.name}
                {state.hostId === p.id && (
                  <Crown className='size-3 text-brand' />
                )}
              </span>
              <span className='font-bold tabular-nums'>{p.score}</span>
            </div>
          </motion.div>
        ))}
      </div>
    );
  }

  return (
    <div className='border bg-background'>
      <div className='flex items-center gap-2 border-b px-4 py-3'>
        <Trophy className='size-4 text-brand' />
        <h2 className='text-xs font-semibold uppercase tracking-widest'>
          {t("game:scoreboard.title")}
        </h2>
      </div>

      {players.length === 0 ? (
        <p className='px-4 py-6 text-center text-sm text-muted-foreground'>
          {t("game:scoreboard.empty")}
        </p>
      ) : (
        <ul className='divide-y'>
          {players.map((p, i) => (
            <motion.li
              layout
              key={p.id}
              className={cn(
                "flex items-center gap-3 px-4 py-3",
                p.id === playerId && "bg-brand/5"
              )}
            >
              <span className='w-5 shrink-0 text-sm tabular-nums text-muted-foreground'>
                {i + 1}
              </span>

              <span
                className={cn(
                  "size-2 shrink-0 rounded-full",
                  p.connected ? "bg-success" : "bg-muted-foreground/40"
                )}
              />

              <div className='min-w-0 flex-1'>
                <p
                  className={cn(
                    "truncate text-sm font-medium",
                    !p.connected && "text-muted-foreground"
                  )}
                >
                  {p.name}
                </p>
                <div className='flex items-center gap-1'>
                  {state.hostId === p.id && (
                    <Badge tone='outline' className='gap-1 px-1 py-0 text-[10px]'>
                      <Crown className='size-2.5 text-brand' />
                      {t("game:scoreboard.host")}
                    </Badge>
                  )}
                  {p.id === playerId && (
                    <Badge tone='brand' className='px-1 py-0 text-[10px]'>
                      {t("game:scoreboard.you")}
                    </Badge>
                  )}
                </div>
              </div>

              <span className='shrink-0 text-lg font-bold tabular-nums'>
                {p.score}
              </span>
            </motion.li>
          ))}
        </ul>
      )}
    </div>
  );
}
