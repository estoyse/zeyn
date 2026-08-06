import { encodeLocalCode, parseLocalGuestUrl } from "@zeyn/api/local-code";
import { CameraView, useCameraPermissions } from "expo-camera";
import { router, type Href } from "expo-router";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";

import { Button, Heading, Text } from "@/components/ui";
import { FocusLayout } from "@/features/game/components/FocusLayout";
import { FocusTopBar } from "@/features/game/components/FocusTopBar";
import { haptic } from "@/lib/haptics";

export default function LocalScanScreen() {
  const { t } = useTranslation("game");
  const [permission, requestPermission] = useCameraPermissions();
  const [invalid, setInvalid] = useState(false);
  const handledRef = useRef(false);

  const leave = () => router.back();

  const onScanned = (value: string) => {
    if (handledRef.current) return;

    const address = parseLocalGuestUrl(value);
    if (!address) {
      setInvalid(true);
      return;
    }

    handledRef.current = true;
    haptic("success");
    const code = encodeLocalCode(address.ip, address.nonce, address.version);
    router.replace(`/local/join?c=${code}` as Href);
  };

  if (!permission) {
    return <FocusLayout header={<FocusTopBar onLeave={leave} />}>{null}</FocusLayout>;
  }

  if (!permission.granted) {
    return (
      <FocusLayout header={<FocusTopBar onLeave={leave} />}>
        <View className="flex-1 items-center justify-center gap-6 p-6">
          <View className="items-center gap-2">
            <Heading className="text-center text-title-3">
              {t("local.scan.permissionTitle")}
            </Heading>
            <Text className="text-center text-muted-foreground text-sm">
              {t("local.scan.permissionDescription")}
            </Text>
          </View>

          <View className="w-full max-w-sm gap-2">
            {permission.canAskAgain ? (
              <Button onPress={requestPermission}>
                <Button.Label>{t("local.scan.grant")}</Button.Label>
              </Button>
            ) : null}
            <Button variant="ghost" onPress={leave}>
              <Button.Label>{t("local.scan.enterCode")}</Button.Label>
            </Button>
          </View>
        </View>
      </FocusLayout>
    );
  }

  return (
    <FocusLayout header={<FocusTopBar onLeave={leave} />}>
      <View className="flex-1">
        <CameraView
          style={StyleSheet.absoluteFill}
          facing="back"
          barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
          onBarcodeScanned={({ data }) => onScanned(data)}
        />

        <View className="flex-1 items-center justify-end gap-3 p-8">
          <View className="w-full rounded-card bg-black/60 p-4">
            <Text className="text-center text-sm text-white">
              {invalid ? t("local.scan.invalid") : t("local.scan.hint")}
            </Text>
          </View>
        </View>
      </View>
    </FocusLayout>
  );
}
