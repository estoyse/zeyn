import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Music2, Check, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@zeyn/ui/components/card";
import { Badge } from "@zeyn/ui/components/badge";
import { musicGameConfig } from "@zeyn/api/games";
import { Timer } from "@/features/game/components/Timer";
import type { GamePlayViewProps } from "@/features/games/types";
import type { MusicView } from "./types";

export function MusicPlaying({ room }: GamePlayViewProps) {
  const { t } = useTranslation();
  const state = room.state as MusicView | null;
  const [picked, setPicked] = useState<number | null>(null);

  const questionNumber = state?.currentQuestionIndex ?? 0;
  useEffect(() => {
    setPicked(null);
  }, [questionNumber]);

  if (!state || !state.question) {
    return (
      <div className='flex items-center justify-center p-8'>
        <p className='text-muted-foreground'>{t("games:music.playing.loading")}</p>
      </div>
    );
  }

  const isReveal = state.phase === "REVEAL";
  const alreadyAnswered = state.answeredPlayerIds.includes(room.userId);
  const options = state.question.options;
  const duration = isReveal
    ? musicGameConfig.revealTimeMs
    : musicGameConfig.questionTimeMs;
  const expiresAt = state.timerExpiresAt - room.serverTimeOffset;

  const onAnswer = (index: number) => {
    if (isReveal || alreadyAnswered) return;
    setPicked(index);
    room.send({ type: "ANSWER", playerId: room.userId, optionIndex: index });
  };

  return (
    <motion.div
      key='music-playing'
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className='space-y-6'
    >
      <div className='flex flex-col items-center gap-3 text-center'>
        <div className='flex items-center gap-2 border bg-muted px-4 py-2'>
          <Music2 className='size-4 text-brand' />
          <span className='text-xs uppercase tracking-widest text-muted-foreground'>
            {t("games:music.playing.questionLabel")}
          </span>
          <span className='font-semibold text-brand'>
            {state.currentQuestionIndex + 1} / {state.totalQuestions}
          </span>
        </div>
        {!isReveal && (
          <p className='text-xs text-muted-foreground'>
            {t("games:music.playing.answeredCount", {
              answered: state.answeredPlayerIds.length,
              total: Object.keys(state.players).length,
            })}
          </p>
        )}
        <div className='w-full max-w-md'>
          <Timer expiresAt={expiresAt} duration={duration} />
        </div>
      </div>

      <Card className='mx-auto w-full max-w-2xl xl:max-w-3xl'>
        <CardContent className='p-6 space-y-6'>
          {!isReveal && (
            <audio
              key={questionNumber}
              src={state.question.previewUrl}
              autoPlay
              controls
              className='w-full'
            />
          )}

          {!room.isSpectator && (
            <div className='grid gap-3'>
              {options.map((label, index) => {
                const correct = isReveal && index === state.reveal?.correctIndex;
                const wrongPick = isReveal && picked === index && !correct;
                const isYourAnswer = isReveal && picked === index;
                return (
                  <button
                    key={index}
                    onClick={() => onAnswer(index)}
                    disabled={isReveal || alreadyAnswered}
                    className={`flex items-center justify-between gap-2 border p-4 xl:py-5 text-left font-medium transition-all ${
                      correct
                        ? "border-success bg-success/10 text-success"
                        : wrongPick
                        ? "border-destructive bg-destructive/10 text-destructive"
                        : picked === index
                        ? "border-brand bg-brand/10"
                        : "border-border hover:border-brand/50 disabled:opacity-50"
                    }`}
                  >
                    <span className='flex items-center gap-2'>
                      {label}
                      {isYourAnswer && (
                        <Badge tone='brand'>{t("games:music.playing.yourAnswer")}</Badge>
                      )}
                    </span>
                    {correct && <Check className='size-5 text-success' />}
                    {wrongPick && <X className='size-5 text-destructive' />}
                  </button>
                );
              })}
            </div>
          )}

          {isReveal && state.reveal && (
            <div className='text-center space-y-1'>
              <p className='text-xs uppercase tracking-widest text-muted-foreground'>
                {t("games:music.playing.correctAnswer")}
              </p>
              <p className='text-lg xl:text-2xl font-bold text-success'>
                {state.reveal.correctTitle}
              </p>
              <p className='text-sm text-muted-foreground'>
                {state.reveal.artistName}
              </p>
            </div>
          )}

          {isReveal && state.reveal && (
            <div className='space-y-2'>
              <p className='text-xs uppercase tracking-widest text-muted-foreground'>
                {t("games:music.playing.results")}
              </p>
              <div className='divide-y border'>
                {Object.values(state.players)
                  .slice()
                  .sort((a, b) => {
                    const aPoints = state.reveal?.answers[a.id]?.pointsAwarded ?? 0;
                    const bPoints = state.reveal?.answers[b.id]?.pointsAwarded ?? 0;
                    if (bPoints !== aPoints) return bPoints - aPoints;
                    return a.name.localeCompare(b.name);
                  })
                  .map((p) => {
                    const answer = state.reveal?.answers[p.id];
                    return (
                      <div
                        key={p.id}
                        className={`flex items-center justify-between gap-2 p-3 text-sm ${
                          p.id === room.userId ? "bg-brand/5" : ""
                        }`}
                      >
                        <span className='font-medium'>{p.name}</span>
                        <div className='flex items-center gap-3'>
                          {!answer && (
                            <span className='text-muted-foreground'>
                              {t("games:music.playing.noAnswer")}
                            </span>
                          )}
                          {answer?.correct && (
                            <span className='flex items-center gap-1 text-success'>
                              <Check className='size-4' />
                              {t("games:music.playing.correct")}
                            </span>
                          )}
                          {answer && !answer.correct && (
                            <span className='flex items-center gap-1 text-destructive'>
                              <X className='size-4' />
                              {t("games:music.playing.wrong")}
                            </span>
                          )}
                          {answer && answer.pointsAwarded > 0 && (
                            <span className='font-bold tabular-nums'>
                              +{answer.pointsAwarded}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {!isReveal && alreadyAnswered && (
            <p className='text-center text-sm text-muted-foreground'>
              {t("games:music.playing.answerLocked")}
            </p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
