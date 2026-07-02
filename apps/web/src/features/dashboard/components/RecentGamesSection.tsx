import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import type { GameType } from "@zeyn/api/games";
import { History, Trophy, Users } from "lucide-react";
import { Skeleton } from "@zeyn/ui/components/skeleton";
import { getClientGame } from "@/features/games/registry";
import { trpc } from "@/shared/lib/trpc";

interface RecentGamesSectionProps {
  gameType?: string;
}

export function RecentGamesSection({ gameType }: RecentGamesSectionProps) {
  const recentGamesQuery = useQuery(
    trpc.game.getMyRecentGames.queryOptions({
      gameType: gameType as GameType | undefined,
    })
  );
  const items = recentGamesQuery.data?.items;

  return (
    <section className='space-y-6'>
      <h3 className='text-xl font-bold flex items-center gap-3'>
        <History className='size-5' />
        Recent Games
      </h3>

      {recentGamesQuery.isLoading ? (
        <div className='space-y-3'>
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className='h-16' />
          ))}
        </div>
      ) : items?.length === 0 ? (
        <div className='p-12 text-center border-2 border-dashed bg-muted/50'>
          <History className='size-10 text-muted-foreground mx-auto mb-3' />
          <p className='text-muted-foreground'>No games played yet.</p>
        </div>
      ) : (
        <div className='border divide-y'>
          {items?.map(item => {
            const game = getClientGame(item.gameType);
            return (
              <Link
                key={item.historyId}
                to='/game/$gameId'
                params={{ gameId: item.gameId }}
                className='flex items-center justify-between gap-4 p-4 hover:bg-muted/50 transition-colors'
              >
                <div className='min-w-0'>
                  <p className='font-medium truncate'>
                    {item.roomName ?? game?.meta.title ?? item.gameType}
                  </p>
                  <p className='text-xs text-muted-foreground'>
                    {new Date(item.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className='flex items-center gap-4 text-sm shrink-0'>
                  <div className='flex items-center gap-1 text-muted-foreground'>
                    <Users className='size-3' />
                    <span>{item.playerCount}</span>
                  </div>
                  <div className='flex items-center gap-1 font-bold text-brand'>
                    <Trophy className='size-3' />
                    <span>{item.score}</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
