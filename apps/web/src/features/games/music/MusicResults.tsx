import { Trophy, Medal } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@zeyn/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@zeyn/ui/components/card";
import type { GameResultsViewProps } from "@/features/games/types";

const RANK_COLORS = ["text-brand", "text-muted-foreground", "text-muted-foreground"];

export function MusicResults({ results, onBack }: GameResultsViewProps) {
  const { t } = useTranslation();
  const rows = [...results.playerResults].sort((a, b) => b.score - a.score);

  return (
    <div className='min-h-full bg-background p-6 md:p-12'>
      <div className='mx-auto max-w-2xl space-y-8 py-12'>
        <div className='text-center space-y-4'>
          <div className='mx-auto inline-block bg-brand/10 p-4 text-brand'>
            <Trophy className='size-12' />
          </div>
          <h1 className='text-4xl md:text-6xl font-bold'>{t("games:music.results.title")}</h1>
          <p className='text-muted-foreground text-sm uppercase tracking-widest'>
            {t("games:music.results.subtitle")}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t("games:music.results.standings")}</CardTitle>
          </CardHeader>
          <CardContent className='space-y-2'>
            {rows.map((p, i) => (
              <div
                key={p.userId}
                className={`flex items-center justify-between border p-4 ${
                  i === 0 ? "border-brand bg-brand/10" : "bg-muted/50"
                }`}
              >
                <div className='flex items-center gap-3'>
                  <div className='flex size-8 items-center justify-center font-bold'>
                    {i < 3 ? (
                      <Medal className={`size-5 ${RANK_COLORS[i]}`} />
                    ) : (
                      <span className='text-muted-foreground'>{i + 1}</span>
                    )}
                  </div>
                  <span className='font-semibold'>{p.playerName}</span>
                </div>
                <span className='text-lg font-bold tabular-nums'>{p.score}</span>
              </div>
            ))}
            {rows.length === 0 && (
              <p className='text-center text-sm text-muted-foreground'>
                {t("games:music.results.noScores")}
              </p>
            )}
          </CardContent>
        </Card>

        <div className='flex justify-center'>
          <Button variant='brand' onClick={onBack}>
            {t("games:music.results.backToDashboard")}
          </Button>
        </div>
      </div>
    </div>
  );
}
