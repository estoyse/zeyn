import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { Flame, Keyboard, RotateCcw, Timer, Trophy, Zap } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@zeyn/ui/components/button";
import { fireConfetti } from "@/features/landing/lib/confetti";
import { EASE, fadeUp, viewport } from "@/features/landing/lib/motion";

interface Question {
  key: string;
  correct: number;
}

const QUESTIONS: Question[] = [
  {
    key: "redPlanet",
    correct: 1,
  },
  {
    key: "shakespeare",
    correct: 1,
  },
  {
    key: "ocean",
    correct: 2,
  },
  {
    key: "byte",
    correct: 0,
  },
  {
    key: "goldSymbol",
    correct: 1,
  },
];

const QUESTION_MS = 8000;
const LETTERS = ["A", "B", "C"];

type Status = "idle" | "playing" | "feedback" | "done";

function rankFor(score: number, total: number) {
  const max = total * 180;
  const ratio = score / max;
  if (ratio >= 0.8) return { id: "legend", tone: "text-brand" } as const;
  if (ratio >= 0.55) return { id: "sharpShooter", tone: "text-success" } as const;
  if (ratio >= 0.3) return { id: "risingStar", tone: "text-warning" } as const;
  return { id: "warmingUp", tone: "text-muted-foreground" } as const;
}

