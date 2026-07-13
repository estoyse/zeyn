import { Switch } from "heroui-native";
import { useTranslation } from "react-i18next";

import { AppearancePicker } from "@/components/appearance-picker";
import { LanguageSwitcher } from "@/components/language-switcher";
import { Group, Row, RowSeparator } from "@/components/ui";
import { setHapticsPref, setSfxMuted, usePrefs } from "@/lib/prefs";

export function PreferencesSection() {
  const { t } = useTranslation("settings");
  const { sfxMuted, hapticsEnabled } = usePrefs();

  return (
    <Group>
      <Row
        label={t("preferences.appearance.label")}
        caption={t("preferences.appearance.description")}
        trailing={<AppearancePicker />}
      />

      <RowSeparator />


      <Row
        label={t("preferences.language.label")}
        caption={t("preferences.language.description")}
        trailing={<LanguageSwitcher />}
      />

      <RowSeparator />


      <Row
        label={t("preferences.sound.label")}
        caption={t("preferences.sound.description")}
        trailing={<Switch
          isSelected={!sfxMuted}
          onSelectedChange={(value) => setSfxMuted(!value)}
        />}
      />

      <RowSeparator />


      <Row
        label={t("preferences.haptics.label")}
        caption={t("preferences.haptics.description")}
        trailing={<Switch isSelected={hapticsEnabled} onSelectedChange={setHapticsPref} />}
      />
    </Group>
  );
}
