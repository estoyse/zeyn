import { useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { FadeSwap, Heading, LogoLockup, PressableScale, Text } from "@/components/ui";
import { cn } from "@/lib/utils";

import { LoginForm } from "./LoginForm";
import { RegisterForm } from "./RegisterForm";

type AuthFormProps = {
  returnTo?: string;
};

export function AuthForm({ returnTo }: AuthFormProps) {
  const [isRegister, setIsRegister] = useState(false);
  const { t } = useTranslation("auth");

  return (
    <View className="w-full max-w-sm gap-7">
      <View className="items-center gap-3">
        <LogoLockup size="lg" />
        <Heading className="text-center text-title-2">
          {isRegister ? t("register.title") : t("login.title")}
        </Heading>
      </View>

      <View className="flex-row gap-1 rounded-pill bg-muted-surface p-1">
        <Segment
          label={t("login.submitButton")}
          active={!isRegister}
          onPress={() => setIsRegister(false)}
        />
        <Segment
          label={t("register.submitButton")}
          active={isRegister}
          onPress={() => setIsRegister(true)}
        />
      </View>

      <FadeSwap swapKey={isRegister ? "register" : "login"}>
        {isRegister ? (
          <RegisterForm returnTo={returnTo} />
        ) : (
          <LoginForm returnTo={returnTo} />
        )}
      </FadeSwap>
    </View>
  );
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
