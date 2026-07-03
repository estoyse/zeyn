import { Link } from "@tanstack/react-router";
import { Trophy, Users } from "lucide-react";
import { getClientGame } from "@/features/games/registry";

interface ProfileGameItem {
  historyId: string;
  gameId: string;
  gameType: string;
  roomName: string | null;
  createdAt: Date | string | number;
  playerCount: number;
  score?: number;
}

interface ProfileGamesListProps {
  items: ProfileGameItem[];
  emptyLabel: string;
}

export function ProfileGamesList({ items, emptyLabel }: ProfileGamesListProps) {
  if (items.length === 0) {
    return (
      <div className='p-8 text-center border-2 border-dashed bg-muted/40'>
        <p className='text-sm text-muted-foreground'>{emptyLabel}</p>
      </div>
    );
  }

  return (
    <div className='border divide-y'>
      {items.map(item => {
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
              {typeof item.score === "number" && (
                <div className='flex items-center gap-1 font-bold text-brand'>
                  <Trophy className='size-3' />
                  <span>{item.score}</span>
                </div>
              )}
            </div>
          </Link>
        );
      })}
    </div>
  );
}
