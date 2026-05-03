import { Link } from "@tanstack/react-router";
import { Button } from "@shaxsiy-oyin/ui/components/button";

export function Hero() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-20 md:py-32">
      <div className="max-w-4xl mx-auto text-center space-y-8">
        <div className="inline-block">
          <div className="px-3 py-1 border border-primary/30 bg-primary/5 text-primary text-xs tracking-wide uppercase rounded">
            Premium Online Games
          </div>
        </div>

        <h1 className="text-5xl md:text-7xl lg:text-8xl tracking-tight font-heading">
          The Ultimate Trivia Experience
        </h1>

        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed font-sans">
          Challenge your knowledge with friends in real-time quiz battles.
          Compete in multiple categories, climb the leaderboard, and become
          the champion!
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Link to="/auth/login">
            <Button size="lg">
              Get Started
            </Button>
          </Link>
          <Button variant="outline" size="lg">
            How It Works
          </Button>
        </div>

        <p className="text-sm text-muted-foreground pt-4">
          Play with AI-powered matchmaking
        </p>
      </div>
    </div>
  );
}