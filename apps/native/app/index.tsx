import { Redirect } from "expo-router";
import { useEffect, useState } from "react";

import { authClient } from "@/lib/auth-client";
import { getSeenOnboarding } from "@/lib/onboarding-storage";

export default function Index() {
  const { isPending } = authClient.useSession();
  const [seenOnboarding, setSeenOnboardingState] = useState<boolean | null>(null);

  useEffect(() => {
    getSeenOnboarding().then(setSeenOnboardingState);
  }, []);

  if (isPending || seenOnboarding === null) {
    return null;
  }

  return <Redirect href={seenOnboarding ? "/(tabs)/home" : "/(onboarding)"} />;
}
