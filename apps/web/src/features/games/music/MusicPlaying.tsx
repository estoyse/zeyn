import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Music2, Check, X } from "lucide-react";
import { Card, CardContent } from "@shaxsiy-oyin/ui/components/card";
import { musicGameConfig } from "@shaxsiy-oyin/api/games";
import { Timer } from "@/features/game/components/Timer";
import type { GamePlayViewProps } from "@/features/games/types";
import type { MusicView } from "./types";

export function MusicPlaying({ room }: GamePlayViewProps) {
  const state = room.state as MusicView | null;
  const [picked, setPicked] = useState<number | null>(null);

  const questionNumber = state?.currentQuestionIndex ?? 0;
  useEffect(() => {
    setPicked(null);
  }, [questionNumber]);

  if (!state || !state.question) {
    return (
      <div className='flex items-center justify-center p-8'>
        <p className='text-muted-foreground'>Loading question...</p>
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
        <div className='flex items-center gap-2 bg-muted px-4 py-2 rounded-lg border'>
          <Music2 className='size-4 text-primary' />
          <span className='text-xs text-muted-foreground uppercase'>
            Question
          </span>
          <span className='font-semibold text-primary'>
            {state.currentQuestionIndex + 1} / {state.totalQuestions}
          </span>
        </div>
        <div className='w-full max-w-md'>
          <Timer expiresAt={expiresAt} duration={duration} />
        </div>
      </div>

      <Card className='mx-auto max-w-2xl'>
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

          <div className='grid gap-3'>
            {options.map((label, index) => {
              const correct = isReveal && index === state.reveal?.correctIndex;
              const wrongPick = isReveal && picked === index && !correct;
              return (
                <button
                  key={index}
                  onClick={() => onAnswer(index)}
                  disabled={isReveal || alreadyAnswered}
                  className={`flex items-center justify-between gap-2 rounded-xl border p-4 text-left font-medium transition-all ${
                    correct
                      ? "border-green-500 bg-green-500/10"
                      : wrongPick
                      ? "border-destructive bg-destructive/10"
                      : picked === index
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50 disabled:opacity-60"
                  }`}
                >
                  <span>{label}</span>
                  {correct && <Check className='size-5 text-green-500' />}
                  {wrongPick && <X className='size-5 text-destructive' />}
                </button>
              );
            })}
          </div>

          {isReveal && state.reveal && (
            <div className='text-center space-y-1'>
              <p className='text-xs text-muted-foreground uppercase'>
                Correct Answer
              </p>
              <p className='text-lg font-bold text-green-500'>
                {state.reveal.correctTitle}
              </p>
              <p className='text-sm text-muted-foreground'>
                {state.reveal.artistName}
              </p>
            </div>
          )}

          {!isReveal && alreadyAnswered && (
            <p className='text-center text-sm text-muted-foreground'>
              Answer locked in — waiting for others...
            </p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
