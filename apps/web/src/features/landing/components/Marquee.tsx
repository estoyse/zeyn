import { motion } from "framer-motion";

const WORDS = [
  "Buzzer Trivia",
  "Music Quiz",
  "Real-time",
  "Live Leaderboards",
  "Streak Bonuses",
  "Private Rooms",
  "Instant Scoring",
  "Multiplayer",
];

export function Marquee() {
  const items = [...WORDS, ...WORDS];
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
            <span className='text-brand'>✦</span>
          </span>
        ))}
      </motion.div>
    </div>
  );
}
