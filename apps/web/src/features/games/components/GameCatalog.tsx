import { Link } from "@tanstack/react-router";
import { ArrowRight, Users } from "lucide-react";
import { Button } from "@zeyn/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@zeyn/ui/components/card";
import { listClientGames } from "@/features/games/registry";

interface GameCatalogProps {
  variant?: "create" | "play";
}

export function GameCatalog({ variant = "create" }: GameCatalogProps) {
  const games = listClientGames();

  return (
    <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
      {games.map(game => (
        <Card
          key={game.type}
          className='group flex flex-col hover:ring-brand/50 transition-all'
        >
          <CardHeader>
            <div className='size-10 bg-brand/10 text-brand flex items-center justify-center mb-2'>
              <game.Icon className='size-5' />
            </div>
            <CardTitle className='text-lg'>{game.meta.title}</CardTitle>
            <CardDescription>{game.meta.description}</CardDescription>
          </CardHeader>
          <CardContent className='mt-auto space-y-3'>
            <div className='flex items-center gap-1 text-xs text-muted-foreground'>
              <Users className='size-3' />
              <span>
                {game.meta.minPlayers}-{game.meta.maxPlayers} players
              </span>
            </div>
            {variant === "play" ? (
              <Link
                to='/games/$gameType'
                params={{ gameType: game.type }}
                className='block'
              >
                <Button variant='outline' className='w-full'>
                  Play
                  <ArrowRight className='size-4 ml-2' />
                </Button>
              </Link>
            ) : (
              <Link
                to='/game/create/$gameType'
                params={{ gameType: game.type }}
                className='block'
              >
                <Button variant='outline' className='w-full'>
                  Create
                  <ArrowRight className='size-4 ml-2' />
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