export function PlayableRound() {
  const { t } = useTranslation();
  const [status, setStatus] = useState<Status>("idle");
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(QUESTION_MS);
  const [results, setResults] = useState<(boolean | null)[]>([]);

  const optionRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const question = QUESTIONS[index];
  const questionOptions = t(
    `landing:playableRound.questions.${question.key}.options`,
    { returnObjects: true },
  ) as string[];

  const start = useCallback(() => {
    setStatus("playing");
    setIndex(0);
    setScore(0);
    setStreak(0);
    setBestStreak(0);
    setCorrectCount(0);
    setSelected(null);
    setTimeLeft(QUESTION_MS);
    setResults([]);
  }, []);

  const answer = useCallback(
    (choice: number) => {
      setStatus(current => {
        if (current !== "playing") return current;
        const isCorrect = choice === question.correct;

        setSelected(choice);
        setResults(prev => [...prev, isCorrect]);

        if (isCorrect) {
          const speedBonus = Math.round((timeLeft / QUESTION_MS) * 90);
          const streakBonus = streak * 30;
          setScore(s => s + 60 + speedBonus + streakBonus);
          setStreak(s => {
            const next = s + 1;
            setBestStreak(b => Math.max(b, next));
            return next;
          });
          setCorrectCount(c => c + 1);

          const el = optionRefs.current[choice];
          if (el) {
            const rect = el.getBoundingClientRect();
            fireConfetti({
              x: rect.left + rect.width / 2,
              y: rect.top + rect.height / 2,
              count: 40,
              power: 8,
            });
          }
        } else {
          setStreak(0);
        }

        return "feedback";
      });
    },
    [question, streak, timeLeft],
  );

  useEffect(() => {
    if (status !== "playing") return;
    const id = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 50) {
          clearInterval(id);
          answer(-1);
          return 0;
        }
        return prev - 50;
      });
    }, 50);
    return () => clearInterval(id);
  }, [status, index, answer]);

  useEffect(() => {
    if (status !== "feedback") return;
    const id = setTimeout(() => {
      if (index + 1 >= QUESTIONS.length) {
        setStatus("done");
        fireConfetti({ y: window.innerHeight * 0.35, count: 140, power: 13 });
      } else {
        setIndex(i => i + 1);
        setSelected(null);
        setTimeLeft(QUESTION_MS);
        setStatus("playing");
      }
    }, 1150);
    return () => clearTimeout(id);
  }, [status, index]);

  useEffect(() => {
    if (status !== "playing") return;
    const onKey = (e: KeyboardEvent) => {
      const map: Record<string, number> = {
        "1": 0, "2": 1, "3": 2, a: 0, b: 1, c: 2,
      };
      const choice = map[e.key.toLowerCase()];
      if (choice !== undefined && choice < questionOptions.length) {
        answer(choice);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [status, question, questionOptions, answer]);

  const timePct = (timeLeft / QUESTION_MS) * 100;
  const isLow = timePct < 30;

  return (
    <section className='border-t relative overflow-hidden'>
      <div
        aria-hidden
        className='pointer-events-none absolute left-1/2 top-0 h-80 w-[50rem] max-w-[120vw] -translate-x-1/2 bg-brand/10 blur-[110px]'
      />
      <div className='relative max-w-3xl mx-auto px-6 py-24 md:py-32'>
        <motion.div
          initial='hidden'
          whileInView='show'
          viewport={viewport}
          variants={fadeUp}
          className='text-center mb-10'
        >
          <p className='text-xs font-mono uppercase tracking-widest text-brand mb-3'>
            {t("landing:playableRound.eyebrow")}
          </p>
          <h2 className='text-4xl md:text-6xl font-heading font-semibold tracking-tight leading-[0.95]'>
            {t("landing:playableRound.title")}
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewport}
          transition={{ duration: 0.6, ease: EASE }}
          className='border bg-card shadow-2xl'
        >
          <div className='flex items-center justify-between px-5 py-3 border-b bg-muted text-xs font-mono uppercase tracking-widest'>
            <span className='flex items-center gap-2'>
              <Zap className='size-3.5 text-brand' />
              {t("landing:playableRound.headerLabel")}
            </span>
            <div className='flex items-center gap-4'>
              <span className='flex items-center gap-1.5'>
                <Flame
                  className={`size-3.5 ${streak > 0 ? "text-buzzer" : "text-muted-foreground"}`}
                />
                {streak}x
              </span>
              <span className='tabular-nums'>
                {t("landing:playableRound.pointsLabel", { score })}
              </span>
            </div>
          </div>

          <div className='p-6 md:p-8'>
            <AnimatePresence mode='wait'>
              {status === "idle" && (
                <IdleScreen key='idle' onStart={start} />
              )}

              {(status === "playing" || status === "feedback") && (
                <motion.div
                  key={`play-${index}`}
                  initial={{ opacity: 0, x: 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -24 }}
                  transition={{ duration: 0.3, ease: EASE }}
                >
                  <div className='flex items-center gap-1.5 mb-5'>
                    {QUESTIONS.map((_, i) => (
                      <span
                        key={i}
                        className={`h-1 flex-1 ${
                          results[i] === true
                            ? "bg-success"
                            : results[i] === false
                              ? "bg-destructive"
                              : i === index
                                ? "bg-brand"
                                : "bg-muted"
                        }`}
                      />
                    ))}
                  </div>

                  <div className='flex items-center justify-between text-xs font-mono text-muted-foreground mb-4'>
                    <span>
                      {t("landing:playableRound.questionCounter", {
                        current: index + 1,
                        total: QUESTIONS.length,
                      })}
                    </span>
                    <span
                      className={`flex items-center gap-1.5 tabular-nums ${
                        isLow && status === "playing"
                          ? "text-destructive"
                          : ""
                      }`}
                    >
                      <Timer className='size-3.5' />
                      {(timeLeft / 1000).toFixed(1)}s
                    </span>
                  </div>

                  <div className='h-1.5 w-full bg-muted mb-6 overflow-hidden'>
                    <motion.div
                      className={isLow ? "h-full bg-destructive" : "h-full bg-brand"}
                      animate={{ width: `${timePct}%` }}
                      transition={{ duration: 0.05, ease: "linear" }}
                    />
                  </div>

                  <h3 className='text-2xl md:text-3xl font-heading font-semibold tracking-tight leading-snug mb-6 min-h-[3.5rem]'>
                    {t(`landing:playableRound.questions.${question.key}.question`)}
                  </h3>

                  <div className='space-y-3'>
                    {questionOptions.map((option, i) => {
                      const isSelected = selected === i;
                      const isAnswer = i === question.correct;
                      const showResult = status === "feedback";
                      let cls =
                        "border-border hover:border-brand hover:bg-brand/5";
                      if (showResult && isAnswer) {
                        cls = "border-success bg-success/10 text-success";
                      } else if (showResult && isSelected && !isAnswer) {
                        cls = "border-destructive bg-destructive/10 text-destructive";
                      } else if (showResult) {
                        cls = "border-border opacity-50";
                      }
                      return (
                        <motion.button
                          key={option}
                          ref={el => {
                            optionRefs.current[i] = el;
                          }}
                          type='button'
                          disabled={status !== "playing"}
                          onClick={() => answer(i)}
                          animate={
                            showResult && isSelected && !isAnswer
                              ? { x: [0, -8, 8, -6, 6, 0] }
                              : { x: 0 }
                          }
                          transition={{ duration: 0.4 }}
                          className={`group/opt flex w-full items-center gap-4 border px-4 py-4 text-left transition-colors ${cls}`}
                        >
                          <span className='flex size-8 shrink-0 items-center justify-center border text-sm font-mono font-bold'>
                            {LETTERS[i]}
                          </span>
                          <span className='text-base font-medium'>{option}</span>
                        </motion.button>
                      );
                    })}
                  </div>

                  <div className='mt-5 flex items-center justify-center gap-2 text-xs text-muted-foreground'>
                    <Keyboard className='size-3.5' />
                    {t("landing:playableRound.answerHint")}
                  </div>
                </motion.div>
              )}

              {status === "done" && (
                <DoneScreen
                  key='done'
                  score={score}
                  correctCount={correctCount}
                  total={QUESTIONS.length}
                  bestStreak={bestStreak}
                  onRestart={start}
                />
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function IdleScreen({ onStart }: { onStart: () => void }) {
  const { t } = useTranslation();
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className='text-center py-8'
    >
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
        className='mx-auto mb-6 flex size-16 items-center justify-center bg-brand text-brand-foreground'
      >
        <Zap className='size-8' />
      </motion.div>
      <h3 className='text-2xl font-heading font-semibold tracking-tight'>
        {t("landing:playableRound.idle.title")}
      </h3>
      <p className='mt-2 text-muted-foreground max-w-sm mx-auto'>
        {t("landing:playableRound.idle.description")}
      </p>
      <div className='mt-7'>
        <Button variant='brand' size='lg' onClick={onStart} className='group'>
          <Zap className='size-4 mr-2 transition-transform group-hover:scale-125' />
          {t("landing:playableRound.idle.startButton")}
        </Button>
      </div>
    </motion.div>
  );
}

function DoneScreen({
  score,
  correctCount,
  total,
  bestStreak,
  onRestart,
}: {
  score: number;
  correctCount: number;
  total: number;
  bestStreak: number;
  onRestart: () => void;
}) {
  const { t } = useTranslation();
  const rank = rankFor(score, total);
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.94 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4, ease: EASE }}
      className='text-center py-6'
    >
      <div className='mx-auto mb-5 flex size-16 items-center justify-center bg-brand/10 text-brand'>
        <Trophy className='size-8' />
      </div>
      <p className='text-xs font-mono uppercase tracking-widest text-muted-foreground'>
        {t("landing:playableRound.done.title")}
      </p>
      <div className='mt-2 text-6xl md:text-7xl font-heading font-semibold tracking-tight tabular-nums'>
        {score}
      </div>
      <p className={`mt-1 font-heading font-semibold text-lg ${rank.tone}`}>
        {t(`landing:playableRound.ranks.${rank.id}`)}
      </p>

      <div className='mt-7 grid grid-cols-3 divide-x divide-border border-y'>
        <Stat label={t("landing:playableRound.done.correctLabel")} value={`${correctCount}/${total}`} />
        <Stat label={t("landing:playableRound.done.accuracyLabel")} value={`${Math.round((correctCount / total) * 100)}%`} />
        <Stat label={t("landing:playableRound.done.bestStreakLabel")} value={`${bestStreak}x`} />
      </div>

      <div className='mt-7 flex flex-col sm:flex-row items-center justify-center gap-3'>
        <Button variant='outline' size='lg' onClick={onRestart} className='group'>
          <RotateCcw className='size-4 mr-2 transition-transform group-hover:-rotate-180' />
          {t("landing:playableRound.done.playAgainButton")}
        </Button>
        <Link to='/auth/login'>
          <Button variant='brand' size='lg'>
            {t("landing:playableRound.done.playWithFriendsButton")}
          </Button>
        </Link>
      </div>
    </motion.div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className='py-4'>
      <div className='text-xl font-heading font-semibold tabular-nums'>
        {value}
      </div>
      <div className='mt-0.5 text-[10px] uppercase tracking-widest text-muted-foreground'>
        {label}
      </div>
    </div>
  );
}
