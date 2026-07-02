import { motion } from "framer-motion";
import { CountUp } from "@/features/landing/components/CountUp";
import { fadeUp, staggerContainer, viewport } from "@/features/landing/lib/motion";

const STATS = [
  { to: 257, suffix: "+", label: "Active games" },
  { to: 50, suffix: "K+", label: "Players" },
  { to: 500, suffix: "+", label: "Tournaments" },
  { to: 99, suffix: "%", label: "Uptime" },
];

export function Stats() {
  return (
    <section className='bg-foreground text-background relative overflow-hidden'>
      <div
        aria-hidden
        className='pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-64 w-[60rem] max-w-[120vw] bg-brand/20 blur-[120px]'
      />
      <motion.div
        variants={staggerContainer(0.1)}
        initial='hidden'
        whileInView='show'
        viewport={viewport}
        className='relative max-w-7xl mx-auto px-6 py-20 grid grid-cols-2 md:grid-cols-4 gap-y-12'
      >
        {STATS.map((stat, i) => (
          <motion.div
            key={stat.label}
            variants={fadeUp}
            className={`text-center px-4 ${
              i > 0 ? "md:border-l md:border-background/15" : ""
            }`}
          >
            <div className='text-5xl md:text-6xl font-heading font-semibold tracking-tight tabular-nums'>
              <CountUp to={stat.to} suffix={stat.suffix} />
            </div>
            <div className='mt-2 text-xs uppercase tracking-widest text-background/60'>
              {stat.label}
            </div>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}
