import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { History } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@shaxsiy-oyin/ui/components/card";
import { Skeleton } from "@shaxsiy-oyin/ui/components/skeleton";
import { getClientGame } from "@/features/games/registry";
import { trpc } from "@/shared/lib/trpc";
import { JoinByIdCard } from "./JoinByIdCard";
import { LeaderboardPlaceholder } from "./LeaderboardPlaceholder";

export function Sidebar() {
  const recentGamesQuery = useQuery(
    trpc.game.getMyRecentGames.queryOptions({ limit: 5 })
  );
  const items = recentGamesQuery.data?.items;

  return (
    <aside className='space-y-6 h-fit sticky top-6'>
      <JoinByIdCard />

      <Card>
        <CardHeader className='pb-2'>
          <CardTitle className='text-base flex items-center gap-2'>
            <History className='size-4' />
            Recent Games
          </CardTitle>
          <CardDescription className='text-xs'>
            View your game history and results.
          </CardDescription>
        </CardHeader>
        <CardContent className='p-4 space-y-2'>
          {recentGamesQuery.isLoading ? (
            <div className='space-y-2'>
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className='h-10' />
              ))}
            </div>
          ) : items?.length === 0 ? (
            <div className='text-xs text-muted-foreground text-center py-4'>
              No games played yet.
            </div>
          ) : (
            items?.map(item => {
              const game = getClientGame(item.gameType);
              return (
                <Link
                  key={item.historyId}
                  to='/game/$gameId'
                  params={{ gameId: item.gameId }}
                  className='flex items-center justify-between gap-2 p-2 -mx-2 hover:bg-muted/50 transition-colors'
                >
                  <div className='min-w-0'>
                    <p className='text-sm font-medium truncate'>
                      {item.roomName ?? game?.meta.title ?? item.gameType}
                    </p>
                    <p className='text-xs text-muted-foreground'>
                      {new Date(item.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span className='text-sm font-bold text-brand shrink-0'>
                    {item.score}
                  </span>
                </Link>
              );
            })
          )}
        </CardContent>
      </Card>

      <LeaderboardPlaceholder />
    </aside>
  );
}
