import { useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { FadeSwap, Heading, PressableScale, Text } from "@/components/ui";
import { cn } from "@/lib/utils";

import { ProfileGamesList, type ProfileGameItem } from "./ProfileGamesList";

interface ProfileGamesSectionProps {
  history: ProfileGameItem[] | null;
  hostedGames: ProfileGameItem[] | null;
}

function Segment({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <PressableScale
      haptic="select"
      onPress={onPress}
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      className={cn(
        "h-10 flex-1 items-center justify-center rounded-pill",
        active && "bg-surface"
      )}
    >
      <Text
        weight={active ? "semibold" : "medium"}
        className={cn("text-sm", !active && "text-muted-foreground")}
      >
        {label}
      </Text>
    </PressableScale>
  );
}

export function ProfileGamesSection({ history, hostedGames }: ProfileGamesSectionProps) {
  const { t } = useTranslation("profile");
  const [segment, setSegment] = useState<"played" | "hosted">("played");

  if (history === null && hostedGames === null) {
    return null;
  }

  if (history !== null && hostedGames !== null) {
    const items = segment === "played" ? history : hostedGames;
    const emptyLabel = segment === "played" ? t("recentGames.empty") : t("hostedGames.empty");

    return (
      <View className="gap-3">
        <View className="flex-row gap-1 rounded-pill bg-muted-surface p-1">
          <Segment
            label={t("stats.played")}
            active={segment === "played"}
            onPress={() => setSegment("played")}
          />
          <Segment
            label={t("stats.hosted")}
            active={segment === "hosted"}
            onPress={() => setSegment("hosted")}
          />
        </View>
        <FadeSwap swapKey={segment}>
          <ProfileGamesList items={items} emptyLabel={emptyLabel} />
        </FadeSwap>
      </View>
    );
  }

  if (history !== null) {
    return (
      <View className="gap-3">
        <Heading className="text-base">{t("recentGames.title")}</Heading>
        <ProfileGamesList items={history} emptyLabel={t("recentGames.empty")} />
      </View>
    );
  }

  if (hostedGames !== null) {
    return (
      <View className="gap-3">
        <Heading className="text-base">{t("hostedGames.title")}</Heading>
        <ProfileGamesList items={hostedGames} emptyLabel={t("hostedGames.empty")} />
      </View>
    );
  }

  return null;
}
