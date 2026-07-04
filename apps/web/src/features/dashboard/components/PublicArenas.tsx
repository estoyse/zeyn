import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { trpc } from "@/shared/lib/trpc";
import type { GameType } from "@zeyn/api/games";
import { Globe, RefreshCw, Gamepad2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@zeyn/ui/components/button";
import { Skeleton } from "@zeyn/ui/components/skeleton";
import { RoomCard } from "./RoomCard";

interface PublicArenasProps {
  userId?: string;
  gameType?: string;
  title?: string;
}

export function PublicArenas({ userId, gameType, title }: PublicArenasProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const displayTitle = title ?? t("dashboard:publicArenas.defaultTitle");
  const publicRoomsQuery = useQuery(
    trpc.game.getPublicRooms.queryOptions({
      gameType: gameType as GameType | undefined,
    })
  );
  const rooms = publicRoomsQuery.data;

  return (
    <section className='space-y-6'>
      <div className='flex items-center justify-between'>
        <h3 className='text-xl font-bold flex items-center gap-3'>
          <Globe className='size-5' />
          {displayTitle}
        </h3>
        <Button
          variant='ghost'
          size='sm'
          onClick={() => publicRoomsQuery.refetch()}
          className='text-xs'
        >
          <RefreshCw
            className={`size-3 mr-2 ${
              publicRoomsQuery.isFetching ? "animate-spin" : ""
            }`}
          />
          {t("dashboard:publicArenas.refresh")}
        </Button>
      </div>

      {publicRoomsQuery.isLoading ? (
        <div className='grid gap-4 sm:grid-cols-2'>
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className='h-32' />
          ))}
        </div>
      ) : rooms?.length === 0 ? (
        <div className='p-12 text-center border-2 border-dashed bg-muted/50'>
          <Gamepad2 className='size-10 text-muted-foreground mx-auto mb-3' />
          <p className='text-muted-foreground'>
            {t("dashboard:publicArenas.emptyTitle")}
          </p>
          <Button
            variant='link'
            onClick={() =>
              gameType
                ? navigate({ to: "/game/create/$gameType", params: { gameType } })
                : navigate({ to: "/game/create" })
            }
            className='mt-2'
          >
            {t("dashboard:publicArenas.createGame")}
          </Button>
        </div>
      ) : (
        <div className='grid gap-4 sm:grid-cols-2'>
          {rooms?.map(room => (
            <RoomCard
              key={room.id}
              room={room}
              isHost={room.hostId === userId}
              onJoin={() =>
                navigate({ to: "/game/$gameId", params: { gameId: room.id } })
              }
            />
          ))}
        </div>
      )}
    </section>
  );
}
