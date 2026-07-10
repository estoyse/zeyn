import { Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";

export function ReconnectingBanner() {
  const { t } = useTranslation();

  return (
    <div
      role='status'
      aria-live='polite'
      className='sticky top-0 z-20 flex items-center justify-center gap-2 border-b border-warning/30 bg-warning/10 px-4 py-2 text-sm text-warning'
    >
      <Loader2 className='size-4 shrink-0 animate-spin' />
      <span>{t("game:connection.reconnecting")}</span>
    </div>
  );
}
