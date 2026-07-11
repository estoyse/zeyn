import { Ionicons } from "@expo/vector-icons";
import { Card } from "heroui-native";
import { useTranslation } from "react-i18next";
import { ScrollView, View } from "react-native";
import Animated, { LinearTransition } from "react-native-reanimated";
import { withUniwind } from "uniwind";

import { Button, Heading, Text } from "@/components/ui";
import { buildScoreboard } from "@/features/game/lib/scoreboard";
import type { GameResultsViewProps } from "@/features/games/types";
import { fadeIn, fadeUp, stagger } from "@/lib/motion";
import { cn } from "@/lib/utils";

const StyledIonicons = withUniwind(Ionicons);

const RANK_WIDTH = "w-10";
const PARTICIPANT_WIDTH = "w-32";
const QUESTION_WIDTH = "w-9";
const TOTAL_WIDTH = "w-16";

export function BuzzerResults({ results, onBack }: GameResultsViewProps) {
  const { t } = useTranslation("game");
  const { subjects, questionsPerSubject, rows } = buildScoreboard({
    subjects: results.subjects,
    playerResults: results.playerResults,
    questionResults: results.questionResults,
  });
  const questionSlots = Array.from({ length: questionsPerSubject }, (_, i) => i);
  const ranked = [...results.playerResults].sort((a, b) => b.score - a.score);
  const topScore = ranked[0]?.score ?? 0;

  return (
    <Animated.View entering={fadeIn()} className="gap-6">
      <View className="items-center gap-3">
        <View className="rounded-full bg-brand/10 p-4">
          <StyledIonicons name="trophy" size={32} className="text-brand" />
        </View>
        <Heading className="text-center text-3xl">{t("archive.title")}</Heading>
        <Text className="text-muted-foreground text-xs uppercase tracking-widest">
          {t("archive.subtitle")}
        </Text>
      </View>

      <Card>
        <Card.Body className="gap-3">
          <Card.Title>{t("scoreboard.title")}</Card.Title>
          {ranked.map((p, i) => {
            const isTop = topScore > 0 && p.score === topScore;
            return (
              <Animated.View
                key={p.userId}
                entering={fadeUp(stagger(i))}
                layout={LinearTransition}
                className={cn(
                  "flex-row items-center justify-between border border-border bg-muted-surface p-3",
                  isTop && "border-brand bg-brand/10"
                )}
              >
                <View className="flex-row items-center gap-3">
                  <Text weight="bold" className="text-muted-foreground w-6 text-center">
                    {i + 1}
                  </Text>
                  <Text weight="medium">{p.playerName}</Text>
                </View>
                <Text weight="bold" className={cn(isTop && "text-brand")}>
                  {p.score}
                </Text>
              </Animated.View>
            );
          })}
        </Card.Body>
      </Card>

      <Card>
        <Card.Body className="gap-4">
          <View className="flex-row items-center gap-2">
            <StyledIonicons name="grid-outline" size={18} className="text-foreground" />
            <Card.Title>{t("archive.detailedResults")}</Card.Title>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View>
              <View className="flex-row items-end border-b border-border pb-2">
                <View className={cn(RANK_WIDTH, "items-center")}>
                  <Text className="text-muted-foreground text-xs uppercase">
                    {t("archive.rank")}
                  </Text>
                </View>
                <View className={cn(PARTICIPANT_WIDTH, "items-start")}>
                  <Text className="text-muted-foreground text-xs uppercase">
                    {t("archive.participant")}
                  </Text>
                </View>
                {subjects.map((name, si) => (
                  <View
                    key={si}
                    className="items-center gap-1 border-l border-border pb-1 pl-2"
                    style={{ width: questionSlots.length * 36 }}
                  >
                    <Text
                      className="text-muted-foreground text-[10px] uppercase"
                      numberOfLines={1}
                    >
                      {name || t("archive.subjectFallback", { index: si + 1 })}
                    </Text>
                    <View className="flex-row">
                      {questionSlots.map(qi => (
                        <View key={qi} className={cn(QUESTION_WIDTH, "items-center")}>
                          <Text className="text-muted-foreground text-[10px]">{qi + 1}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                ))}
                <View className={cn(TOTAL_WIDTH, "items-center")}>
                  <Text className="text-muted-foreground text-xs uppercase">
                    {t("archive.total")}
                  </Text>
                </View>
              </View>

              {rows.map((row, rowIdx) => (
                <View
                  key={row.userId}
                  className="flex-row items-center border-b border-border py-2"
                >
                  <View className={cn(RANK_WIDTH, "items-center")}>
                    <Text className="text-muted-foreground">{rowIdx + 1}</Text>
                  </View>
                  <View className={PARTICIPANT_WIDTH}>
                    <Text weight="medium" numberOfLines={1}>
                      {row.playerName}
                    </Text>
                  </View>
                  {row.cells.map((subjectCells, si) => (
                    <View key={si} className="flex-row border-l border-border pl-2">
                      {subjectCells.map((points, qi) => (
                        <View key={qi} className={cn(QUESTION_WIDTH, "items-center")}>
                          {points !== null ? (
                            <Text
                              weight="semibold"
                              className={points > 0 ? "text-success" : "text-destructive"}
                            >
                              {points}
                            </Text>
                          ) : (
                            <Text className="text-muted-foreground/30">·</Text>
                          )}
                        </View>
                      ))}
                    </View>
                  ))}
                  <View className={cn(TOTAL_WIDTH, "items-center", row.score > 0 && "bg-brand/10")}>
                    <Text weight="bold" className={row.score > 0 ? "text-brand" : undefined}>
                      {row.score}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </ScrollView>
        </Card.Body>
      </Card>

      <Button variant="outline" onPress={onBack}>
        <Button.Label>{t("archive.backToDashboard")}</Button.Label>
      </Button>
    </Animated.View>
  );
}
