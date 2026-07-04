import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Zap } from "lucide-react";
import { useTranslation } from "react-i18next";

type Accent = "brand" | "success" | "warning" | "foreground";
type Phase = "asking" | "buzzed" | "correct";

interface Player {
  id: string;
  nameKey?: "youLabel";
  name?: string;
  initials: string;
  accent: Accent;
}

interface Round {
  key: string;
  correct: number;
  winner: number;
  points: number;
}

const PLAYERS: Player[] = [
  { id: "aziz", name: "Aziz", initials: "AZ", accent: "brand" },
  { id: "malika", name: "Malika", initials: "ML", accent: "success" },
  { id: "timur", name: "Timur", initials: "TM", accent: "warning" },
  { id: "you", nameKey: "youLabel", initials: "★", accent: "foreground" },
];

const ROUNDS: Round[] = [
  {
    key: "planet",
    correct: 1,
    winner: 3,
    points: 100,
  },
  {
    key: "monaLisa",
    correct: 0,
    winner: 0,
    points: 150,
  },
  {
    key: "japanCapital",
    correct: 2,
    winner: 3,
    points: 120,
  },
  {
    key: "guitarStrings",
    correct: 0,
    winner: 1,
    points: 90,
  },
];

const ACCENT_BG: Record<Accent, string> = {
  brand: "bg-brand text-brand-foreground",
  success: "bg-success text-success-foreground",
  warning: "bg-warning text-warning-foreground",
  foreground: "bg-foreground text-background",
};

const ACCENT_RING: Record<Accent, string> = {
  brand: "ring-brand",
  success: "ring-success",
  warning: "ring-warning",
  foreground: "ring-foreground",
};

const INITIAL_SCORES = [420, 380, 300, 260];

export function LiveMatch() {
  const { t } = useTranslation();
  const [round, setRound] = useState(0);
  const [phase, setPhase] = useState<Phase>("asking");
  const [scores, setScores] = useState<number[]>(INITIAL_SCORES);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (phase === "asking") {
      timer = setTimeout(() => setPhase("buzzed"), 2600);
    } else if (phase === "buzzed") {
      timer = setTimeout(() => {
        setScores(prev => {
          const next = [...prev];
          next[ROUNDS[round].winner] += ROUNDS[round].points;
          return next;
        });
        setPhase("correct");
      }, 850);
    } else {
      timer = setTimeout(() => {
        setRound(r => (r + 1) % ROUNDS.length);
        setPhase("asking");
      }, 1700);
    }
    return () => clearTimeout(timer);
  }, [phase, round]);

  const current = ROUNDS[round];
  const winnerId = PLAYERS[current.winner].id;
  const revealed = phase === "buzzed" || phase === "correct";
  const currentOptions = t(`landing:liveMatch.rounds.${current.key}.options`, {
    returnObjects: true,
  }) as string[];

  const ranked = PLAYERS.map((p, i) => ({ player: p, score: scores[i] })).sort(
    (a, b) => b.score - a.score,
  );

  return (
    <div className='w-full border bg-card shadow-2xl'>
      <div className='flex items-center justify-between px-4 py-3 border-b bg-muted'>
        <div className='flex items-center gap-2 text-xs font-mono uppercase tracking-widest'>
          <span className='relative flex size-2'>
            <span className='absolute inline-flex h-full w-full animate-ping bg-destructive opacity-75' />
            <span className='relative inline-flex size-2 bg-destructive' />
          </span>
          {t("landing:liveMatch.liveLabel")}
        </div>
        <span className='text-xs font-mono text-muted-foreground'>
          {t("landing:liveMatch.roundLabel", {
            current: round + 1,
            total: ROUNDS.length,
          })}
        </span>
      </div>

      <div className='p-5 space-y-4'>
        <div className='space-y-3'>
          <div className='h-1 w-full bg-muted overflow-hidden'>
            <motion.div
              key={`bar-${round}`}
              className='h-full bg-buzzer'
              initial={{ width: "100%" }}
              animate={{ width: "22%" }}
              transition={{ duration: phase === "asking" ? 2.6 : 0, ease: "linear" }}
            />
          </div>

          <AnimatePresence mode='wait'>
            <motion.div
              key={`q-${round}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
              className='min-h-[3.5rem]'
            >
              <p className='text-xs font-mono uppercase tracking-widest text-muted-foreground mb-1'>
                {t("landing:liveMatch.questionLabel")}
              </p>
              <p className='text-base font-medium leading-snug'>
                {t(`landing:liveMatch.rounds.${current.key}.question`)}
              </p>
            </motion.div>
          </AnimatePresence>

          <div className='grid grid-cols-3 gap-2'>
            {currentOptions.map((option, i) => {
              const isCorrect = phase === "correct" && i === current.correct;
              return (
                <div
                  key={option}
                  className={`border px-2 py-2.5 text-center text-sm transition-colors ${
                    isCorrect
                      ? "border-success bg-success/10 text-success font-semibold"
                      : "border-border text-muted-foreground"
                  }`}
                >
                  {option}
                </div>
              );
            })}
          </div>
        </div>

        <div className='space-y-2 pt-1'>
          {ranked.map(({ player, score }, index) => {
            const isWinner = revealed && player.id === winnerId;
            return (
              <motion.div
                key={player.id}
                layout
                transition={{ type: "spring", stiffness: 500, damping: 40 }}
                className={`flex items-center gap-3 border px-3 py-2 ${
                  isWinner
                    ? `bg-brand/5 ring-1 ${ACCENT_RING[player.accent]}`
                    : "border-border"
                }`}
              >
                <span className='w-4 text-xs font-mono text-muted-foreground'>
                  {index + 1}
                </span>
                <div
                  className={`size-7 flex items-center justify-center text-xs font-bold ${ACCENT_BG[player.accent]}`}
                >
                  {player.initials}
                </div>
                <span className='flex-1 text-sm font-medium'>
                  {player.nameKey ? t(`landing:liveMatch.${player.nameKey}`) : player.name}
                </span>
                <AnimatePresence>
                  {isWinner && (
                    <motion.span
                      initial={{ opacity: 0, scale: 0.6 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.6 }}
                      className='flex items-center gap-1 text-[10px] font-mono font-bold uppercase text-buzzer'
                    >
                      <Zap className='size-3' />
                      {t("landing:liveMatch.buzzLabel")}
                    </motion.span>
                  )}
                </AnimatePresence>
                <motion.span
                  key={score}
                  initial={{ scale: 1 }}
                  animate={isWinner ? { scale: [1, 1.25, 1] } : { scale: 1 }}
                  transition={{ duration: 0.4 }}
                  className='w-12 text-right text-sm font-mono font-semibold tabular-nums'
                >
                  {score.toLocaleString()}
                </motion.span>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
