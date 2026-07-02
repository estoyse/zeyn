import { Link } from "@tanstack/react-router";
import { ArrowRight, Users } from "lucide-react";
import { Button } from "@shaxsiy-oyin/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@shaxsiy-oyin/ui/components/card";
import { listClientGames } from "@/features/games/registry";

export function GameCatalog() {
  const games = listClientGames();

  return (
    <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
      {games.map(game => (
        <Card
          key={game.type}
          className='group flex flex-col hover:border-primary/50 transition-all'
        >
          <CardHeader>
            <div className='size-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform'>
              <game.Icon className='size-5 text-primary' />
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
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
