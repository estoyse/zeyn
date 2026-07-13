import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { Screen, ScreenHeader, Section } from "@/components/ui";
import { AccountSection } from "@/features/settings/components/AccountSection";
import { PrivacySection } from "@/features/settings/components/PrivacySection";
import { SettingsSkeleton } from "@/features/settings/components/SettingsSkeleton";
import { trpc } from "@/utils/trpc";

export default function EditProfileScreen() {
  const { t } = useTranslation("profile");
  const { t: tSettings } = useTranslation("settings");

  const meQuery = useQuery(trpc.profile.getMe.queryOptions());
  const me = meQuery.data;

  return (
    <Screen edges={["top", "bottom"]} header={<ScreenHeader back title={t("editProfile")} />}>
      {!me ? (
        <SettingsSkeleton />
      ) : (
        <>
          <Section eyebrow={tSettings("tabs.account")}>
            <AccountSection me={me} />
          </Section>

          <Section eyebrow={tSettings("tabs.privacy")}>
            <PrivacySection me={me} />
          </Section>
        </>
      )}
    </Screen>
  );
}
