import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { trpc } from "@/utils/trpc";
import {
  Globe,
  RefreshCw,
  Gamepad2,
  Lock,
  Unlock,
  Shield,
  Users,
} from "lucide-react";
import { Button } from "@shaxsiy-oyin/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@shaxsiy-oyin/ui/components/card";

interface PublicArenasProps {
  userId?: string;
}

export function PublicArenas({ userId }: PublicArenasProps) {
  const navigate = useNavigate();
  const publicRoomsQuery = useQuery(trpc.game.getPublicRooms.queryOptions());

  return (
    <section className='space-y-6'>
      <div className='flex items-center justify-between'>
        <h3 className='text-2xl font-black italic tracking-tight flex items-center gap-3'>
          <Globe className='size-6 text-primary' />
          PUBLIC ARENAS
        </h3>
        <Button
          variant='ghost'
          size='sm'
          onClick={() => publicRoomsQuery.refetch()}
          className='text-xs uppercase font-bold tracking-widest'
        >
          <RefreshCw
            className={`size-3 mr-2 ${publicRoomsQuery.isFetching ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      {publicRoomsQuery.isLoading ? (
        <div className='grid gap-6 sm:grid-cols-2'>
          {[1, 2, 3, 4].map(i => (
            <div
              key={i}
              className='h-40 bg-muted/30 animate-pulse rounded-2xl border border-dashed'
            />
          ))}
        </div>
      ) : publicRoomsQuery.data?.length === 0 ? (
        <div className='p-16 text-center border-2 border-dashed rounded-3xl bg-muted/10'>
          <Gamepad2 className='size-12 text-muted-foreground/30 mx-auto mb-4' />
          <p className='text-muted-foreground italic font-medium'>
            No public matches currently waiting.
          </p>
          <Button
            variant='link'
            onClick={() => navigate({ to: "/game/create" })}
            className='mt-2 text-primary font-bold'
          >
            BE THE FIRST TO HOST
          </Button>
        </div>
      ) : (
        <div className='grid gap-6 sm:grid-cols-2'>
          {publicRoomsQuery.data?.map(room => (
            <Card
              key={room.id}
              className='glass-card hover:border-primary/50 transition-all group overflow-hidden relative'
            >
              <div className='absolute top-0 right-0 p-3'>
                {room.password ? (
                  <div className='bg-destructive/10 text-destructive p-1.5 rounded-lg border border-destructive/20'>
                    <Lock className='size-3' />
                  </div>
                ) : (
                  <div className='bg-green-500/10 text-green-500 p-1.5 rounded-lg border border-green-500/20'>
                    <Unlock className='size-3' />
                  </div>
                )}
              </div>
              <CardHeader className='p-6'>
                <CardTitle className='text-xl font-bold line-clamp-1 pr-8 uppercase tracking-tight'>
                  {room.name}
                </CardTitle>
                <CardDescription className='text-xs font-medium flex items-center gap-2 opacity-70 mt-1'>
                  <Shield className='size-3' /> HOST:{" "}
                  {room.hostId === userId ? "YOU" : "COMMANDER"}
                </CardDescription>
              </CardHeader>
              <CardContent className='p-6 pt-0 space-y-6'>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-4 text-xs font-bold opacity-60'>
                    <div className='flex items-center gap-1.5'>
                      <Users className='size-4' />
                      <span>CAPACITY: {room.maxPlayers}</span>
                    </div>
                  </div>
                  <div className='px-3 py-1 bg-primary/10 text-primary rounded-full text-[10px] font-black tracking-tighter border border-primary/20'>
                    STATUS: {room.status.toUpperCase()}
                  </div>
                </div>
                <Button
                  className='w-full h-12 font-black italic tracking-widest text-xs shadow-lg shadow-primary/5'
                  variant={room.password ? "outline" : "default"}
                  onClick={() =>
                    navigate({
                      to: "/game/$roomId",
                      params: { roomId: room.id },
                    })
                  }
                >
                  ENTER ARENA
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}
