import { Spinner } from "heroui-native";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui";
import { useAuth } from "@/features/auth/useAuth";

type SocialButtonsProps = {
  returnTo?: string;
};

export function SocialButtons({ returnTo }: SocialButtonsProps) {
  const { t } = useTranslation("auth");
  const { signInWithGoogle } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  async function handlePress() {
    setIsLoading(true);
    try {
      await signInWithGoogle(returnTo);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Button variant="secondary" onPress={handlePress} isDisabled={isLoading} className="mt-1">
      {isLoading ? (
        <Spinner size="sm" color="default" />
      ) : (
        <Button.Label>{t("login.googleButton")}</Button.Label>
      )}
    </Button>
  );
}
