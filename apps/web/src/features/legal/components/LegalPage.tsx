import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Header } from "@/features/landing/components/Header";

type LegalSection = {
  heading: string;
  body?: string[];
  items?: string[];
  note?: string;
};

type LegalDoc = "privacy" | "terms";

export function LegalPage({ doc }: { doc: LegalDoc }) {
  const { t } = useTranslation();
  const sections = t(`legal:${doc}.sections`, { returnObjects: true }) as LegalSection[];

  return (
    <div className='min-h-svh'>
      <Header />
      <main className='max-w-3xl mx-auto px-6 py-16 space-y-12'>
        <div className='space-y-3'>
          <h1 className='font-heading text-3xl md:text-4xl'>{t(`legal:${doc}.title`)}</h1>
          <p className='text-xs uppercase tracking-widest text-muted-foreground'>
            {t("legal:common.lastUpdated", { date: t(`legal:${doc}.date`) })}
          </p>
          <p className='text-muted-foreground leading-relaxed'>{t(`legal:${doc}.intro`)}</p>
        </div>

        <div className='space-y-10'>
          {sections.map(section => (
            <section key={section.heading} className='space-y-3'>
              <h2 className='font-heading text-lg text-foreground'>{section.heading}</h2>
              {section.body?.map(paragraph => (
                <p key={paragraph} className='text-muted-foreground leading-relaxed'>
                  {paragraph}
                </p>
              ))}
              {section.items && (
                <ul className='space-y-2 pl-5 list-disc marker:text-muted-foreground'>
                  {section.items.map(item => (
                    <li key={item} className='text-muted-foreground leading-relaxed'>
                      {item}
                    </li>
                  ))}
                </ul>
              )}
              {section.note && (
                <p className='text-muted-foreground leading-relaxed'>{section.note}</p>
              )}
            </section>
          ))}
        </div>

        <div className='border-t border-border pt-8'>
          <Link to='/home' className='text-sm text-brand hover:underline'>
            {t("legal:common.backHome")}
          </Link>
        </div>
      </main>
    </div>
  );
}
