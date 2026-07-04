import { useRef } from "react";
import { motion, useScroll, useSpring } from "framer-motion";
import { DoorOpen, Gamepad2, Trophy } from "lucide-react";
import { useTranslation } from "react-i18next";
import { SectionHeader } from "@/features/landing/components/GamesShowcase";
import { fadeUp, viewport } from "@/features/landing/lib/motion";

const STEPS = [
  {
    id: "createRoom",
    icon: DoorOpen,
  },
  {
    id: "playRealTime",
    icon: Gamepad2,
  },
  {
    id: "climbLeaderboard",
    icon: Trophy,
  },
] as const;

export function HowItWorks() {
  const { t } = useTranslation();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 65%", "end 65%"],
  });
  const scaleY = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 30,
    restDelta: 0.001,
  });

  return (
    <section id='how' className='scroll-mt-24'>
      <div className='max-w-7xl mx-auto px-6 py-24 md:py-32'>
        <SectionHeader
          eyebrow={t("landing:howItWorks.eyebrow")}
          title={t("landing:howItWorks.title")}
        />

        <div ref={ref} className='mt-16 relative max-w-3xl'>
          <div className='absolute left-6 top-2 bottom-2 w-px bg-border' />
          <motion.div
            style={{ scaleY, transformOrigin: "top" }}
            className='absolute left-6 top-2 bottom-2 w-px bg-brand'
          />

          <div className='space-y-12'>
            {STEPS.map((step, i) => (
              <motion.div
                key={step.id}
                variants={fadeUp}
                initial='hidden'
                whileInView='show'
                viewport={viewport}
                className='relative pl-20'
              >
                <div className='absolute left-0 top-0 flex size-12 items-center justify-center border bg-card text-brand'>
                  <step.icon className='size-5' />
                </div>
                <div className='flex items-baseline gap-3'>
                  <span className='font-mono text-sm font-semibold text-brand'>
                    0{i + 1}
                  </span>
                  <h3 className='text-xl md:text-2xl font-heading font-semibold tracking-tight'>
                    {t(`landing:howItWorks.steps.${step.id}.title`)}
                  </h3>
                </div>
                <p className='mt-2 text-muted-foreground leading-relaxed'>
                  {t(`landing:howItWorks.steps.${step.id}.description`)}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
