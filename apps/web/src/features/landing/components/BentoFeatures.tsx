import { motion } from "framer-motion";
import { Radio, Trophy, Users, Zap } from "lucide-react";
import { useTranslation } from "react-i18next";
import { SectionHeader } from "@/features/landing/components/GamesShowcase";
import { fadeUp, staggerContainer, viewport } from "@/features/landing/lib/motion";

export function BentoFeatures() {
  const { t } = useTranslation();
  return (
    <section className='border-t bg-muted/30'>
      <div className='max-w-7xl mx-auto px-6 py-24 md:py-32'>
        <SectionHeader
          eyebrow={t("landing:bento.eyebrow")}
          title={t("landing:bento.title")}
        />

        <motion.div
          variants={staggerContainer(0.08)}
          initial='hidden'
          whileInView='show'
          viewport={viewport}
          className='mt-14 grid gap-4 md:grid-cols-3 md:auto-rows-[13rem]'
        >
          <motion.div
            variants={fadeUp}
            className='group relative md:col-span-2 md:row-span-2 border bg-card p-8 overflow-hidden flex flex-col justify-between transition-colors hover:border-brand/40'
          >
            <div
              aria-hidden
              className='pointer-events-none absolute -right-24 -top-24 size-72 bg-brand/10 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity'
            />
            <div className='relative'>
              <div className='size-12 bg-brand text-brand-foreground flex items-center justify-center mb-5'>
                <Radio className='size-6' />
              </div>
              <h3 className='text-2xl md:text-3xl font-heading font-semibold tracking-tight max-w-md'>
                {t("landing:bento.realtime.title")}
              </h3>
              <p className='mt-3 text-muted-foreground leading-relaxed max-w-md'>
                {t("landing:bento.realtime.description")}
              </p>
            </div>
            <div className='relative mt-6 flex gap-2'>
              {[...Array(5)].map((_, i) => (
                <motion.span
                  key={i}
                  className='h-8 w-full bg-buzzer/20'
                  animate={{ scaleY: [0.4, 1, 0.4] }}
                  transition={{
                    duration: 1.4,
                    repeat: Infinity,
                    delay: i * 0.15,
                    ease: "easeInOut",
                  }}
                  style={{ transformOrigin: "bottom" }}
                />
              ))}
            </div>
          </motion.div>

          <BentoCard
            icon={Users}
            title={t("landing:bento.playWithAnyone.title")}
            description={t("landing:bento.playWithAnyone.description")}
          />
          <BentoCard
            icon={Zap}
            title={t("landing:bento.instantScoring.title")}
            description={t("landing:bento.instantScoring.description")}
          />
          <motion.div
            variants={fadeUp}
            className='group md:col-span-3 border bg-card p-8 flex flex-col md:flex-row md:items-center gap-6 justify-between transition-colors hover:border-brand/40'
          >
            <div className='flex items-start gap-5'>
              <div className='size-12 shrink-0 bg-brand/10 text-brand flex items-center justify-center'>
                <Trophy className='size-6' />
              </div>
              <div>
                <h3 className='text-xl font-heading font-semibold tracking-tight'>
                  {t("landing:bento.competeToWin.title")}
                </h3>
                <p className='mt-1.5 text-muted-foreground leading-relaxed max-w-xl'>
                  {t("landing:bento.competeToWin.description")}
                </p>
              </div>
            </div>
            <div className='flex gap-8 shrink-0'>
              <Metric value='<50ms' label={t("landing:bento.syncLatencyLabel")} />
              <Metric value='2' label={t("landing:bento.gameModesLabel")} />
              <Metric value='∞' label={t("landing:bento.rematchesLabel")} />
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

function BentoCard({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof Zap;
  title: string;
  description: string;
}) {
  return (
    <motion.div
      variants={fadeUp}
      className='group border bg-card p-6 flex flex-col justify-between transition-colors hover:border-brand/40'
    >
      <div className='size-11 bg-brand/10 text-brand flex items-center justify-center transition-transform group-hover:-translate-y-0.5'>
        <Icon className='size-5' />
      </div>
      <div className='mt-4'>
        <h3 className='font-heading font-semibold tracking-tight text-lg'>
          {title}
        </h3>
        <p className='mt-1.5 text-sm text-muted-foreground leading-relaxed'>
          {description}
        </p>
      </div>
    </motion.div>
  );
}

function Metric({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div className='text-2xl font-heading font-semibold tracking-tight'>
        {value}
      </div>
      <div className='text-xs uppercase tracking-widest text-muted-foreground mt-1'>
        {label}
      </div>
    </div>
  );
}
