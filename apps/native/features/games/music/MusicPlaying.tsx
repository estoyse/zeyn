import { Ionicons } from "@expo/vector-icons";
import { musicGameConfig } from "@zeyn/api/games";
import { useAudioPlayer } from "expo-audio";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, View } from "react-native";
import Animated, { FadeIn, LinearTransition } from "react-native-reanimated";
import { withUniwind } from "uniwind";

import { Card, Chip } from "heroui-native";
import { Heading, Text } from "@/components/ui";
import { Timer } from "@/features/game/components/Timer";
import type { GamePlayViewProps } from "@/features/games/types";
import { cn } from "@/lib/utils";
import type { MusicView } from "./types";
import { useMusicEvents } from "./useMusicEvents";

const StyledIonicons = withUniwind(Ionicons);

export function MusicPlaying({ room }: GamePlayViewProps) {
  const { t } = useTranslation("games");
  const state = room.state as MusicView | null;
  const [picked, setPicked] = useState<number | null>(null);
  const player = useAudioPlayer(null);
  const lastPlayedUrlRef = useRef<string | null>(null);

  useMusicEvents(room);

  const questionIndex = state?.currentQuestionIndex;
  const previewUrl = state?.question?.previewUrl;
  const phase = state?.phase;

  useEffect(() => {
    setPicked(null);
  }, [questionIndex]);

  useEffect(() => {
    if (phase !== "QUESTION" || !previewUrl) return;
    if (lastPlayedUrlRef.current === previewUrl) return;
    lastPlayedUrlRef.current = previewUrl;
    player.replace(previewUrl);
    player.play();
  }, [questionIndex, previewUrl, phase, player]);

  useEffect(() => {
    if (phase === "REVEAL") {
      player.pause();
    }
  }, [phase, player]);

  if (!state?.question) {
    return (
      <View className="flex-1 items-center justify-center p-8">
        <Text className="text-muted-foreground">{t("music.playing.loading")}</Text>
      </View>
    );
  }

  const isReveal = state.phase === "REVEAL";
  const alreadyAnswered = state.answeredPlayerIds.includes(room.playerId);
  const options = state.question.options;
  const duration = isReveal ? musicGameConfig.revealTimeMs : musicGameConfig.questionTimeMs;
  const expiresAt = state.timerExpiresAt - room.serverTimeOffset;

  const onAnswer = (index: number) => {
    if (isReveal || alreadyAnswered || room.isSpectator) return;
    setPicked(index);
    room.send({ type: "ANSWER", playerId: room.playerId, optionIndex: index });
  };

  const roundResults = isReveal
    ? Object.values(state.players)
        .slice()
        .sort((a, b) => {
          const aPoints = state.reveal?.answers[a.id]?.pointsAwarded ?? 0;
          const bPoints = state.reveal?.answers[b.id]?.pointsAwarded ?? 0;
          if (bPoints !== aPoints) return bPoints - aPoints;
          return a.name.localeCompare(b.name);
        })
    : [];

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
      <Animated.View entering={FadeIn} className="gap-6">
        <View className="items-center gap-3">
        <Chip variant="soft">
          <Chip.Label>
            {t("music.playing.questionLabel")} {state.currentQuestionIndex + 1} /{" "}
            {state.totalQuestions}
          </Chip.Label>
        </Chip>
        {!isReveal && (
          <Text className="text-muted-foreground text-xs">
            {t("music.playing.answeredCount", {
              answered: state.answeredPlayerIds.length,
              total: Object.keys(state.players).length,
            })}
          </Text>
        )}
        <Timer
          expiresAt={expiresAt}
          duration={duration}
          underClock={!isReveal && !alreadyAnswered && !room.isSpectator}
        />
      </View>

      <Card>
        <Card.Body className="gap-4">
          <View className="gap-3">
            {options.map((label, index) => {
              const correct = isReveal && index === state.reveal?.correctIndex;
              const wrongPick = isReveal && picked === index && !correct;
              const isYourAnswer = isReveal && picked === index;
              const isDisabled = isReveal || alreadyAnswered || room.isSpectator;

              return (
                <Pressable
                  key={index}
                  onPress={() => onAnswer(index)}
                  disabled={isDisabled}
                  className={cn(
                    "flex-row items-center justify-between gap-2 border p-4",
                    correct
                      ? "border-success bg-success/10"
                      : wrongPick
                        ? "border-destructive bg-destructive/10"
                        : picked === index
                          ? "border-brand bg-brand/10"
                          : "border-border bg-muted-surface",
                    isDisabled && !isReveal && "opacity-50"
                  )}
                >
                  <Text
                    weight="medium"
                    className={cn(
                      "flex-1 text-sm",
                      correct && "text-success",
                      wrongPick && "text-destructive"
                    )}
                  >
                    {label}
                    {isYourAnswer ? ` (${t("music.playing.yourAnswer")})` : ""}
                  </Text>
                  {correct && (
                    <StyledIonicons name="checkmark-circle" size={20} className="text-success" />
                  )}
                  {wrongPick && (
                    <StyledIonicons name="close-circle" size={20} className="text-destructive" />
                  )}
                </Pressable>
              );
            })}
          </View>

          {isReveal && state.reveal && (
            <View className="items-center gap-1">
              <Text className="text-muted-foreground text-xs uppercase tracking-widest">
                {t("music.playing.correctAnswer")}
              </Text>
              <Heading className="text-success text-xl">{state.reveal.correctTitle}</Heading>
              <Text className="text-muted-foreground text-sm">{state.reveal.artistName}</Text>
            </View>
          )}

          {isReveal && state.reveal && (
            <View className="gap-2">
              <Text className="text-muted-foreground text-xs uppercase tracking-widest">
                {t("music.playing.results")}
              </Text>
              <View className="border border-border">
                {roundResults.map(p => {
                  const answer = state.reveal?.answers[p.id];
                  return (
                    <Animated.View
                      layout={LinearTransition}
                      key={p.id}
                      className={cn(
                        "flex-row items-center justify-between gap-2 border-b border-border p-3 last:border-b-0",
                        p.id === room.playerId && "bg-brand/5"
                      )}
                    >
                      <Text weight="medium" className="text-sm">
                        {p.name}
                      </Text>
                      <View className="flex-row items-center gap-3">
                        {!answer && (
                          <Text className="text-muted-foreground text-xs">
                            {t("music.playing.noAnswer")}
                          </Text>
                        )}
                        {answer?.correct && (
                          <View className="flex-row items-center gap-1">
                            <StyledIonicons
                              name="checkmark"
                              size={14}
                              className="text-success"
                            />
                            <Text className="text-success text-xs">
                              {t("music.playing.correct")}
                            </Text>
                          </View>
                        )}
                        {answer && !answer.correct && (
                          <View className="flex-row items-center gap-1">
                            <StyledIonicons name="close" size={14} className="text-destructive" />
                            <Text className="text-destructive text-xs">
                              {t("music.playing.wrong")}
                            </Text>
                          </View>
                        )}
                        {answer && answer.pointsAwarded > 0 && (
                          <Text weight="bold" className="text-sm">
                            +{answer.pointsAwarded}
                          </Text>
                        )}
                      </View>
                    </Animated.View>
                  );
                })}
              </View>
            </View>
          )}

          {!isReveal && alreadyAnswered && (
            <Text className="text-muted-foreground text-center text-sm">
              {t("music.playing.answerLocked")}
            </Text>
          )}
        </Card.Body>
        </Card>
      </Animated.View>
    </ScrollView>
  );
}
