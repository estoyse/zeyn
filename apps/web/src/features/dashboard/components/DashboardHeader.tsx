import { Trophy } from "lucide-react";
import { useTranslation } from "react-i18next";
import { PageHeader } from "@/shared/components/app/PageHeader";

interface DashboardHeaderProps {
  userName?: string | null;
}

export function DashboardHeader({ userName }: DashboardHeaderProps) {
  const { t } = useTranslation();

  return (
    <PageHeader
      title={t("dashboard:header.title")}
      subtitle={t("dashboard:header.welcome", { name: userName ?? "" })}
    >
      <div className="flex items-center gap-4 border bg-muted/50 p-2">
        <div className="flex items-center gap-2 border border-brand/30 bg-brand/10 px-4 py-2 text-brand">
          <Trophy className="size-5" />
          <span className="font-bold">
            {t("dashboard:header.points", { count: 0 })}
          </span>
        </div>
      </div>
    </PageHeader>
  );
}
