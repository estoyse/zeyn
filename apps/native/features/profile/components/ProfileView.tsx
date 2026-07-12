import { Ionicons } from "@expo/vector-icons";
import { router, type Href } from "expo-router";
import { Avatar, Card } from "heroui-native";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { withUniwind } from "uniwind";

import { AnimatedNumber, Button, Heading, Text } from "@/components/ui";
import { useThemeColor } from "@/lib/theme";

import { initials, memberSince } from "../lib/format";

const StyledIonicons = withUniwind(Ionicons);

export interface ProfileUser {
  name: string;
  username: string | null;
  image: string | null;
  bio: string | null;
  createdAt: Date | string | number;
  isProfilePublic: boolean;
  showStats: boolean;
  showHistory: boolean;
  showHostedGames: boolean;
}

export interface ProfileStats {
  gamesPlayed: number;
  gamesHosted: number;
  bestScore: number;
  totalScore: number;
}

interface ProfileViewProps {
  user: ProfileUser;
  stats: ProfileStats | null;
  isOwner: boolean;
}

function StatTile({ label, value }: { label: string; value: number }) {
  const [foreground] = useThemeColor(["foreground"]);

  return (
    <Card className="flex-1">
      <Card.Body className="items-center gap-1">
        <AnimatedNumber
          value={value}
          style={{ fontSize: 22, fontWeight: "700", color: foreground, textAlign: "center" }}
        />
        <Text
          numberOfLines={1}
          className="text-muted-foreground text-center text-[10px] font-semibold uppercase tracking-wider"
        >
          {label}
        </Text>
      </Card.Body>
    </Card>
  );
}

export function ProfileView({ user, stats, isOwner }: ProfileViewProps) {
  const { t } = useTranslation("profile");

  return (
    <View className="gap-6">
      <View className="items-center gap-3">
        <Avatar size="lg" color="accent" alt={user.name}>
          {user.image ? <Avatar.Image source={{ uri: user.image }} /> : null}
          <Avatar.Fallback>{initials(user.name)}</Avatar.Fallback>
        </Avatar>

        <View className="items-center gap-0.5">
          <Heading className="text-center text-xl normal-case">{user.name}</Heading>
          {user.username ? (
            <Text className="text-muted-foreground">@{user.username}</Text>
          ) : null}
        </View>

        {user.bio ? (
          <Text className="text-center text-sm leading-relaxed">{user.bio}</Text>
        ) : null}

        <View className="flex-row flex-wrap items-center justify-center gap-2">
          <View className="flex-row items-center gap-1.5">
            <StyledIonicons name="sparkles" size={12} className="text-muted-foreground" />
            <Text className="text-muted-foreground text-xs">
              {t("memberSince", { date: memberSince(user.createdAt) })}
            </Text>
          </View>
          {isOwner && !user.isProfilePublic ? (
            <View className="flex-row items-center gap-1 rounded-full border border-border px-2 py-0.5">
              <StyledIonicons name="lock-closed" size={10} className="text-muted-foreground" />
              <Text className="text-muted-foreground text-xs">
                {t("privateProfile")}
              </Text>
            </View>
          ) : null}
        </View>

        {isOwner ? (
          <Button size="sm" variant="outline" onPress={() => router.push("/settings" as Href)}>
            <StyledIonicons name="pencil" size={14} className="text-foreground" />
            <Button.Label>{t("editProfile")}</Button.Label>
          </Button>
        ) : null}
      </View>

      {stats ? (
        <View className="gap-3">
          <View className="flex-row items-center gap-2">
            <Heading className="text-base">{t("stats.title")}</Heading>
            {isOwner && !user.showStats ? (
              <View className="flex-row items-center gap-1 rounded-full border border-border px-2 py-0.5">
                <StyledIonicons name="lock-closed" size={10} className="text-muted-foreground" />
                <Text className="text-muted-foreground text-xs">{t("onlyYou")}</Text>
              </View>
            ) : null}
          </View>

          <View className="flex-row gap-3">
            <StatTile label={t("stats.played")} value={stats.gamesPlayed} />
            <StatTile label={t("stats.hosted")} value={stats.gamesHosted} />
            <StatTile label={t("stats.best")} value={stats.bestScore} />
            <StatTile label={t("stats.total")} value={stats.totalScore} />
          </View>
        </View>
      ) : null}
    </View>
  );
}
