import { Button } from "@zeyn/ui/components/button";
import { useTranslation } from "react-i18next";

interface LoadingViewProps {
  message?: string;
}

export function LoadingView({ message }: LoadingViewProps) {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
      <div className="size-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      <p className="text-sm text-muted-foreground animate-pulse">{message ?? t("game:loading.checkingSession")}</p>
    </div>
  );
}

export function ConnectingView() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
      <div className="relative">
        <div className="size-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="size-10 border-4 border-secondary/20 border-t-secondary rounded-full animate-spin" />
        </div>
      </div>
      <p className="text-sm text-muted-foreground animate-pulse">{t("game:loading.connectingToRoom")}</p>
    </div>
  );
}