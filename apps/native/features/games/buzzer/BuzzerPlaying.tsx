import Ionicons from "@expo/vector-icons/Ionicons";
import { gameConfig } from "@zeyn/api/game-types";
import { Card, Chip, Input, TextField } from "heroui-native";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, View } from "react-native";
import Animated from "react-native-reanimated";
import { withUniwind } from "uniwind";

import { Button, Heading, Text } from "@/components/ui";
import { Countdown } from "@/features/game/components/Countdown";
import { Timer } from "@/features/game/components/Timer";
import { useCountdown } from "@/features/game/hooks/useCountdown";
import type { GamePlayViewProps } from "@/features/games/types";
import { fadeIn, fadeUp } from "@/lib/motion";
import { cn } from "@/lib/utils";

import { RingBuzzer, type BuzzState } from "./RingBuzzer";
import type { BuzzerView } from "./types";
import { useBuzzerEvents } from "./useBuzzerEvents";

const StyledIonicons = withUniwind(Ionicons);

export function BuzzerPlaying({ room }: GamePlayViewProps) {
  const { t } = useTranslation("game");
  const [answerInput, setAnswerInput] = useState("");
  const sentForQuestion = useRef<string | null>(null);

  useBuzzerEvents(room);

  const state = room.state as BuzzerView | null;
  const activeQuestionState = state?.activeQuestionState;
  const expiresAt = activeQuestionState
    ? activeQuestionState.timerExpiresAt - room.serverTimeOffset
    : 0;
  const isActivePhase = state?.phase === "ACTIVE" && !!activeQuestionState;

  const { progress, urgency } = useCountdown(
    expiresAt,
    gameConfig.questionTimeMs,
    isActivePhase
  );

  if (!state) return null;

  if (state.phase === "COUNTDOWN") {
    return (
      <Countdown
        expiresAt={
          state.activeQuestionState
            ? state.activeQuestionState.timerExpiresAt - room.serverTimeOffset
            : 0
        }
        duration={gameConfig.countdownTimeMs}
      />
    );
  }

  if (!state.currentQuestion) {
    return (
      <View className="flex-1 items-center justify-center p-8">
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

  const buzzState: BuzzState = room.isSpectator
    ? "spectator"
    : isMyTurn
      ? "won"
      : hasAttempted
        ? "out"
        : "armed";

  const questionKey = `${state.currentSubjectIndex}:${state.currentQuestionIndex}:${activeQuestionState?.wrongAttempts ?? 0}`;

  const onBuzz = () => {
    if (sentForQuestion.current === questionKey) return;
    sentForQuestion.current = questionKey;
    room.send({ type: "BUZZ", playerId: room.playerId });
  };

  const onSubmitAnswer = () => {
    const answer = answerInput.trim();
    if (!answer) return;
    room.send({ type: "SUBMIT_ANSWER", playerId: room.playerId, answer });
    setAnswerInput("");
  };

  const answerExpiresAt = activeQuestionState
    ? activeQuestionState.timerExpiresAt - room.serverTimeOffset
    : 0;

  return (
    <View className="flex-1">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: "center",
          padding: 16,
          gap: 20,
        }}
      >
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
                      <Chip
                        size="sm"
                        variant="soft"
                        color={attemptsLeft <= 1 ? "warning" : "default"}
                      >
                        <Chip.Label>
                          {t("playing.attemptsLeft", { count: attemptsLeft })}
                        </Chip.Label>
                      </Chip>
                    )}
                  </View>

                  <Heading className="text-center text-title-2">
                    {currentQuestion.text}
                  </Heading>

                  {hasAttempted && !isMyTurn && (
                    <Text className="text-footnote text-destructive">
                      {t("playing.buzzedOut")}
                    </Text>
                  )}
                </Animated.View>
              )}

              {state.phase === "ANSWERING" && (
                <Animated.View entering={fadeUp()} className="w-full items-center gap-3">
                  <Chip size="sm" variant="soft" color="warning">
                    <Chip.Label>{t("playing.awaitingAnswer")}</Chip.Label>
                  </Chip>

                  <Heading className="text-center text-title-3">
                    {currentQuestion.text}
                  </Heading>

                  {!isMyTurn && (
                    <View className="items-center gap-2">
                      <StyledIonicons
                        name="time-outline"
                        size={26}
                        className="text-muted-foreground"
                      />
                      <Text weight="semibold" className="text-body">
                        {activeQuestionState?.buzzedPlayerId
                          ? state.players[activeQuestionState.buzzedPlayerId]?.name
                          : null}
                      </Text>
                      <Text className="text-caption uppercase text-muted-foreground">
                        {t("playing.isThinking")}
                      </Text>
                    </View>
                  )}
                </Animated.View>
              )}

              {state.phase === "REVEALED" && (
                <Animated.View entering={fadeUp()} className="w-full items-center gap-3">
                  <Text className="text-caption uppercase text-muted-foreground">
                    {t("playing.correctAnswer")}
                  </Text>
                  <Heading className="text-center text-display text-success">
                    {currentQuestion.answer}
                  </Heading>
                  <Text className="text-footnote text-muted-foreground">
                    {t("playing.nextQuestionShortly")}
                  </Text>
                </Animated.View>
              )}
            </Card.Body>
          </Card>
        </Animated.View>
      </ScrollView>

      <View className="items-center px-4 pb-2 pt-3">
        {state.phase === "ACTIVE" && activeQuestionState && (
          <RingBuzzer
            progress={progress}
            urgency={urgency}
            state={buzzState}
            onBuzz={onBuzz}
          />
        )}

        {state.phase === "ANSWERING" && activeQuestionState && (
          <View className="w-full gap-3">
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
                <View className="flex-row items-center gap-3">
                  <View className="flex-1">
                    <Timer
                      expiresAt={answerExpiresAt}
                      duration={gameConfig.answerTimeMs}
                      underClock
                    />
                  </View>
                  <Button onPress={onSubmitAnswer}>
                    <Button.Label>{t("playing.submit")}</Button.Label>
                  </Button>
                </View>
              </View>
            ) : (
              <Timer
                expiresAt={answerExpiresAt}
                duration={gameConfig.answerTimeMs}
              />
            )}
          </View>
        )}
      </View>
    </View>
  );
}

function MatchProgress({ state }: { state: BuzzerView }) {
  const { t } = useTranslation("game");
  const subjects = Array.from({ length: state.subjectCount }, (_, i) => i);

  return (
    <View className="items-center gap-3">
      <Heading className="text-title-3 text-brand">{state.currentSubjectName}</Heading>

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

      <Text className="text-caption uppercase text-muted-foreground">
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
