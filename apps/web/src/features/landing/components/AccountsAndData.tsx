import { motion } from "framer-motion";
import { Link } from "@tanstack/react-router";
import { KeyRound, ShieldCheck, UserCircle2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { SectionHeader } from "@/features/landing/components/GamesShowcase";
import { fadeUp, viewport } from "@/features/landing/lib/motion";

const CARDS = [
  { id: "whatWeAsk", icon: UserCircle2 },
  { id: "whyWeNeedIt", icon: KeyRound },
  { id: "whatWeNeverTouch", icon: ShieldCheck },
] as const;

export function AccountsAndData() {
  const { t } = useTranslation();

  return (
    <section id='accounts' className='scroll-mt-24 border-t'>
      <div className='max-w-7xl mx-auto px-6 py-24 md:py-32'>
        <SectionHeader
          eyebrow={t("landing:accountsAndData.eyebrow")}
          title={t("landing:accountsAndData.title")}
        />

        <p className='mt-6 max-w-3xl text-muted-foreground leading-relaxed'>
          {t("landing:accountsAndData.intro")}
        </p>

        <div className='mt-14 grid gap-6 md:grid-cols-3'>
          {CARDS.map(card => (
            <motion.div
              key={card.id}
              variants={fadeUp}
              initial='hidden'
              whileInView='show'
              viewport={viewport}
              className='border bg-card p-6'
            >
              <div className='flex size-12 items-center justify-center border text-brand'>
                <card.icon className='size-5' />
              </div>
              <h3 className='mt-5 text-lg font-heading font-semibold tracking-tight'>
                {t(`landing:accountsAndData.cards.${card.id}.title`)}
              </h3>
              <p className='mt-2 text-sm text-muted-foreground leading-relaxed'>
                {t(`landing:accountsAndData.cards.${card.id}.description`)}
              </p>
            </motion.div>
          ))}
        </div>

        <p className='mt-10 text-sm text-muted-foreground'>
          {t("landing:accountsAndData.privacyNote")}{" "}
          <Link to='/legal/privacy' className='text-brand underline underline-offset-4'>
            {t("legal:common.privacyLink")}
          </Link>
        </p>
      </div>
    </section>
  );
}
