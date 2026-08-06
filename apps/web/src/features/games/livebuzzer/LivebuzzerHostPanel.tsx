import { motion } from "framer-motion";
import {
  Check,
  X,
  Zap,
  SkipForward,
  XCircle,
  Flag,
  Minus,
  Plus,
  Crown,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@zeyn/ui/components/button";
import { Badge } from "@zeyn/ui/components/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@zeyn/ui/components/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@zeyn/ui/components/alert-dialog";
import { cn } from "@zeyn/ui/lib/utils";
import { Timer } from "@/features/game/components/Timer";
import type { GamePlayViewProps } from "@/features/games/types";
import type { LivebuzzerView } from "./types";

export function LivebuzzerHostPanel({ room }: GamePlayViewProps) {
  const { t } = useTranslation();
  const state = room.state as LivebuzzerView | null;
  if (!state) return null;

  const expiresAt = state.timerExpiresAt
    ? state.timerExpiresAt - room.serverTimeOffset
    : 0;
  const roundLive =
    state.phase === "ARMED" || state.phase === "COLLECTING" || state.phase === "LOCKED";

  const onArm = () => room.send({ type: "ARM", playerId: room.userId });
  const onSkipRound = () => room.send({ type: "SKIP_ROUND", playerId: room.userId });
  const onJudge = (correct: boolean) =>
    room.send({ type: "JUDGE", playerId: room.userId, correct });
  const onEndGame = () => room.send({ type: "END_GAME", playerId: room.userId });
  const onAdjustScore = (targetId: string, delta: number) =>
    room.send({ type: "ADJUST_SCORE", playerId: room.userId, targetId, delta });

  const lockedPlayerName = state.lockedPlayerId
    ? state.players[state.lockedPlayerId]?.name
    : null;

  const players = Object.values(state.players).sort(
    (a, b) => b.score - a.score || a.name.localeCompare(b.name)
  );

  return (
    <motion.div
      key="livebuzzer-host"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-lg">
            {t("games:livebuzzer.host.round", { round: state.round })}
            {roundLive && (
              <Badge tone={state.wrongAttempts >= state.config.maxWrongPerRound ? "destructive" : "default"}>
                {t("games:livebuzzer.host.wrongAttempts", {
                  count: state.wrongAttempts,
                  max: state.config.maxWrongPerRound,
                })}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-5 p-6">
          {state.phase === "IDLE" && (
            <>
              <p className="text-sm text-muted-foreground">
                {t("games:livebuzzer.host.idleHint")}
              </p>
              <Button size="lg" variant="brand" className="w-full max-w-xs" onClick={onArm}>
                <Zap className="mr-2 size-4" />
                {t("games:livebuzzer.host.openBuzzer")}
              </Button>
            </>
          )}

          {state.phase === "ARMED" && (
            <>
              {expiresAt > 0 && (
                <div className="w-full max-w-sm">
                  <Timer expiresAt={expiresAt} duration={state.config.buzzWindowMs} />
                </div>
              )}
              <p className="text-sm text-muted-foreground">
                {t("games:livebuzzer.host.armedHint")}
              </p>
              <Button
                size="lg"
                variant="destructive"
                className="w-full max-w-xs"
                onClick={onSkipRound}
              >
                <XCircle className="mr-2 size-4" />
                {t("games:livebuzzer.host.cancelRound")}
              </Button>
            </>
          )}

          {state.phase === "COLLECTING" && (
            <p className="text-sm text-muted-foreground animate-pulse">
              {t("games:livebuzzer.host.lockingIn")}
            </p>
          )}

          {state.phase === "LOCKED" && (
            <>
              <div className="text-center">
                <p className="text-2xl font-bold">
                  {state.lockedReactionMs !== null
                    ? t("games:livebuzzer.host.lockedReaction", {
                        name: lockedPlayerName ?? "",
                        ms: state.lockedReactionMs,
                      })
                    : lockedPlayerName}
                </p>
              </div>
              {expiresAt > 0 && (
                <div className="w-full max-w-sm">
                  <Timer expiresAt={expiresAt} duration={state.config.answerTimeMs} />
                </div>
              )}
              <div className="grid w-full max-w-sm grid-cols-2 gap-3">
                <Button size="lg" variant="brand" onClick={() => onJudge(true)}>
                  <Check className="mr-2 size-4" />
                  {t("games:livebuzzer.host.correct")}
                </Button>
                <Button size="lg" variant="destructive" onClick={() => onJudge(false)}>
                  <X className="mr-2 size-4" />
                  {t("games:livebuzzer.host.wrong")}
                </Button>
              </div>
              <Button size="sm" variant="ghost" onClick={onSkipRound}>
                <SkipForward className="mr-2 size-3.5" />
                {t("games:livebuzzer.host.skipRound")}
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t("games:livebuzzer.host.scoreboardTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ul className="divide-y">
            {players.map(p => (
              <li key={p.id} className="flex items-center gap-3 px-6 py-3">
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1 truncate text-sm font-medium">
                    {p.name}
                    {p.id === state.hostId && <Crown className="size-3 text-brand" />}
                  </p>
                </div>
                <span className="w-12 shrink-0 text-right text-lg font-bold tabular-nums">
                  {p.score}
                </span>
                <div className="flex shrink-0 items-stretch border">
                  <ScoreButton
                    label={`-${state.config.pointsPerCorrect}`}
                    ariaLabel={t("games:livebuzzer.host.decreaseScore", {
                      amount: state.config.pointsPerCorrect,
                    })}
                    onClick={() => onAdjustScore(p.id, -state.config.pointsPerCorrect)}
                  />
                  <ScoreButton
                    icon={<Minus className="size-3" />}
                    ariaLabel={t("games:livebuzzer.host.decreaseScore", { amount: 1 })}
                    onClick={() => onAdjustScore(p.id, -1)}
                    borderLeft
                  />
                  <ScoreButton
                    icon={<Plus className="size-3" />}
                    ariaLabel={t("games:livebuzzer.host.increaseScore", { amount: 1 })}
                    onClick={() => onAdjustScore(p.id, 1)}
                    borderLeft
                  />
                  <ScoreButton
                    label={`+${state.config.pointsPerCorrect}`}
                    ariaLabel={t("games:livebuzzer.host.increaseScore", {
                      amount: state.config.pointsPerCorrect,
                    })}
                    onClick={() => onAdjustScore(p.id, state.config.pointsPerCorrect)}
                    borderLeft
                  />
                </div>
              </li>
            ))}
            {players.length === 0 && (
              <li className="px-6 py-6 text-center text-sm text-muted-foreground">
                {t("game:scoreboard.empty")}
              </li>
            )}
          </ul>
        </CardContent>
      </Card>

      <AlertDialog>
        <AlertDialogTrigger
          render={
            <Button variant="destructive" className="w-full">
              <Flag className="mr-2 size-4" />
              {t("games:livebuzzer.host.endGame")}
            </Button>
          }
        />
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>{t("games:livebuzzer.host.endGameConfirm.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("games:livebuzzer.host.endGameConfirm.description")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("games:livebuzzer.host.endGameConfirm.cancel")}</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={onEndGame}>
              {t("games:livebuzzer.host.endGameConfirm.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}

function ScoreButton({
  label,
  icon,
  ariaLabel,
  onClick,
  borderLeft,
}: {
  label?: string;
  icon?: React.ReactNode;
  ariaLabel: string;
  onClick: () => void;
  borderLeft?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className={cn(
        "grid h-9 min-w-9 place-content-center px-2 text-xs font-semibold tabular-nums text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
        borderLeft && "border-l"
      )}
    >
      {icon ?? label}
    </button>
  );
}
