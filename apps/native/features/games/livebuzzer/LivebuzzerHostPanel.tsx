import Ionicons from "@expo/vector-icons/Ionicons";
import { Card, Chip, Spinner } from "heroui-native";
import { useTranslation } from "react-i18next";
import { Alert, ScrollView, View } from "react-native";
import { withUniwind } from "uniwind";

import { Button, Heading, Text } from "@/components/ui";
import { Timer } from "@/features/game/components/Timer";
import type { GamePlayViewProps } from "@/features/games/types";

import type { LivebuzzerView } from "./types";

const StyledIonicons = withUniwind(Ionicons);

function rankPlayers(state: LivebuzzerView) {
  return Object.values(state.players).sort(
    (a, b) => b.score - a.score || a.name.localeCompare(b.name)
  );
}

export function LivebuzzerHostPanel({ room }: GamePlayViewProps) {
  const { t } = useTranslation("games");
  const state = room.state as LivebuzzerView;

  const onArm = () => room.send({ type: "ARM", playerId: room.playerId });
  const onSkipRound = () =>
    room.send({ type: "SKIP_ROUND", playerId: room.playerId });
  const onJudge = (correct: boolean) =>
    room.send({ type: "JUDGE", playerId: room.playerId, correct });
  const onAdjustScore = (targetId: string, delta: number) =>
    room.send({
      type: "ADJUST_SCORE",
      playerId: room.playerId,
      targetId,
      delta,
    });
  const onEndGame = () => {
    Alert.alert(
      t("livebuzzer.host.endGameConfirm.title"),
      t("livebuzzer.host.endGameConfirm.description"),
      [
        { text: t("livebuzzer.host.endGameConfirm.cancel"), style: "cancel" },
        {
          text: t("livebuzzer.host.endGameConfirm.confirm"),
          style: "destructive",
          onPress: () => room.send({ type: "END_GAME", playerId: room.playerId }),
        },
      ]
    );
  };

  const wrongAttemptsWarning =
    state.wrongAttempts >= state.config.maxWrongPerRound - 1;
  const lockedPlayerName =
    state.players[state.lockedPlayerId ?? ""]?.name ?? "";
  const players = rankPlayers(state);

  return (
    <ScrollView
      className="flex-1"
      contentContainerStyle={{ padding: 16, gap: 16 }}
    >
      <View className="flex-row flex-wrap items-center gap-2">
        <Chip size="sm" variant="soft">
          <Chip.Label>
            {t("livebuzzer.host.round", { round: state.round })}
          </Chip.Label>
        </Chip>
        {state.phase !== "IDLE" && (
          <Chip
            size="sm"
            variant="soft"
            color={wrongAttemptsWarning ? "warning" : "default"}
          >
            <Chip.Label>
              {t("livebuzzer.host.wrongAttempts", {
                count: state.wrongAttempts,
                max: state.config.maxWrongPerRound,
              })}
            </Chip.Label>
          </Chip>
        )}
      </View>

      <Card>
        <Card.Body className="items-center gap-4">
          {state.phase === "IDLE" && (
            <View className="w-full items-center gap-4">
              <Text className="text-center text-muted-foreground">
                {t("livebuzzer.host.idleHint")}
              </Text>
              <Button size="lg" onPress={onArm} className="w-full">
                <Button.Label>{t("livebuzzer.host.openBuzzer")}</Button.Label>
              </Button>
            </View>
          )}

          {state.phase === "ARMED" && (
            <View className="w-full items-center gap-4">
              <Text className="text-center text-muted-foreground">
                {t("livebuzzer.host.armedHint")}
              </Text>
              {state.config.buzzWindowMs > 0 && (
                <Timer
                  expiresAt={state.timerExpiresAt - room.serverTimeOffset}
                  duration={state.config.buzzWindowMs}
                  underClock
                />
              )}
              <Button variant="outline" onPress={onSkipRound} className="w-full">
                <Button.Label>{t("livebuzzer.host.cancelRound")}</Button.Label>
              </Button>
            </View>
          )}

          {state.phase === "COLLECTING" && (
            <View className="items-center gap-3 py-4">
              <Spinner />
              <Text className="text-muted-foreground">
                {t("livebuzzer.host.lockingIn")}
              </Text>
            </View>
          )}

          {state.phase === "LOCKED" && (
            <View className="w-full items-center gap-4">
              <Heading className="text-center text-title-3">
                {t("livebuzzer.host.lockedReaction", {
                  name: lockedPlayerName,
                  ms: state.lockedReactionMs ?? 0,
                })}
              </Heading>
              {state.config.answerTimeMs > 0 && (
                <Timer
                  expiresAt={state.timerExpiresAt - room.serverTimeOffset}
                  duration={state.config.answerTimeMs}
                  underClock
                />
              )}
              <View className="w-full flex-row gap-3">
                <Button
                  size="lg"
                  className="flex-1 bg-success"
                  onPress={() => onJudge(true)}
                >
                  <Button.Label>{t("livebuzzer.host.correct")}</Button.Label>
                </Button>
                <Button
                  size="lg"
                  variant="danger"
                  className="flex-1"
                  onPress={() => onJudge(false)}
                >
                  <Button.Label>{t("livebuzzer.host.wrong")}</Button.Label>
                </Button>
              </View>
              <Button variant="ghost" size="sm" onPress={onSkipRound}>
                <Button.Label>{t("livebuzzer.host.skipRound")}</Button.Label>
              </Button>
            </View>
          )}
        </Card.Body>
      </Card>

      <Card>
        <Card.Body className="gap-3">
          <Card.Title>{t("livebuzzer.host.scoreboardTitle")}</Card.Title>
          <View className="gap-2">
            {players.map(player => (
              <View
                key={player.id}
                className="flex-row items-center gap-3 border-b border-border py-2"
              >
                <View className="min-w-0 flex-1">
                  <Text weight="medium" numberOfLines={1}>
                    {player.name}
                  </Text>
                </View>
                <Text weight="semibold" className="w-10 text-right">
                  {player.score}
                </Text>
                <View className="flex-row items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    isIconOnly
                    onPress={() =>
                      onAdjustScore(player.id, -state.config.pointsPerCorrect)
                    }
                    accessibilityLabel={t("livebuzzer.host.decreaseScore", {
                      amount: state.config.pointsPerCorrect,
                    })}
                  >
                    <StyledIonicons
                      name="play-back"
                      size={14}
                      className="text-foreground"
                    />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    isIconOnly
                    onPress={() => onAdjustScore(player.id, -1)}
                    accessibilityLabel={t("livebuzzer.host.decreaseScore", {
                      amount: 1,
                    })}
                  >
                    <StyledIonicons
                      name="remove"
                      size={16}
                      className="text-foreground"
                    />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    isIconOnly
                    onPress={() => onAdjustScore(player.id, 1)}
                    accessibilityLabel={t("livebuzzer.host.increaseScore", {
                      amount: 1,
                    })}
                  >
                    <StyledIonicons
                      name="add"
                      size={16}
                      className="text-foreground"
                    />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    isIconOnly
                    onPress={() =>
                      onAdjustScore(player.id, state.config.pointsPerCorrect)
                    }
                    accessibilityLabel={t("livebuzzer.host.increaseScore", {
                      amount: state.config.pointsPerCorrect,
                    })}
                  >
                    <StyledIonicons
                      name="play-forward"
                      size={14}
                      className="text-foreground"
                    />
                  </Button>
                </View>
              </View>
            ))}
          </View>
        </Card.Body>
      </Card>

      <Button variant="danger" onPress={onEndGame}>
        <Button.Label>{t("livebuzzer.host.endGame")}</Button.Label>
      </Button>
    </ScrollView>
  );
}
