import Ionicons from "@expo/vector-icons/Ionicons";
import { useQuery } from "@tanstack/react-query";
import { router, type Href } from "expo-router";
import { useTranslation } from "react-i18next";
import { withUniwind } from "uniwind";

import { Group, Row, Screen, ScreenHeader, Section } from "@/components/ui";
import { DangerSection } from "@/features/settings/components/DangerSection";
import { PreferencesSection } from "@/features/settings/components/PreferencesSection";
import { SecuritySection } from "@/features/settings/components/SecuritySection";
import { SettingsSkeleton } from "@/features/settings/components/SettingsSkeleton";
import { trpc } from "@/utils/trpc";

const StyledIonicons = withUniwind(Ionicons);

export default function SettingsScreen() {
  const { t } = useTranslation("settings");
  const { t: tProfile } = useTranslation("profile");

  const meQuery = useQuery(trpc.profile.getMe.queryOptions());
  const me = meQuery.data;

  return (
    <Screen
      edges={["top", "bottom"]}
      header={<ScreenHeader back title={t("title")} />}
      refreshing={meQuery.isRefetching}
      onRefresh={() => meQuery.refetch()}
    >
      {!me ? (
        <SettingsSkeleton />
      ) : (
        <>
          <Group>
            <Row
              label={tProfile("editProfile")}
              leading={
                <StyledIonicons
                  name="person-outline"
                  size={18}
                  className="text-muted-foreground"
                />
              }
              chevron
              onPress={() => router.push("/settings/profile" as Href)}
            />
          </Group>

          <Section eyebrow={t("preferences.title")}>
            <PreferencesSection />
          </Section>

          <Section eyebrow={t("tabs.security")}>
            <SecuritySection />
          </Section>

          <Section eyebrow={t("tabs.danger")}>
            <DangerSection username={me.username} />
          </Section>
        </>
      )}
    </Screen>
  );
}
