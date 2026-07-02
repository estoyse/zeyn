import { motion } from "framer-motion";
import { Button } from "@shaxsiy-oyin/ui/components/button";
import { Input } from "@shaxsiy-oyin/ui/components/input";
import { Badge } from "@shaxsiy-oyin/ui/components/badge";
import { Card, CardContent } from "@shaxsiy-oyin/ui/components/card";
import { Zap, Clock } from "lucide-react";
import { gameConfig } from "@shaxsiy-oyin/api/game-types";
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
  const isMyTurn = state.activeQuestionState?.buzzedPlayerId === playerId;

  if (!state.currentQuestion) {
    return (
      <div className='flex items-center justify-center p-8'>
        <p className='text-muted-foreground'>Loading question...</p>
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
      <div className='flex flex-col items-center gap-3 text-center'>
        <div className='flex items-center gap-2 border bg-muted px-4 py-2'>
          <div className='size-2 bg-brand animate-pulse rounded-full' />
          <span className='text-xs uppercase tracking-widest text-muted-foreground'>
            Current Category
          </span>
          <span className='font-semibold text-brand'>
            {state.currentSubjectName}
          </span>
        </div>

        <div className='flex gap-2'>
          {[0, 1, 2, 3, 4].map(idx => (
            <motion.div
              key={idx}
              initial={false}
              animate={{
                width: idx === state.currentQuestionIndex ? 16 : 8,
              }}
              className={
                idx < state.currentQuestionIndex
                  ? "h-2 border bg-muted-foreground/30"
                  : idx === state.currentQuestionIndex
                  ? "h-2 border border-brand bg-brand"
                  : "h-2 border bg-muted"
              }
            />
          ))}
        </div>
      </div>

      <Card className='mx-auto max-w-2xl'>
        <CardContent className='p-6 flex flex-col items-center gap-4'>
          {state.phase === "ACTIVE" && (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className='w-full text-center space-y-4'
            >
              <div className='space-y-2'>
                <Badge tone='primary'>
                  Question worth {state.currentQuestion?.points}
                </Badge>
                <h2 className='text-xl md:text-2xl font-bold'>
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
                className='size-28 rounded-full'
                onClick={onBuzz}
                disabled={state.activeQuestionState?.playersWhoAttempted.includes(
                  playerId
                )}
              >
                <div className='flex flex-col items-center'>
                  <Zap className='size-10 mb-1' />
                  <span className='text-xl font-bold'>BUZZ!</span>
                </div>
              </Button>
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
                  Awaiting Answer
                </Badge>
              </div>

              <Card>
                {isMyTurn ? (
                  <CardContent className='p-4 space-y-3'>
                    <form onSubmit={onSubmitAnswer} className='space-y-3'>
                      <Input
                        value={answerInput}
                        onChange={e => setAnswerInput(e.target.value)}
                        placeholder='Type your answer...'
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
                        <Button type='submit'>Submit</Button>
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
                        Is thinking...
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
                  Correct Answer
                </p>
                <motion.h2
                  animate={{ y: [0, -5, 0] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className='text-3xl md:text-4xl font-bold text-success'
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
                  Next question starts shortly
                </p>
              </div>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
