import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Radio, Lock, Zap } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@zeyn/ui/components/card";
import { Badge } from "@zeyn/ui/components/badge";
import { cn } from "@zeyn/ui/lib/utils";
import { Timer } from "@/features/game/components/Timer";
import type { GamePlayViewProps } from "@/features/games/types";
import type { LivebuzzerView } from "./types";

export function useLivebuzzerArmedAt(phase: LivebuzzerView["phase"]) {
  const armedAtRef = useRef<number | null>(null);
  const prevPhaseRef = useRef<LivebuzzerView["phase"] | null>(null);

  useEffect(() => {
    if (prevPhaseRef.current !== "ARMED" && phase === "ARMED") {
      armedAtRef.current = Date.now();
    }
    prevPhaseRef.current = phase;
  }, [phase]);

  return armedAtRef;
}

export function LivebuzzerPlayerBuzzer({ room }: GamePlayViewProps) {
  const { t } = useTranslation();
  const state = room.state as LivebuzzerView | null;
  const armedAtRef = useLivebuzzerArmedAt(state?.phase ?? "IDLE");

  if (!state) return null;

  const isPlayer = !room.isSpectator && !!state.players[room.userId];
  const isLockedOut = state.lockedOutPlayerIds.includes(room.userId);
  const expiresAt = state.timerExpiresAt
    ? state.timerExpiresAt - room.serverTimeOffset
    : 0;

  const onBuzz = () => {
    const armedAt = armedAtRef.current;
    const reactionMs = armedAt ? Date.now() - armedAt : 0;
    room.send({ type: "BUZZ", playerId: room.userId, reactionMs });
  };

  const lockedPlayerName = state.lockedPlayerId
    ? state.players[state.lockedPlayerId]?.name
    : null;
  const isYouLocked = state.lockedPlayerId === room.userId;

  return (
    <motion.div
      key="livebuzzer-player"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center gap-6 py-6"
    >
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center gap-6 p-8 text-center">
          {state.phase === "IDLE" && (
            <>
              <div className="flex size-14 items-center justify-center bg-muted text-muted-foreground">
                <Radio className="size-6" />
              </div>
              <p className="text-sm text-muted-foreground">
                {t("game:playing.idleListen")}
              </p>
            </>
          )}

          {state.phase === "ARMED" && (
            <>
              {expiresAt > 0 && (
                <div className="w-full">
                  <Timer expiresAt={expiresAt} duration={state.config.buzzWindowMs} />
                </div>
              )}
              {isPlayer ? (
                <button
                  type="button"
                  onClick={onBuzz}
                  disabled={isLockedOut}
                  className={cn(
                    "flex size-40 flex-col items-center justify-center gap-2 rounded-full border-4 font-heading text-2xl font-bold uppercase tracking-widest transition-transform active:scale-95",
                    isLockedOut
                      ? "cursor-not-allowed border-border bg-muted text-muted-foreground opacity-60"
                      : "border-brand bg-brand text-brand-foreground shadow-lg animate-pulse"
                  )}
                >
                  <Zap className="size-10" />
                  {isLockedOut
                    ? t("games:livebuzzer.player.lockedOut")
                    : t("games:livebuzzer.player.buzz")}
                </button>
              ) : (
                <Badge tone="brand">{t("games:livebuzzer.player.buzzerOpen")}</Badge>
              )}
            </>
          )}

          {state.phase === "COLLECTING" && (
            <>
              <div className="flex size-14 animate-pulse items-center justify-center bg-brand/10 text-brand">
                <Zap className="size-6" />
              </div>
              <p className="text-sm text-muted-foreground">
                {t("games:livebuzzer.player.lockingIn")}
              </p>
            </>
          )}

          {state.phase === "LOCKED" && (
            <>
              <div
                className={cn(
                  "flex size-14 items-center justify-center",
                  isYouLocked ? "bg-brand text-brand-foreground" : "bg-muted text-muted-foreground"
                )}
              >
                <Lock className="size-6" />
              </div>
              <div>
                <p
                  className={cn(
                    "text-xl font-bold",
                    isYouLocked && "text-brand"
                  )}
                >
                  {state.lockedReactionMs !== null
                    ? t("games:livebuzzer.player.lockedReaction", {
                        name: lockedPlayerName ?? t("games:livebuzzer.player.someone"),
                        ms: state.lockedReactionMs,
                      })
                    : lockedPlayerName ?? t("games:livebuzzer.player.someone")}
                </p>
                {isYouLocked && (
                  <p className="mt-2 text-sm font-semibold text-brand">
                    {t("games:livebuzzer.player.yourTurn")}
                  </p>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
