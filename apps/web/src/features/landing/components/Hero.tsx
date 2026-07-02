import { Link } from "@tanstack/react-router";
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@shaxsiy-oyin/ui/components/button";
import { EASE, fadeUp, staggerContainer } from "@/features/landing/lib/motion";
import { LiveMatch } from "@/features/landing/components/LiveMatch";

const LINES: { text: string; variant: "solid" | "brand" | "outline" }[] = [
  { text: "Buzz in.", variant: "solid" },
  { text: "Outplay.", variant: "brand" },
  { text: "Win.", variant: "outline" },
];

export function Hero() {
  const mx = useMotionValue(50);
  const my = useMotionValue(20);
  const glow = useMotionTemplate`radial-gradient(600px circle at ${mx}% ${my}%, color-mix(in oklch, var(--brand) 22%, transparent), transparent 70%)`;

  const rotateY = useSpring(useTransform(mx, [0, 100], [-7, 7]), {
    stiffness: 150,
    damping: 20,
  });
  const rotateX = useSpring(useTransform(my, [0, 100], [7, -7]), {
    stiffness: 150,
    damping: 20,
  });

  function onMouseMove(e: React.MouseEvent<HTMLElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    mx.set(((e.clientX - rect.left) / rect.width) * 100);
    my.set(((e.clientY - rect.top) / rect.height) * 100);
  }

  return (
    <section
      onMouseMove={onMouseMove}
      className='relative overflow-hidden border-b'
    >
      <motion.div
        aria-hidden
        style={{ background: glow }}
        className='pointer-events-none absolute inset-0 -z-10'
      />
      <div
        aria-hidden
        className='pointer-events-none absolute inset-x-0 bottom-0 h-40 -z-10 bg-gradient-to-b from-transparent to-background'
      />

      <div className='max-w-7xl mx-auto px-6 pt-16 pb-20 md:pt-24 md:pb-28'>
        <div className='grid lg:grid-cols-[1.05fr_0.95fr] gap-12 lg:gap-8 items-center'>
          <motion.div
            variants={staggerContainer(0.1)}
            initial='hidden'
            animate='show'
          >
            <motion.div variants={fadeUp}>
              <span className='inline-flex items-center gap-2 border border-brand/30 bg-brand/5 px-3 py-1.5 text-xs font-mono uppercase tracking-widest text-brand'>
                <Sparkles className='size-3' />
                Real-time multiplayer trivia
              </span>
            </motion.div>

            <h1 className='mt-6 font-heading font-semibold uppercase tracking-tight leading-[0.9] text-6xl sm:text-7xl lg:text-8xl'>
              {LINES.map(line => (
                <motion.span
                  key={line.text}
                  variants={fadeUp}
                  className='block'
                  style={
                    line.variant === "outline"
                      ? {
                          WebkitTextStroke: "2px var(--brand)",
                          color: "transparent",
                        }
                      : undefined
                  }
                >
                  <span
                    className={line.variant === "brand" ? "text-brand" : undefined}
                  >
                    {line.text}
                  </span>
                </motion.span>
              ))}
            </h1>

            <motion.p
              variants={fadeUp}
              className='mt-6 max-w-md text-lg text-muted-foreground leading-relaxed'
            >
              Live quiz showdowns where the fastest mind wins. Create a room,
              invite your crew, and race to the top of the board — in real time.
            </motion.p>

            <motion.div
              variants={fadeUp}
              className='mt-8 flex flex-col sm:flex-row gap-4'
            >
              <Link to='/auth/login'>
                <Button variant='brand' size='lg' className='group w-full sm:w-auto'>
                  Start Playing
                  <ArrowRight className='size-4 ml-2 transition-transform group-hover:translate-x-1' />
                </Button>
              </Link>
              <a href='#how'>
                <Button variant='outline' size='lg' className='w-full sm:w-auto'>
                  How it works
                </Button>
              </a>
            </motion.div>

            <motion.div
              variants={fadeUp}
              className='mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-muted-foreground'
            >
              <span className='flex items-center gap-2'>
                <span className='relative flex size-2'>
                  <span className='absolute inline-flex h-full w-full animate-ping bg-success opacity-75' />
                  <span className='relative inline-flex size-2 bg-success' />
                </span>
                23 games live now
              </span>
              <span>50K+ players</span>
              <span>Free to play</span>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: EASE, delay: 0.2 }}
            className='[perspective:1400px]'
          >
            <motion.div
              style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
            >
              <LiveMatch />
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
