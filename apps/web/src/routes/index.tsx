import { FeaturedGames } from "@/features/landing/components/FeaturedGames";
import { createFileRoute } from "@tanstack/react-router";
import { Stats } from "@/features/landing/components/Stats";

import { Hero } from "@/features/landing/components/Hero";
import { Terminal } from "@/features/landing/components/Terminal";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: HomeComponent,
});

function HomeComponent() {
  return (
    <div className="min-h-screen">
      <Hero />
      <Terminal />
      <Stats />
      <FeaturedGames />

      <footer className="border-t mt-20">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Shaxsiy O'yin</h4>
              <p className="text-sm text-muted-foreground">
                Premium online trivia games platform
              </p>
            </div>
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Games</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <Link to="/dashboard" className="block hover:text-foreground transition-colors">
                  Browse Games
                </Link>
                <span className="block hover:text-foreground transition-colors opacity-50 cursor-not-allowed">
                  Tournaments
                </span>
                <span className="block hover:text-foreground transition-colors opacity-50 cursor-not-allowed">
                  Leaderboard
                </span>
              </div>
            </div>
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Company</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <span className="block hover:text-foreground transition-colors opacity-50 cursor-not-allowed">
                  About Us
                </span>
                <span className="block hover:text-foreground transition-colors opacity-50 cursor-not-allowed">
                  Blog
                </span>
                <span className="block hover:text-foreground transition-colors opacity-50 cursor-not-allowed">
                  Contact
                </span>
              </div>
            </div>
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Social</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <a href="#" className="block hover:text-foreground transition-colors">
                  Twitter
                </a>
                <a href="#" className="block hover:text-foreground transition-colors">
                  Discord
                </a>
                <a href="#" className="block hover:text-foreground transition-colors">
                  GitHub
                </a>
              </div>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t text-center text-sm text-muted-foreground">
            © 2026 Shaxsiy O'yin. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}