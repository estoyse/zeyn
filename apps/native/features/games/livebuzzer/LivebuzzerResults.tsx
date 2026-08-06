import Ionicons from "@expo/vector-icons/Ionicons";
import { Card } from "heroui-native";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import Animated, { LinearTransition } from "react-native-reanimated";
import { withUniwind } from "uniwind";

import { Button, Heading, Text } from "@/components/ui";
import { Podium } from "@/features/game/components/Podium";
import type { GameResultsViewProps } from "@/features/games/types";
import { cn } from "@/lib/utils";

const StyledIonicons = withUniwind(Ionicons);

const RANK_COLORS = ["text-brand", "text-muted-foreground", "text-muted-foreground"];

export function LivebuzzerResults({ results, onBack }: GameResultsViewProps) {
  const { t } = useTranslation("games");
  const rows = [...results.playerResults].sort((a, b) => b.score - a.score);

  return (
    <View className="gap-8">
      <View className="items-center gap-2">
        <Heading className="text-title-1">{t("livebuzzer.results.title")}</Heading>
        <Text className="text-caption uppercase text-muted-foreground">
          {t("livebuzzer.results.subtitle")}
        </Text>
      </View>

      <Podium
        entries={rows.map(p => ({ id: p.userId, name: p.playerName, score: p.score }))}
      />

      <Card>
        <Card.Body className="gap-2">
          {rows.map((p, i) => (
            <Animated.View
              layout={LinearTransition}
              key={p.id}
              className={cn(
                "flex-row items-center justify-between gap-3 border p-4",
                i === 0 ? "border-brand bg-brand/10" : "border-border bg-muted-surface"
              )}
            >
              <View className="flex-row items-center gap-3">
                <View className="size-8 items-center justify-center">
                  {i < 3 ? (
                    <StyledIonicons name="medal" size={20} className={RANK_COLORS[i]} />
                  ) : (
                    <Text className="text-muted-foreground">{i + 1}</Text>
                  )}
                </View>
                <Text weight="semibold" className="text-sm">
                  {p.playerName}
                </Text>
              </View>
              <Text weight="bold" className="text-lg">
                {p.score}
              </Text>
            </Animated.View>
          ))}
          {rows.length === 0 && (
            <Text className="text-muted-foreground py-4 text-center text-sm">
              {t("livebuzzer.results.noScores")}
            </Text>
          )}
        </Card.Body>
      </Card>

      <Button onPress={onBack}>
        <Button.Label>{t("livebuzzer.results.backToDashboard")}</Button.Label>
      </Button>
    </View>
  );
}
