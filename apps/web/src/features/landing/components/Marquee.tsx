import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";

const WORD_KEYS = [
  "buzzerTrivia",
  "musicQuiz",
  "realtime",
  "liveLeaderboards",
  "streakBonuses",
  "privateRooms",
  "instantScoring",
  "multiplayer",
] as const;

export function Marquee() {
  const { t } = useTranslation();
  const words = WORD_KEYS.map(key => t(`landing:marquee.words.${key}`));
  const items = [...words, ...words];
  return (
    <div className='border-y bg-foreground text-background overflow-hidden py-4'>
      <motion.div
        className='flex whitespace-nowrap'
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration: 22, repeat: Infinity, ease: "linear" }}
      >
        {items.map((word, i) => (
          <span
            key={i}
            className='flex items-center gap-6 px-6 text-2xl md:text-3xl font-heading font-semibold uppercase tracking-tight'
          >
            {word}
            <span className='text-buzzer'>✦</span>
          </span>
        ))}
      </motion.div>
    </div>
  );
}
