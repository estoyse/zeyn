import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { LogoLockup } from "@zeyn/ui/components/logo";
import { Header } from "@/features/landing/components/Header";
import { Hero } from "@/features/landing/components/Hero";
import { Marquee } from "@/features/landing/components/Marquee";
import { PlayableRound } from "@/features/landing/components/PlayableRound";
import { GamesShowcase } from "@/features/landing/components/GamesShowcase";
import { HowItWorks } from "@/features/landing/components/HowItWorks";
import { BentoFeatures } from "@/features/landing/components/BentoFeatures";
import { Stats } from "@/features/landing/components/Stats";
import { CTA } from "@/features/landing/components/CTA";
import { ScrollProgress } from "@/features/landing/components/ScrollProgress";

export const Route = createFileRoute("/home")({
  component: HomeComponent,
});

function useFooterSections() {
  const { t } = useTranslation();
  return [
    {
      heading: t("landing:footer.sections.games.heading"),
      links: [
        { label: t("landing:footer.sections.games.browseGames"), to: "/auth/login" as const },
        { label: t("landing:footer.sections.games.tournaments"), disabled: true },
        { label: t("landing:footer.sections.games.leaderboard"), disabled: true },
      ],
    },
    {
      heading: t("landing:footer.sections.company.heading"),
      links: [
        { label: t("landing:footer.sections.company.aboutUs"), disabled: true },
        { label: t("landing:footer.sections.company.blog"), disabled: true },
        { label: t("landing:footer.sections.company.contact"), disabled: true },
      ],
    },
    {
      heading: t("landing:footer.sections.social.heading"),
      links: [
        { label: t("landing:footer.sections.social.twitter"), href: "#" },
        { label: t("landing:footer.sections.social.discord"), href: "#" },
        { label: t("landing:footer.sections.social.github"), href: "#" },
      ],
    },
  ];
}

function HomeComponent() {
  return (
    <div className='min-h-svh'>
      <Header />
      <ScrollProgress />
      <Hero />
      <Marquee />
      <PlayableRound />
      <GamesShowcase />
      <BentoFeatures />
      <HowItWorks />
      <Stats />
      <CTA />
      <Footer />
    </div>
  );
}

function Footer() {
  const { t } = useTranslation();
  const footerSections = useFooterSections();

  return (
    <footer className='border-t'>
      <div className='max-w-7xl mx-auto px-6 py-14'>
        <div className='grid gap-10 md:grid-cols-4'>
          <div className='space-y-3'>
            <Link to='/home'>
              <LogoLockup size='sm' />
            </Link>
            <p className='text-sm text-muted-foreground max-w-xs'>
              {t("landing:footer.description")}
            </p>
          </div>

          {footerSections.map(section => (
            <div key={section.heading} className='space-y-3'>
              <h4 className='text-xs font-mono uppercase tracking-widest text-muted-foreground'>
                {section.heading}
              </h4>
              <div className='space-y-2 text-sm'>
                {section.links.map(link => {
                  if ("to" in link && link.to) {
                    return (
                      <Link
                        key={link.label}
                        to={link.to}
                        className='block text-muted-foreground hover:text-foreground transition-colors'
                      >
                        {link.label}
                      </Link>
                    );
                  }
                  if ("href" in link && link.href) {
                    return (
                      <a
                        key={link.label}
                        href={link.href}
                        className='block text-muted-foreground hover:text-foreground transition-colors'
                      >
                        {link.label}
                      </a>
                    );
                  }
                  return (
                    <span
                      key={link.label}
                      className='block text-muted-foreground/50 cursor-not-allowed'
                    >
                      {link.label}
                    </span>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className='mt-12 pt-8 border-t text-center text-sm text-muted-foreground'>
          {t("landing:footer.copyright", { year: new Date().getFullYear() })}
        </div>
      </div>
    </footer>
  );
}
