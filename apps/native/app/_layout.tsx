import "@/global.css";
import "@/i18n/config";
import {
  IBMPlexSans_400Regular,
  IBMPlexSans_500Medium,
  IBMPlexSans_600SemiBold,
  IBMPlexSans_700Bold,
} from "@expo-google-fonts/ibm-plex-sans";
import {
  useFonts,
  SpaceGrotesk_400Regular,
  SpaceGrotesk_500Medium,
  SpaceGrotesk_600SemiBold,
  SpaceGrotesk_700Bold,
} from "@expo-google-fonts/space-grotesk";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { QueryClientProvider } from "@tanstack/react-query";
import * as SplashScreen from "expo-splash-screen";
import { Stack, type ErrorBoundaryProps } from "expo-router";
import { HeroUINativeProvider } from "heroui-native";
import { useEffect, useState } from "react";
import { I18nextProvider } from "react-i18next";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import {
  SafeAreaProvider,
  initialWindowMetrics,
} from "react-native-safe-area-context";

import { ErrorFallback } from "@/components/error-fallback";
import { AppThemeProvider } from "@/contexts/app-theme-context";
import i18n, { initLocale } from "@/i18n/config";
import { useLocaleSync } from "@/i18n/use-locale-sync";
import { authClient } from "@/lib/auth-client";
import { getSeenOnboarding } from "@/lib/onboarding-storage";
import { hydratePrefs } from "@/lib/prefs";
import { useThemeColor } from "@/lib/theme";
import { queryClient } from "@/utils/trpc";

SplashScreen.preventAutoHideAsync();
SplashScreen.setOptions({ duration: 250, fade: true });

export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  return <ErrorFallback error={error} retry={retry} />;
}

export const unstable_settings = {
  initialRouteName: "index",
};

function SplashGate() {
  const { isPending } = authClient.useSession();
  const [onboardingResolved, setOnboardingResolved] = useState(false);

  useEffect(() => {
    getSeenOnboarding().then(() => setOnboardingResolved(true));
  }, []);

  useEffect(() => {
    if (!isPending && onboardingResolved) {
      SplashScreen.hideAsync();
    }
  }, [isPending, onboardingResolved]);

  return null;
}

function StackLayout() {
  useLocaleSync();
  const [background] = useThemeColor(["background"]);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: background },
        animation: "ios_from_right",
        freezeOnBlur: true,
      }}
    >
      <Stack.Screen name="index" options={{ animation: "none" }} />
      <Stack.Screen
        name="(onboarding)"
        options={{ animation: "fade", gestureEnabled: false }}
      />
      <Stack.Screen name="(auth)" options={{ presentation: "modal" }} />
      <Stack.Screen
        name="(tabs)"
        options={{ animation: "fade", gestureEnabled: false }}
      />
      <Stack.Screen
        name="game/[gameId]"
        options={{
          presentation: "fullScreenModal",
          animation: "slide_from_bottom",
          animationDuration: 420,
          gestureEnabled: false,
        }}
      />
      <Stack.Screen name="game/create/[gameType]" options={{ presentation: "modal" }} />
      <Stack.Screen name="u/[username]" />
      <Stack.Screen name="settings/index" />
      <Stack.Screen name="+not-found" options={{ animation: "fade" }} />
    </Stack>
  );
}

export default function Layout() {
  useEffect(() => {
    initLocale();
    hydratePrefs();
  }, []);

  const [loaded] = useFonts({
    SpaceGrotesk_400Regular,
    SpaceGrotesk_500Medium,
    SpaceGrotesk_600SemiBold,
    SpaceGrotesk_700Bold,
    IBMPlexSans_400Regular,
    IBMPlexSans_500Medium,
    IBMPlexSans_600SemiBold,
    IBMPlexSans_700Bold,
  });

  if (!loaded) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <I18nextProvider i18n={i18n}>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <SafeAreaProvider initialMetrics={initialWindowMetrics}>
            <KeyboardProvider>
              <AppThemeProvider>
                <HeroUINativeProvider>
                  <BottomSheetModalProvider>
                    <SplashGate />
                    <StackLayout />
                  </BottomSheetModalProvider>
                </HeroUINativeProvider>
              </AppThemeProvider>
            </KeyboardProvider>
          </SafeAreaProvider>
        </GestureHandlerRootView>
      </I18nextProvider>
    </QueryClientProvider>
  );
}
