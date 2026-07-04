import { Trophy } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@zeyn/ui/components/card";

export function LeaderboardPlaceholder() {
  const { t } = useTranslation();

  return (
    <Card>
      <CardHeader className='pb-2'>
        <CardTitle className='text-base flex items-center gap-2'>
          <Trophy className='size-4' />
          {t("dashboard:leaderboard.title")}
        </CardTitle>
        <CardDescription className='text-xs'>
          {t("dashboard:leaderboard.description")}
        </CardDescription>
      </CardHeader>
      <CardContent className='p-4'>
        <div className='text-xs text-muted-foreground text-center py-4 border-2 border-dashed bg-muted/50'>
          {t("dashboard:leaderboard.comingSoon")}
        </div>
      </CardContent>
    </Card>
  );
}
