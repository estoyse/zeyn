import { FeaturedGames } from "@/components/landing/FeaturedGames";
import { createFileRoute } from "@tanstack/react-router";
import { Stats } from "@/components/landing/Stats";

import { Hero } from "@/components/landing/Hero";
import { Terminal } from "@/components/landing/Terminal";

export const Route = createFileRoute("/landing/")({
  component: HomeComponent,
});

export default function HomeComponent() {
  return (
    <div className='min-h-screen'>
      <Hero />
      <Terminal />
      <Stats />
      <FeaturedGames />

      <footer className='border-t border-black/10 mt-20'>
        <div className='max-w-6xl mx-auto px-6 py-12'>
          <div className='grid md:grid-cols-4 gap-8'>
            <div className='space-y-3'>
              <h4 className='text-sm'>Shaxsiy O'yin</h4>
              <p className='text-sm text-muted-foreground'>
                Premium onlayn o'yinlar platformasi
              </p>
            </div>
            <div className='space-y-3'>
              <h4 className='text-sm'>O'yinlar</h4>
              <div className='space-y-2 text-sm text-muted-foreground'>
                <a
                  href='#'
                  className='block hover:text-foreground transition-colors'
                >
                  Aksion
                </a>
                <a
                  href='#'
                  className='block hover:text-foreground transition-colors'
                >
                  Strategiya
                </a>
                <a
                  href='#'
                  className='block hover:text-foreground transition-colors'
                >
                  Poyga
                </a>
              </div>
            </div>
            <div className='space-y-3'>
              <h4 className='text-sm'>Jamoa</h4>
              <div className='space-y-2 text-sm text-muted-foreground'>
                <a
                  href='#'
                  className='block hover:text-foreground transition-colors'
                >
                  Biz haqimizda
                </a>
                <a
                  href='#'
                  className='block hover:text-foreground transition-colors'
                >
                  Blog
                </a>
                <a
                  href='#'
                  className='block hover:text-foreground transition-colors'
                >
                  Aloqa
                </a>
              </div>
            </div>
            <div className='space-y-3'>
              <h4 className='text-sm'>Ijtimoiy</h4>
              <div className='space-y-2 text-sm text-muted-foreground'>
                <a
                  href='#'
                  className='block hover:text-foreground transition-colors'
                >
                  Telegram
                </a>
                <a
                  href='#'
                  className='block hover:text-foreground transition-colors'
                >
                  Instagram
                </a>
                <a
                  href='#'
                  className='block hover:text-foreground transition-colors'
                >
                  YouTube
                </a>
              </div>
            </div>
          </div>
          <div className='mt-12 pt-8 border-t border-black/10 text-center text-sm text-muted-foreground'>
            © 2026 Shaxsiy O'yin. Barcha huquqlar himoyalangan.
          </div>
        </div>
      </footer>
    </div>
  );
}
