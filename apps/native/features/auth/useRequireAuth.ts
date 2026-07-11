import { router, usePathname } from "expo-router";
import { useEffect } from "react";

import { authClient } from "@/lib/auth-client";

export function useRequireAuth() {
  const pathname = usePathname();
  const { data: session, isPending } = authClient.useSession();

  useEffect(() => {
    if (isPending || session) return;

    router.replace({
      pathname: "/(auth)/login",
      params: { returnTo: pathname },
    });
  }, [isPending, session, pathname]);

  return { session, isPending, isAuthenticated: !!session };
}
