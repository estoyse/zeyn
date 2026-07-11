import { Redirect } from "expo-router";
import { useEffect, useState } from "react";

import { getSeenOnboarding } from "@/lib/onboarding-storage";
import { authClient } from "@/lib/auth-client";

export default function Index() {
  const { isPending } = authClient.useSession();
  const [seenOnboarding, setSeenOnboardingState] = useState<boolean | null>(null);

  useEffect(() => {
    getSeenOnboarding().then(setSeenOnboardingState);
  }, []);

  if (isPending || seenOnboarding === null) {
    return null;
  }

  if (!seenOnboarding) {
    return <Redirect href="/(onboarding)" />;
  }

  return <Redirect href="/(tabs)/home" />;
}
