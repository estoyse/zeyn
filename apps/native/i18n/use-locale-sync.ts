import { useEffect, useRef } from "react";

import { authClient } from "@/lib/auth-client";
import i18n, { supportedLocales, type Locale } from "@/i18n/config";

export function useLocaleSync() {
  const { data: session } = authClient.useSession();
  const syncedUserId = useRef<string | null>(null);

  const userId = session?.user?.id ?? null;
  const userLocale = session?.user?.locale as Locale | undefined;

  useEffect(() => {
    if (!userId) {
      syncedUserId.current = null;
      return;
    }
    if (syncedUserId.current === userId) return;
    syncedUserId.current = userId;

    if (userLocale && supportedLocales.includes(userLocale) && userLocale !== i18n.language) {
      i18n.changeLanguage(userLocale);
    }
  }, [userId, userLocale]);
}
