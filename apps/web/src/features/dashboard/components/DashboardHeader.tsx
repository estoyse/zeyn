import { Trophy } from "lucide-react";
import { useTranslation } from "react-i18next";

interface DashboardHeaderProps {
  userName?: string | null;
}

export function DashboardHeader({ userName }: DashboardHeaderProps) {
  const { t } = useTranslation();

  return (
    <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
      <div className="space-y-1">
        <h1 className="text-3xl md:text-4xl font-bold">
          {t("dashboard:header.title")}
        </h1>
        <p className="text-muted-foreground">
          {t("dashboard:header.welcome", { name: userName ?? "" })}
        </p>
      </div>
      <div className="flex items-center gap-4 border bg-muted/50 p-2">
        <div className="flex items-center gap-2 border border-brand/30 bg-brand/10 px-4 py-2 text-brand">
          <Trophy className="size-5" />
          <span className="font-bold">
            {t("dashboard:header.points", { count: 0 })}
          </span>
        </div>
      </div>
    </header>
  );
}