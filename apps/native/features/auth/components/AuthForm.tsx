import { Surface } from "heroui-native";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import Animated, { FadeOut } from "react-native-reanimated";
import { View } from "react-native";

import { Heading, LogoLockup } from "@/components/ui";
import { fadeIn } from "@/lib/motion";

import { LoginForm } from "./LoginForm";
import { RegisterForm } from "./RegisterForm";

type AuthFormProps = {
  returnTo?: string;
};

export function AuthForm({ returnTo }: AuthFormProps) {
  const [isRegister, setIsRegister] = useState(false);
  const { t } = useTranslation("auth");

  return (
    <View className="w-full max-w-sm gap-6">
      <View className="items-center gap-3">
        <LogoLockup size="lg" />
        <Heading className="text-center">
          {isRegister
            ? t("register.title", "Create your account")
            : t("login.title", "Welcome back")}
        </Heading>
      </View>

      <Surface variant="secondary" className="rounded-lg p-4">
        <Animated.View
          key={isRegister ? "register" : "login"}
          entering={fadeIn()}
          exiting={FadeOut}
        >
          {isRegister ? (
            <RegisterForm returnTo={returnTo} onSwitch={() => setIsRegister(false)} />
          ) : (
            <LoginForm returnTo={returnTo} onSwitch={() => setIsRegister(true)} />
          )}
        </Animated.View>
      </Surface>
    </View>
  );
}
