import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { trpc } from "@/utils/trpc";
import { Globe, RefreshCw, Gamepad2, Lock, Unlock, Users } from "lucide-react";
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
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold flex items-center gap-3">
          <Globe className="size-5" />
          Public Rooms
        </h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => publicRoomsQuery.refetch()}
          className="text-xs"
        >
          <RefreshCw
            className={`size-3 mr-2 ${publicRoomsQuery.isFetching ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      {publicRoomsQuery.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-32 bg-muted/30 animate-pulse rounded-xl border border-dashed"
            />
          ))}
        </div>
      ) : publicRoomsQuery.data?.length === 0 ? (
        <div className="p-12 text-center border-2 border-dashed rounded-xl bg-muted/10">
          <Gamepad2 className="size-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground">No public rooms available.</p>
          <Button variant="link" onClick={() => navigate({ to: "/game/create" })} className="mt-2">
            Create a Game
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {publicRoomsQuery.data?.map((room) => (
            <Card key={room.id} className="hover:border-primary/50 transition-all relative">
              {room.password ? (
                <div className="absolute top-2 right-2 text-destructive">
                  <Lock className="size-4" />
                </div>
              ) : (
                <div className="absolute top-2 right-2 text-green-500">
                  <Unlock className="size-4" />
                </div>
              )}
              <CardHeader className="p-4 pr-10">
                <CardTitle className="text-lg font-semibold line-clamp-1">
                  {room.name}
                </CardTitle>
                <CardDescription className="text-xs flex items-center gap-1">
                  Host: {room.hostId === userId ? "You" : "Host"}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 pt-0 space-y-4">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1">
                    <Users className="size-3" />
                    <span>{room.maxPlayers} players</span>
                  </div>
                  <div className="px-2 py-0.5 bg-primary/10 text-primary rounded text-xs font-medium">
                    {room.status}
                  </div>
                </div>
                <Button
                  className="w-full"
                  variant={room.password ? "outline" : "default"}
                  size="sm"
                  onClick={() =>
                    navigate({
                      to: "/game/$roomId",
                      params: { roomId: room.id },
                    })
                  }
                >
                  Join Game
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}