import Ionicons from "@expo/vector-icons/Ionicons";
import { useTranslation } from "react-i18next";
import { ScrollView, View } from "react-native";
import Animated, { LinearTransition } from "react-native-reanimated";
import { withUniwind } from "uniwind";

import { AnimatedNumber, Heading, Text } from "@/components/ui";
import { useThemeColor } from "@/lib/theme";
import { cn } from "@/lib/utils";
import type { ClientRoomState } from "@/features/game/hooks/useGameState";

const StyledIonicons = withUniwind(Ionicons);

interface ScoreboardProps {
  state: ClientRoomState;
  playerId: string;
  variant?: "rail" | "strip";
}

function rank(state: ClientRoomState) {
  const excluded = new Set(state.nonScoringPlayerIds ?? []);
  return Object.values(state.players)
    .filter(p => !excluded.has(p.id))
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
}

export function Scoreboard({ state, playerId, variant = "rail" }: ScoreboardProps) {
  const { t } = useTranslation("game");
  const [foreground] = useThemeColor(["foreground"]);
  const players = rank(state);

  if (variant === "strip") {
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8, paddingBottom: 4 }}
      >
        {players.map((p, i) => (
          <Animated.View
            layout={LinearTransition}
            key={p.id}
            className={cn(
              "flex-row items-center gap-2 border bg-muted-surface px-3 py-2",
              p.id === playerId ? "border-brand" : "border-border",
              !p.connected && "opacity-50"
            )}
          >
            <Text className="text-muted-foreground text-xs">{i + 1}</Text>
            <View>
              <View className="flex-row items-center gap-1">
                <Text className="text-muted-foreground text-xs">{p.name}</Text>
                {state.hostId === p.id && (
                  <StyledIonicons name="ribbon" size={12} className="text-brand" />
                )}
              </View>
              <AnimatedNumber
                value={p.score}
                style={{ fontSize: 14, fontWeight: "700", color: foreground }}
              />
            </View>
          </Animated.View>
        ))}
      </ScrollView>
    );
  }

  return (
    <View className="border border-border bg-card">
      <View className="flex-row items-center gap-2 border-b border-border px-4 py-3">
        <StyledIonicons name="trophy" size={16} className="text-brand" />
        <Heading className="text-xs">{t("scoreboard.title")}</Heading>
      </View>

      {players.length === 0 ? (
        <Text className="text-muted-foreground px-4 py-6 text-center text-sm">
          {t("scoreboard.empty")}
        </Text>
      ) : (
        <View>
          {players.map((p, i) => (
            <Animated.View
              layout={LinearTransition}
              key={p.id}
              className={cn(
                "flex-row items-center gap-3 border-b border-border px-4 py-3",
                p.id === playerId && "bg-brand/5"
              )}
            >
              <Text className="text-muted-foreground w-5 text-sm">{i + 1}</Text>
              <View
                className={cn(
                  "size-2 rounded-full",
                  p.connected ? "bg-success" : "bg-muted-foreground/40"
                )}
              />
              <View className="min-w-0 flex-1">
                <Text
                  className={cn(
                    "text-sm",
                    !p.connected && "text-muted-foreground"
                  )}
                  weight="medium"
                >
                  {p.name}
                </Text>
                <View className="flex-row items-center gap-1">
                  {state.hostId === p.id && (
                    <View className="flex-row items-center gap-0.5">
                      <StyledIonicons name="ribbon" size={11} className="text-brand" />
                      <Text className="text-muted-foreground text-[10px]">
                        {t("scoreboard.host")}
                      </Text>
                    </View>
                  )}
                  {p.isGuest && (
                    <Text className="text-muted-foreground text-[10px]">
                      {t("lobby.guest")}
                    </Text>
                  )}
                  {p.id === playerId && (
                    <Text className="text-brand text-[10px]">
                      {t("scoreboard.you")}
                    </Text>
                  )}
                </View>
              </View>
              <AnimatedNumber
                value={p.score}
                style={{ fontSize: 18, fontWeight: "700", color: foreground }}
              />
            </Animated.View>
          ))}
        </View>
      )}
    </View>
  );
}
