import Ionicons from "@expo/vector-icons/Ionicons";
import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";
import { withUniwind } from "uniwind";

import { Heading, Screen, ScreenHeader, Text } from "@/components/ui";
import { ProfileGamesSection } from "@/features/profile/components/ProfileGamesSection";
import { ProfileSkeleton } from "@/features/profile/components/ProfileSkeleton";
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
        edges={["top", "bottom"]}
        header={<ScreenHeader back title={`@${username}`} />}
      >
        <ProfileSkeleton />
      </Screen>
    );
  }

  const data = profileQuery.data;

  if (profileQuery.isError || !data) {
    return (
      <Screen
        contentClassName="items-center justify-center"
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
      edges={["top", "bottom"]}
      header={<ScreenHeader back title={data.user.name} />}
      refreshing={profileQuery.isRefetching}
      onRefresh={() => profileQuery.refetch()}
    >
      <ProfileView user={data.user} stats={data.stats} isOwner={data.isOwner} />

      <ProfileGamesSection history={data.history} hostedGames={data.hostedGames} />
    </Screen>
  );
}
