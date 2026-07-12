import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import { Skeleton } from "heroui-native";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { withUniwind } from "uniwind";

import { Heading, Screen, ScreenHeader, Text } from "@/components/ui";
import { ProfileGamesList } from "@/features/profile/components/ProfileGamesList";
import { ProfileView } from "@/features/profile/components/ProfileView";
import { trpc } from "@/utils/trpc";

const StyledIonicons = withUniwind(Ionicons);

export default function PublicProfileScreen() {
  const { username: rawUsername } = useLocalSearchParams<{ username: string }>();
  const username = typeof rawUsername === "string" ? rawUsername : "";
  const { t } = useTranslation("profile");

  const profileQuery = useQuery({
    ...trpc.profile.getByUsername.queryOptions({ username }),
    enabled: username.length > 0,
  });

  if (profileQuery.isLoading) {
    return (
      <Screen
        contentClassName="gap-8 px-6 py-6"
        edges={["top", "bottom"]}
        header={<ScreenHeader back title={`@${username}`} />}
      >
        <View className="flex-row items-start gap-4">
          <Skeleton className="size-20 rounded-full" />
          <View className="flex-1 gap-2 pt-1">
            <Skeleton className="h-6 w-40 rounded-md" />
            <Skeleton className="h-4 w-28 rounded-md" />
          </View>
        </View>
      </Screen>
    );
  }

  const data = profileQuery.data;

  if (profileQuery.isError || !data) {
    return (
      <Screen
        contentClassName="items-center justify-center gap-3 px-6"
        edges={["top", "bottom"]}
        header={<ScreenHeader back title={`@${username}`} />}
      >
        <StyledIonicons name="person-remove-outline" size={40} className="text-muted-foreground" />
        <Heading className="text-center">{t("notFound.title")}</Heading>
        <Text className="text-muted-foreground text-center text-sm">
          {t("notFound.description", { username })}
        </Text>
      </Screen>
    );
  }

  return (
    <Screen
      contentClassName="gap-8 px-6 py-6"
      edges={["top", "bottom"]}
      header={<ScreenHeader back title={data.user.name} />}
      refreshing={profileQuery.isRefetching}
      onRefresh={() => profileQuery.refetch()}
    >
      <ProfileView user={data.user} stats={data.stats} isOwner={data.isOwner} />

      {data.history ? (
        <View className="gap-3">
          <Heading className="text-base">{t("recentGames.title")}</Heading>
          <ProfileGamesList items={data.history} emptyLabel={t("recentGames.empty")} />
        </View>
      ) : null}

      {data.hostedGames ? (
        <View className="gap-3">
          <Heading className="text-base">{t("hostedGames.title")}</Heading>
          <ProfileGamesList items={data.hostedGames} emptyLabel={t("hostedGames.empty")} />
        </View>
      ) : null}
    </Screen>
  );
}
