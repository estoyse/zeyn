import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@zeyn/ui/components/button";
import { EASE, viewport } from "@/features/landing/lib/motion";

export function CTA() {
  const { t } = useTranslation();
  return (
    <section className='border-t relative overflow-hidden'>
      <div
        aria-hidden
        className='pointer-events-none absolute left-1/2 -top-20 h-96 w-[60rem] max-w-[130vw] -translate-x-1/2 bg-brand/15 blur-[120px]'
      />
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={viewport}
        transition={{ duration: 0.7, ease: EASE }}
        className='relative max-w-5xl mx-auto px-6 py-28 md:py-36 text-center'
      >
        <p className='text-xs font-mono uppercase tracking-widest text-brand mb-5'>
          {t("landing:cta.eyebrow")}
        </p>
        <h2 className='font-heading font-semibold uppercase tracking-tight leading-[0.9] text-5xl sm:text-6xl md:text-7xl lg:text-8xl'>
          <span className='block'>{t("landing:cta.titleLine1")}</span>
          <span
            className='block'
            style={{ WebkitTextStroke: "2px var(--brand)", color: "transparent" }}
          >
            {t("landing:cta.titleLine2")}
          </span>
        </h2>
        <p className='mt-6 text-lg text-muted-foreground max-w-xl mx-auto'>
          {t("landing:cta.subtitle")}
        </p>
        <div className='mt-10 flex flex-col sm:flex-row items-center justify-center gap-4'>
          <Link to='/auth/login'>
            <Button variant='brand' size='lg' className='group w-full sm:w-auto'>
              {t("landing:cta.startPlayingButton")}
              <ArrowRight className='size-4 ml-2 transition-transform group-hover:translate-x-1' />
            </Button>
          </Link>
          <Link to='/auth/login'>
            <Button variant='outline' size='lg' className='w-full sm:w-auto'>
              {t("landing:cta.exploreGamesButton")}
            </Button>
          </Link>
        </div>
      </motion.div>
    </section>
  );
}
