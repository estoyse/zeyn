import { Card, CardContent, CardHeader, CardTitle } from "@shaxsiy-oyin/ui/components/card";
import { Link } from "@tanstack/react-router";
import { Button } from "@shaxsiy-oyin/ui/components/button";
import { Trophy, Users, Zap } from "lucide-react";

export function FeaturedGames() {
  const features = [
    {
      title: "Tournaments",
      description:
        "Compete in daily and weekly tournaments with real-time leaderboards and exciting prizes.",
      icon: Trophy,
    },
    {
      title: "Multiplayer",
      description:
        "Play with friends or challenge new opponents. Create private rooms for custom games.",
      icon: Users,
    },
    {
      title: "Real-time Action",
      description:
        "Fast-paced trivia with buzzers, timers, and instant scoring. No waiting!",
      icon: Zap,
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-6 py-20">
      <div className="text-center space-y-4 mb-12">
        <h2 className="text-3xl md:text-4xl font-bold">Why Play With Us?</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Experience the most engaging trivia platform with unique game modes,
          competitive rankings, and a thriving community.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {features.map((feature, index) => (
          <Card key={index}>
            <CardHeader>
              <feature.icon className="w-10 h-10 text-primary mb-2" />
              <CardTitle>{feature.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="text-center mt-12">
        <Link to="/auth/login">
          <Button variant="brand" size="lg">
            Start Playing Now
          </Button>
        </Link>
      </div>
    </div>
  );
}