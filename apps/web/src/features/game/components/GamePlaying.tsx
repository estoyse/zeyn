import { motion } from "framer-motion";
import { Button } from "@zeyn/ui/components/button";
import { Input } from "@zeyn/ui/components/input";
import { Badge } from "@zeyn/ui/components/badge";
import { Card, CardContent } from "@zeyn/ui/components/card";
import { Zap, Clock } from "lucide-react";
import { gameConfig } from "@zeyn/api/game-types";
import { useTranslation } from "react-i18next";
import type { BuzzerView } from "@/features/games/buzzer/types";
import { Timer } from "./Timer";

interface GamePlayingProps {
  state: BuzzerView;
  playerId: string;
  answerInput: string;
  setAnswerInput: (value: string) => void;
  onBuzz: () => void;
  onSubmitAnswer: (e: React.FormEvent) => void;
}

export function GamePlaying({
  state,
  playerId,
  answerInput,
  setAnswerInput,
  onBuzz,
  onSubmitAnswer,
}: GamePlayingProps) {
  const { t } = useTranslation();
  const isMyTurn = state.activeQuestionState?.buzzedPlayerId === playerId;
  const isBuzzedOut = state.activeQuestionState?.playersWhoAttempted.includes(playerId) ?? false;
  const attemptsLeft = Math.max(
    0,
    gameConfig.maxWrongAttempts - (state.activeQuestionState?.wrongAttempts ?? 0)
  );

  if (!state.currentQuestion) {
    return (
      <div className='flex items-center justify-center p-8'>
        <p className='text-muted-foreground'>{t("game:playing.loadingQuestion")}</p>
      </div>
    );
  }

  return (
    <motion.div
      key='playing'
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className='space-y-6'
    >
      <MatchProgress state={state} />

      <Card className='mx-auto w-full max-w-2xl xl:max-w-3xl'>
        <CardContent className='p-6 flex flex-col items-center gap-4'>
          {state.phase === "ACTIVE" && (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className='w-full text-center space-y-4'
            >
              <div className='space-y-2'>
                <div className='flex flex-wrap items-center justify-center gap-2'>
                  <Badge tone='primary'>
                    {t("game:playing.questionWorth", { points: state.currentQuestion?.points })}
                  </Badge>
                  {state.activeQuestionState && (
                    <Badge tone={attemptsLeft <= 1 ? "warning" : "default"}>
                      {t("game:playing.attemptsLeft", { count: attemptsLeft })}
                    </Badge>
                  )}
                </div>
                <h2 className='text-xl md:text-2xl xl:text-3xl font-bold'>
                  {state.currentQuestion?.text}
                </h2>
              </div>

              <div className='w-full'>
                {state.activeQuestionState && (
                  <Timer
                    expiresAt={state.activeQuestionState.timerExpiresAt}
                    duration={gameConfig.questionTimeMs}
                  />
                )}
              </div>

              <Button
                size='lg'
                variant='brand'
                className='size-28 xl:size-36 rounded-full'
                onClick={onBuzz}
                disabled={state.activeQuestionState?.playersWhoAttempted.includes(
                  playerId
                )}
                title={isBuzzedOut ? t("game:playing.buzzedOut") : undefined}
                aria-label={isBuzzedOut ? t("game:playing.buzzedOut") : undefined}
              >
                <div className='flex flex-col items-center'>
                  <Zap className='size-10 xl:size-14 xl:mb-2 mb-1' />
                  <span className='text-xl xl:text-2xl font-bold'>{t("game:playing.buzz")}</span>
                </div>
              </Button>
              {isBuzzedOut && (
                <p className='text-sm text-destructive/80'>{t("game:playing.buzzedOut")}</p>
              )}
            </motion.div>
          )}

          {state.phase === "ANSWERING" && (
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className='w-full space-y-4'
            >
              <div className='flex justify-center'>
                <Badge tone='warning'>
                  <Zap className='size-3' />
                  {t("game:playing.awaitingAnswer")}
                </Badge>
              </div>

              <Card>
                {isMyTurn ? (
                  <CardContent className='p-4 space-y-3'>
                    <form onSubmit={onSubmitAnswer} className='space-y-3'>
                      <Input
                        value={answerInput}
                        onChange={e => setAnswerInput(e.target.value)}
                        placeholder={t("game:playing.answerPlaceholder")}
                        className='text-center'
                        autoFocus
                      />
                      <div className='flex items-center justify-between gap-3'>
                        {state.activeQuestionState && (
                          <Timer
                            expiresAt={state.activeQuestionState.timerExpiresAt}
                            duration={gameConfig.answerTimeMs}
                          />
                        )}
                        <Button type='submit'>{t("game:playing.submit")}</Button>
                      </div>
                    </form>
                  </CardContent>
                ) : (
                  <CardContent className='flex flex-col items-center gap-3 p-4'>
                    <div className='flex size-12 items-center justify-center bg-muted'>
                      <Clock className='size-6 text-muted-foreground animate-spin' />
                    </div>
                    <div className='text-center'>
                      <p className='text-lg font-bold'>
                        {
                          state.players[
                            state.activeQuestionState!.buzzedPlayerId!
                          ]?.name
                        }
                      </p>
                      <p className='text-xs uppercase tracking-widest text-muted-foreground'>
                        {t("game:playing.isThinking")}
                      </p>
                    </div>
                    {state.activeQuestionState && (
                      <Timer
                        expiresAt={state.activeQuestionState.timerExpiresAt}
                        duration={gameConfig.answerTimeMs}
                      />
                    )}
                  </CardContent>
                )}
              </Card>
            </motion.div>
          )}

          {state.phase === "REVEALED" && (
            <motion.div
              initial={{ scale: 1.1, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className='w-full text-center space-y-4'
            >
              <div className='space-y-1'>
                <p className='text-xs uppercase tracking-widest text-muted-foreground'>
                  {t("game:playing.correctAnswer")}
                </p>
                <motion.h2
                  animate={{ y: [0, -5, 0] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className='text-3xl md:text-4xl xl:text-5xl font-bold text-success'
                >
                  {state.currentQuestion?.answer}
                </motion.h2>
              </div>

              <div className='flex flex-col items-center gap-2 pt-3'>
                <div className='h-1 w-full max-w-xs bg-muted overflow-hidden'>
                  <motion.div
                    initial={{ width: "100%" }}
                    animate={{ width: "0%" }}
                    transition={{ duration: 5, ease: "linear" }}
                    className='h-full bg-brand'
                  />
                </div>
                <p className='text-xs text-muted-foreground'>
                  {t("game:playing.nextQuestionShortly")}
                </p>
              </div>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

function MatchProgress({ state }: { state: BuzzerView }) {
  const { t } = useTranslation();
  const perSubject = gameConfig.questionsPerSubject;
  const subjects = Array.from({ length: state.subjectCount }, (_, i) => i);
  const questions = Array.from({ length: perSubject }, (_, i) => i);

  const totalQuestions = state.subjectCount * perSubject;
  const answered = state.currentSubjectIndex * perSubject + state.currentQuestionIndex;

  return (
    <div className='flex flex-col items-center gap-3'>
      <div className='flex items-center gap-2'>
        <span className='size-2 shrink-0 animate-pulse rounded-full bg-brand' />
        <h2 className='text-lg font-bold uppercase tracking-widest text-brand'>
          {state.currentSubjectName}
        </h2>
      </div>

      <div
        role='progressbar'
        aria-valuemin={0}
        aria-valuemax={totalQuestions}
        aria-valuenow={answered + 1}
        className='flex w-full max-w-2xl items-center gap-1.5'
      >
        {subjects.map(subject => {
          if (subject < state.currentSubjectIndex) {
            return (
              <div
                key={subject}
                className='h-2 flex-1 border bg-muted-foreground/30'
              />
            );
          }

          if (subject > state.currentSubjectIndex) {
            return <div key={subject} className='h-2 flex-1 border bg-muted' />;
          }

          return (
            <motion.div
              key={subject}
              layout
              className='flex flex-[2.5] gap-0.5 border border-brand p-0.5'
            >
              {questions.map(question => (
                <div
                  key={question}
                  className={
                    question < state.currentQuestionIndex
                      ? "h-1.5 flex-1 bg-brand/40"
                      : question === state.currentQuestionIndex
                        ? "h-1.5 flex-1 bg-brand"
                        : "h-1.5 flex-1 bg-muted"
                  }
                />
              ))}
            </motion.div>
          );
        })}
      </div>

      <p className='text-xs uppercase tracking-widest text-muted-foreground'>
        {t("game:playing.subjectProgress", {
          current: state.currentSubjectIndex + 1,
          total: state.subjectCount,
        })}
        <span aria-hidden className='mx-2 text-muted-foreground/50'>
          ·
        </span>
        {t("game:playing.questionProgress", {
          current: state.currentQuestionIndex + 1,
          total: perSubject,
        })}
      </p>
    </div>
  );
}
