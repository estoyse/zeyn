import { useLocalSearchParams } from "expo-router";

import { Screen } from "@/components/ui";
import { AuthForm } from "@/features/auth/components/AuthForm";

export default function LoginScreen() {
  const { returnTo } = useLocalSearchParams<{ returnTo?: string }>();

  return (
    <Screen contentClassName="items-center justify-center gap-4 px-6 py-10">
      <AuthForm returnTo={typeof returnTo === "string" ? returnTo : undefined} />
    </Screen>
  );
}
