import Ionicons from "@expo/vector-icons/Ionicons";
import { formatLocalCode } from "@zeyn/api/local-code";
import * as Clipboard from "expo-clipboard";
import { Card, useToast } from "heroui-native";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import QRCode from "react-native-qrcode-svg";
import { withUniwind } from "uniwind";

import { Heading, PressableScale, Text } from "@/components/ui";
import { haptic } from "@/lib/haptics";

const StyledIonicons = withUniwind(Ionicons);

interface LocalRoomHeroProps {
  code: string;
  ip?: string;
  guestUrl?: string;
}

export function LocalRoomHero({ code, ip, guestUrl }: LocalRoomHeroProps) {
  const { t } = useTranslation("game");
  const { toast } = useToast();

  const copyCode = async () => {
    haptic("impact");
    await Clipboard.setStringAsync(code);
    toast.show({ variant: "success", label: t("local.host.codeCopied") });
  };

  return (
    <Card>
      <Card.Body className="items-center gap-4">
        {guestUrl ? (
          <View className="items-center gap-3">
            <View className="rounded-card bg-white p-4">
              <QRCode
                value={guestUrl}
                size={196}
                color="#000000"
                backgroundColor="#FFFFFF"
              />
            </View>
            <Text className="text-center text-muted-foreground text-sm">
              {t("local.host.scanHint")}
            </Text>
          </View>
        ) : null}

        <PressableScale
          haptic={null}
          onPress={copyCode}
          accessibilityRole="button"
          accessibilityLabel={t("local.host.copyCode")}
          className="items-center gap-2"
        >
          <Text className="text-caption uppercase text-muted-foreground">
            {t("local.host.roomCode")}
          </Text>
          <Heading className="text-title-1 tracking-[0.12em]">
            {formatLocalCode(code)}
          </Heading>
          <View className="flex-row items-center gap-1.5">
            <StyledIonicons
              name="copy-outline"
              size={13}
              className="text-muted-foreground"
            />
            <Text className="text-caption uppercase text-muted-foreground">
              {t("local.host.tapToCopy")}
            </Text>
          </View>
        </PressableScale>

        {guestUrl ? (
          <Text className="text-center text-muted-foreground text-xs">
            {t("local.host.codeHint")}
          </Text>
        ) : null}

        {ip ? (
          <View className="flex-row items-center gap-1.5">
            <StyledIonicons
              name="wifi"
              size={14}
              className="text-muted-foreground"
            />
            <Text className="text-caption text-muted-foreground">
              {t("local.host.ipLabel", { ip })}
            </Text>
          </View>
        ) : null}

        {guestUrl ? (
          <View className="w-full flex-row items-start gap-2 rounded-row border border-dashed border-border bg-muted-surface p-3">
            <StyledIonicons
              name="alert-circle-outline"
              size={16}
              className="text-warning"
            />
            <Text className="flex-1 text-muted-foreground text-xs">
              {t("local.host.keepOpen")}
            </Text>
          </View>
        ) : null}
      </Card.Body>
    </Card>
  );
}
