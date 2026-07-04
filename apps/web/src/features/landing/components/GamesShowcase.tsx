import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowRight, Users } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@zeyn/ui/components/button";
import { listClientGames } from "@/features/games/registry";
import { fadeUp, staggerContainer, viewport } from "@/features/landing/lib/motion";

export function GamesShowcase() {
  const { t } = useTranslation();
  const games = listClientGames();

  return (
    <section id='games' className='scroll-mt-24'>
      <div className='max-w-7xl mx-auto px-6 py-24 md:py-32'>
        <SectionHeader
          eyebrow={t("landing:gamesShowcase.eyebrow")}
          title={t("landing:gamesShowcase.title")}
          subtitle={t("landing:gamesShowcase.subtitle")}
        />

        <div className='mt-16 space-y-6'>
          {games.map((game, i) => (
            <motion.div
              key={game.type}
              variants={staggerContainer(0.08)}
              initial='hidden'
              whileInView='show'
              viewport={viewport}
            >
              <Link
                to='/games/$gameType'
                params={{ gameType: game.type }}
                className='group relative grid md:grid-cols-[auto_1fr_auto] items-center gap-6 md:gap-10 border bg-card p-8 md:p-10 overflow-hidden transition-all hover:border-brand/50'
              >
                <div className='absolute inset-y-0 left-0 w-1 bg-brand scale-y-0 origin-top transition-transform duration-300 group-hover:scale-y-100' />

                <motion.span
                  variants={fadeUp}
                  className='font-heading font-semibold text-7xl md:text-8xl leading-none text-muted-foreground/15 group-hover:text-brand/20 transition-colors tabular-nums'
                >
                  0{i + 1}
                </motion.span>

                <motion.div variants={fadeUp}>
                  <div className='flex items-center gap-3 mb-3'>
                    <div className='size-11 bg-brand/10 text-brand flex items-center justify-center'>
                      <game.Icon className='size-5' />
                    </div>
                    <span className='flex items-center gap-1.5 text-xs font-mono uppercase tracking-widest text-muted-foreground'>
                      <Users className='size-3.5' />
                      {t("landing:gamesShowcase.playersRange", {
                        min: game.meta.minPlayers,
                        max: game.meta.maxPlayers,
                      })}
                    </span>
                  </div>
                  <h3 className='text-3xl md:text-4xl font-heading font-semibold tracking-tight'>
                    {game.meta.title}
                  </h3>
                  <p className='mt-3 text-muted-foreground leading-relaxed max-w-xl'>
                    {game.meta.description}
                  </p>
                </motion.div>

                <motion.div
                  variants={fadeUp}
                  className='hidden md:flex items-center gap-2 text-sm font-medium text-brand'
                >
                  {t("landing:gamesShowcase.playNowLabel")}
                  <span className='flex size-10 items-center justify-center border border-brand/40 transition-all group-hover:bg-brand group-hover:text-brand-foreground'>
                    <ArrowRight className='size-4 transition-transform group-hover:translate-x-0.5' />
                  </span>
                </motion.div>
              </Link>
            </motion.div>
          ))}
        </div>

        <div className='mt-12 flex justify-center'>
          <Link to='/auth/login'>
            <Button variant='outline' size='lg'>
              {t("landing:gamesShowcase.browseAllGamesButton")}
              <ArrowRight className='size-4 ml-2' />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}

export function SectionHeader({
  eyebrow,
  title,
  subtitle,
  center,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  center?: boolean;
}) {
  return (
    <motion.div
      variants={staggerContainer()}
      initial='hidden'
      whileInView='show'
      viewport={viewport}
      className={center ? "max-w-2xl mx-auto text-center" : "max-w-2xl"}
    >
      <motion.p
        variants={fadeUp}
        className='text-xs font-mono uppercase tracking-widest text-brand mb-3'
      >
        {eyebrow}
      </motion.p>
      <motion.h2
        variants={fadeUp}
        className='text-4xl md:text-6xl font-heading font-semibold tracking-tight leading-[0.95]'
      >
        {title}
      </motion.h2>
      {subtitle && (
        <motion.p variants={fadeUp} className='mt-4 text-lg text-muted-foreground'>
          {subtitle}
        </motion.p>
      )}
    </motion.div>
  );
}
