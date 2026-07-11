import { Ionicons } from "@expo/vector-icons";
import { gameConfig } from "@zeyn/api/game-types";
import * as Haptics from "expo-haptics";
import { Button, Card, Chip, Input, TextField } from "heroui-native";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import Animated from "react-native-reanimated";
import { withUniwind } from "uniwind";

import { Heading, Text } from "@/components/ui";
import { Timer } from "@/features/game/components/Timer";
import type { GamePlayViewProps } from "@/features/games/types";
import { cn } from "@/lib/utils";
import { fadeIn, fadeUp } from "@/lib/motion";

import type { BuzzerView } from "./types";

const StyledIonicons = withUniwind(Ionicons);

export function BuzzerPlaying({ room }: GamePlayViewProps) {
  const { t } = useTranslation("game");
  const [answerInput, setAnswerInput] = useState("");
  const state = room.state as BuzzerView | null;

  if (!state) return null;

  const activeQuestionState = state.activeQuestionState
    ? {
        ...state.activeQuestionState,
        timerExpiresAt: state.activeQuestionState.timerExpiresAt - room.serverTimeOffset,
      }
    : null;

  if (!state.currentQuestion) {
    return (
      <View className="items-center justify-center p-8">
        <Text className="text-muted-foreground">{t("playing.loadingQuestion")}</Text>
      </View>
    );
  }

  const currentQuestion = state.currentQuestion;
  const attemptsLeft = Math.max(
    0,
    gameConfig.maxWrongAttempts - (activeQuestionState?.wrongAttempts ?? 0)
  );
  const hasAttempted =
    activeQuestionState?.playersWhoAttempted.includes(room.playerId) ?? false;
  const isMyTurn = activeQuestionState?.buzzedPlayerId === room.playerId;

  const onBuzz = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    room.send({ type: "BUZZ", playerId: room.playerId });
  };

  const onSubmitAnswer = () => {
    const answer = answerInput.trim();
    if (!answer) return;
    room.send({ type: "SUBMIT_ANSWER", playerId: room.playerId, answer });
    setAnswerInput("");
  };

  return (
    <Animated.View entering={fadeIn()} className="gap-5">
      <MatchProgress state={state} />

      <Card>
        <Card.Body className="items-center gap-4">
          {state.phase === "ACTIVE" && (
            <Animated.View entering={fadeUp()} className="w-full items-center gap-4">
              <View className="flex-row flex-wrap items-center justify-center gap-2">
                <Chip size="sm" variant="soft">
                  <Chip.Label>
                    {t("playing.questionWorth", { points: currentQuestion.points })}
                  </Chip.Label>
                </Chip>
                {activeQuestionState && (
                  <Chip size="sm" variant="soft" color={attemptsLeft <= 1 ? "warning" : "default"}>
                    <Chip.Label>{t("playing.attemptsLeft", { count: attemptsLeft })}</Chip.Label>
                  </Chip>
                )}
              </View>

              <Heading className="text-center text-xl">{currentQuestion.text}</Heading>

              {activeQuestionState && (
                <Timer
                  expiresAt={activeQuestionState.timerExpiresAt}
                  duration={gameConfig.questionTimeMs}
                />
              )}

              {!room.isSpectator && (
                <Button
                  size="lg"
                  className="size-32 rounded-full bg-brand"
                  onPress={onBuzz}
                  isDisabled={room.isSpectator || hasAttempted || !activeQuestionState}
                >
                  <View className="items-center gap-1">
                    <StyledIonicons name="flash" size={32} className="text-brand-foreground" />
                    <Button.Label className="text-xl">{t("playing.buzz")}</Button.Label>
                  </View>
                </Button>
              )}

              {hasAttempted && !isMyTurn && (
                <Text className="text-destructive text-sm">{t("playing.buzzedOut")}</Text>
              )}
            </Animated.View>
          )}

          {state.phase === "ANSWERING" && (
            <Animated.View entering={fadeUp()} className="w-full gap-4">
              <View className="items-center">
                <Chip size="sm" variant="soft" color="warning">
                  <Chip.Label>{t("playing.awaitingAnswer")}</Chip.Label>
                </Chip>
              </View>

              {!room.isSpectator && isMyTurn ? (
                <View className="gap-3">
                  <TextField>
                    <Input
                      value={answerInput}
                      onChangeText={setAnswerInput}
                      placeholder={t("playing.answerPlaceholder")}
                      autoFocus
                      onSubmitEditing={onSubmitAnswer}
                    />
                  </TextField>
                  <View className="flex-row items-center justify-between gap-3">
                    {activeQuestionState && (
                      <Timer
                        expiresAt={activeQuestionState.timerExpiresAt}
                        duration={gameConfig.answerTimeMs}
                      />
                    )}
                    <Button onPress={onSubmitAnswer}>
                      <Button.Label>{t("playing.submit")}</Button.Label>
                    </Button>
                  </View>
                </View>
              ) : (
                <View className="items-center gap-3">
                  <StyledIonicons
                    name="time-outline"
                    size={28}
                    className="text-muted-foreground"
                  />
                  <View className="items-center">
                    <Text weight="semibold" className="text-lg">
                      {activeQuestionState?.buzzedPlayerId
                        ? state.players[activeQuestionState.buzzedPlayerId]?.name
                        : null}
                    </Text>
                    <Text className="text-muted-foreground text-xs uppercase tracking-widest">
                      {t("playing.isThinking")}
                    </Text>
                  </View>
                  {activeQuestionState && (
                    <Timer
                      expiresAt={activeQuestionState.timerExpiresAt}
                      duration={gameConfig.answerTimeMs}
                    />
                  )}
                </View>
              )}
            </Animated.View>
          )}

          {state.phase === "REVEALED" && (
            <Animated.View entering={fadeUp()} className="w-full items-center gap-3">
              <Text className="text-muted-foreground text-xs uppercase tracking-widest">
                {t("playing.correctAnswer")}
              </Text>
              <Heading className="text-center text-3xl text-success">
                {currentQuestion.answer}
              </Heading>
              <Text className="text-muted-foreground text-xs">
                {t("playing.nextQuestionShortly")}
              </Text>
            </Animated.View>
          )}
        </Card.Body>
      </Card>
    </Animated.View>
  );
}

function MatchProgress({ state }: { state: BuzzerView }) {
  const { t } = useTranslation("game");
  const subjects = Array.from({ length: state.subjectCount }, (_, i) => i);

  return (
    <View className="items-center gap-3">
      <Heading className="text-lg text-brand">{state.currentSubjectName}</Heading>

      <View className="w-full flex-row items-center gap-1.5">
        {subjects.map(subject => (
          <View
            key={subject}
            className={cn(
              "h-2 flex-1 rounded-full",
              subject < state.currentSubjectIndex
                ? "bg-brand/70"
                : subject === state.currentSubjectIndex
                  ? "bg-brand"
                  : "bg-muted-surface"
            )}
          />
        ))}
      </View>

      <Text className="text-muted-foreground text-xs uppercase tracking-widest">
        {t("playing.subjectProgress", {
          current: state.currentSubjectIndex + 1,
          total: state.subjectCount,
        })}
        {"   ·   "}
        {t("playing.questionProgress", {
          current: state.currentQuestionIndex + 1,
          total: gameConfig.questionsPerSubject,
        })}
      </Text>
    </View>
  );
}
