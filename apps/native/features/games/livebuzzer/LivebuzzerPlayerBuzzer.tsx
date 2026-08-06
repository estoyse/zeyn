import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { useSharedValue } from "react-native-reanimated";

import { Text } from "@/components/ui";
import { useCountdown } from "@/features/game/hooks/useCountdown";
import { RingBuzzer, type BuzzState } from "@/features/games/buzzer/RingBuzzer";
import type { GamePlayViewProps } from "@/features/games/types";

import type { LivebuzzerView } from "./types";
import { useLivebuzzerEvents } from "./useLivebuzzerEvents";

export function LivebuzzerPlayerBuzzer({ room }: GamePlayViewProps) {
  const { t } = useTranslation("games");

  useLivebuzzerEvents(room);

  const state = room.state as LivebuzzerView | null;
  const phase = state?.phase;

  const prevPhaseRef = useRef<LivebuzzerView["phase"] | undefined>(undefined);
  const armReceiptRef = useRef(0);
  const armWindowIdRef = useRef(0);
  const sentForArmWindowRef = useRef<number | null>(null);

  useEffect(() => {
    if (prevPhaseRef.current !== "ARMED" && phase === "ARMED") {
      armReceiptRef.current = Date.now();
      armWindowIdRef.current += 1;
    }
    prevPhaseRef.current = phase;
  }, [phase]);

  const duration =
    state?.phase === "ARMED"
      ? state.config.buzzWindowMs
      : state?.phase === "LOCKED"
        ? state.config.answerTimeMs
        : 0;
  const hasClock =
    duration > 0 && (state?.phase === "ARMED" || state?.phase === "LOCKED");
  const countdown = useCountdown(
    (state?.timerExpiresAt ?? 0) - room.serverTimeOffset,
    duration,
    hasClock
  );
  const staticProgress = useSharedValue(1);
  const staticUrgency = useSharedValue(0);
  const progress = hasClock ? countdown.progress : staticProgress;
  const urgency = hasClock ? countdown.urgency : staticUrgency;

  if (!state) return null;

  const buzzState: BuzzState = room.isSpectator
    ? "spectator"
    : state.phase === "IDLE"
      ? "idle"
      : state.phase === "ARMED"
        ? state.lockedOutPlayerIds.includes(room.playerId)
          ? "out"
          : "armed"
        : state.phase === "COLLECTING"
          ? "out"
          : state.lockedPlayerId === room.playerId
            ? "won"
            : "out";

  const onBuzz = () => {
    if (sentForArmWindowRef.current === armWindowIdRef.current) return;
    sentForArmWindowRef.current = armWindowIdRef.current;
    const reactionMs = Date.now() - armReceiptRef.current;
    room.send({ type: "BUZZ", playerId: room.playerId, reactionMs });
  };

  const isLockingIn =
    state.phase === "COLLECTING" && state.buzzedPlayerIds.includes(room.playerId);
  const lockedWinnerName = state.lockedPlayerId
    ? (state.players[state.lockedPlayerId]?.name ?? "")
    : "";

  return (
    <View className="flex-1 items-center justify-center gap-4 p-6">
      <RingBuzzer
        progress={progress}
        urgency={urgency}
        state={buzzState}
        onBuzz={onBuzz}
      />

      {isLockingIn && (
        <Text className="text-footnote text-muted-foreground">
          {t("livebuzzer.player.lockingIn")}
        </Text>
      )}

      {state.phase === "LOCKED" && state.lockedPlayerId && (
        <Text className="text-footnote text-muted-foreground">
          {t("livebuzzer.player.lockedReaction", {
            name: lockedWinnerName,
            ms: state.lockedReactionMs ?? 0,
          })}
        </Text>
      )}
    </View>
  );
}
