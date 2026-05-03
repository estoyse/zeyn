import { useQuery } from "@tanstack/react-query";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { authClient } from "@/lib/auth-client";
import { trpc } from "@/utils/trpc";
import {
  Gamepad2,
  Trophy,
  Users,
  History,
  ArrowRight,
  Zap,
  Globe,
  RefreshCw,
  Shield,
  Lock,
  Unlock,
  PlusCircle
} from "lucide-react";
import { useState } from "react";

import { Button } from "@shaxsiy-oyin/ui/components/button";
import { Input } from "@shaxsiy-oyin/ui/components/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@shaxsiy-oyin/ui/components/card";

export const Route = createFileRoute("/dashboard")({
  component: DashboardPage,
  beforeLoad: async () => {
    const session = await authClient.getSession();
    if (!session.data) {
      throw redirect({
        to: "/auth/login",
      });
    }
    return { session: session.data };
  },
});

function DashboardPage() {
  const { session } = Route.useRouteContext();
  const navigate = useNavigate();
  const [roomToJoin, setRoomToJoin] = useState("");

  const publicRoomsQuery = useQuery(trpc.game.getPublicRooms.queryOptions());

  const handleJoinRoom = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!roomToJoin.trim()) return;
    navigate({ to: "/game/$roomId", params: { roomId: roomToJoin.trim() } });
  };

  return (
    <div className='min-h-screen bg-background p-4 md:p-8 lg:p-12'>
      <div className='mx-auto max-w-7xl space-y-12'>
        <header className='flex flex-col md:flex-row justify-between items-start md:items-center gap-6'>
          <div className='space-y-1'>
            <h1 className='text-4xl font-black italic tracking-tighter'>COMMAND CENTER</h1>
            <p className='text-muted-foreground'>Welcome back, {session?.user?.name}. Ready for deployment?</p>
          </div>
          <div className='flex items-center gap-4 bg-muted/30 p-2 rounded-2xl border'>
            <div className='flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-xl border border-primary/20'>
              <Trophy className='size-5 text-primary' />
              <span className='font-bold italic'>4,250 PTS</span>
            </div>
          </div>
        </header>

        <div className='grid gap-8 lg:grid-cols-[1fr_350px]'>
          <div className='space-y-10'>
            {/* Quick Actions */}
            <div className="grid gap-6 md:grid-cols-2">
              <Card className="glass-card group hover:border-primary/50 transition-all cursor-pointer overflow-hidden relative" onClick={() => navigate({ to: "/game/create" })}>
                <div className="absolute top-0 right-0 size-24 bg-primary/5 -mr-8 -mt-8 rounded-full blur-2xl group-hover:bg-primary/20 transition-all" />
                <CardHeader>
                  <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                    <Zap className="size-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl italic font-black">CREATE ARENA</CardTitle>
                  <CardDescription>Setup a custom match with your own rules and subjects.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-all uppercase font-bold tracking-widest text-xs">
                    Configure Match
                    <ArrowRight className="size-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </CardContent>
              </Card>

              <Card className="glass-card group hover:border-secondary/50 transition-all">
                <CardHeader>
                  <div className="size-12 rounded-xl bg-secondary/10 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                    <PlusCircle className="size-6 text-secondary-foreground" />
                  </div>
                  <CardTitle className="text-xl italic font-black">JOIN VIA ID</CardTitle>
                  <CardDescription>Have a secret code? Enter the arena directly.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <form onSubmit={handleJoinRoom} className="flex gap-2">
                    <Input 
                      placeholder="Enter Room ID..." 
                      value={roomToJoin}
                      onChange={(e) => setRoomToJoin(e.target.value)}
                      className="bg-background/50 h-11"
                    />
                    <Button type="submit" className="h-11 px-6 font-bold" disabled={!roomToJoin}>JOIN</Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Public Rooms Section */}
            <section className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-black italic tracking-tight flex items-center gap-3">
                  <Globe className="size-6 text-primary" />
                  PUBLIC ARENAS
                </h3>
                <Button variant="ghost" size="sm" onClick={() => publicRoomsQuery.refetch()} className="text-xs uppercase font-bold tracking-widest">
                  <RefreshCw className={`size-3 mr-2 ${publicRoomsQuery.isFetching ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>

              {publicRoomsQuery.isLoading ? (
                <div className="grid gap-6 sm:grid-cols-2">
                  {[1,2,3,4].map(i => <div key={i} className="h-40 bg-muted/30 animate-pulse rounded-2xl border border-dashed" />)}
                </div>
              ) : publicRoomsQuery.data?.length === 0 ? (
                <div className="p-16 text-center border-2 border-dashed rounded-3xl bg-muted/10">
                  <Gamepad2 className="size-12 text-muted-foreground/30 mx-auto mb-4" />
                  <p className="text-muted-foreground italic font-medium">No public matches currently waiting.</p>
                  <Button variant="link" onClick={() => navigate({ to: "/game/create" })} className="mt-2 text-primary font-bold">
                    BE THE FIRST TO HOST
                  </Button>
                </div>
              ) : (
                <div className="grid gap-6 sm:grid-cols-2">
                  {publicRoomsQuery.data?.map((room) => (
                    <Card key={room.id} className="glass-card hover:border-primary/50 transition-all group overflow-hidden relative">
                      <div className="absolute top-0 right-0 p-3">
                        {room.password ? (
                          <div className="bg-destructive/10 text-destructive p-1.5 rounded-lg border border-destructive/20">
                            <Lock className="size-3" />
                          </div>
                        ) : (
                          <div className="bg-green-500/10 text-green-500 p-1.5 rounded-lg border border-green-500/20">
                            <Unlock className="size-3" />
                          </div>
                        )}
                      </div>
                      <CardHeader className="p-6">
                        <CardTitle className="text-xl font-bold line-clamp-1 pr-8 uppercase tracking-tight">{room.name}</CardTitle>
                        <CardDescription className="text-xs font-medium flex items-center gap-2 opacity-70 mt-1">
                          <Shield className="size-3" /> HOST: {room.hostId === session?.user?.id ? 'YOU' : 'COMMANDER'}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="p-6 pt-0 space-y-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 text-xs font-bold opacity-60">
                            <div className="flex items-center gap-1.5">
                              <Users className="size-4" />
                              <span>CAPACITY: {room.maxPlayers}</span>
                            </div>
                          </div>
                          <div className="px-3 py-1 bg-primary/10 text-primary rounded-full text-[10px] font-black tracking-tighter border border-primary/20">
                            STATUS: {room.status.toUpperCase()}
                          </div>
                        </div>
                        <Button 
                          className="w-full h-12 font-black italic tracking-widest text-xs shadow-lg shadow-primary/5" 
                          variant={room.password ? "outline" : "default"}
                          onClick={() => navigate({ to: "/game/$roomId", params: { roomId: room.id } })}
                        >
                          ENTER ARENA
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </section>
          </div>

          <aside className='space-y-8 h-fit sticky top-8'>
            <Card className='glass-card bg-primary/5 border-primary/20 overflow-hidden relative'>
              <div className='absolute top-0 right-0 size-32 bg-primary/10 blur-3xl -mr-16 -mt-16' />
              <CardHeader className='pb-2'>
                <CardTitle className='text-lg flex items-center gap-2 italic'>
                  <History className='size-5 text-primary' />
                  YOUR DEPLOYMENTS
                </CardTitle>
              </CardHeader>
              <CardContent className='p-6 space-y-4'>
                <p className='text-xs text-muted-foreground italic'>Log into your previous match reports.</p>
                <div className='space-y-2'>
                  {[1, 2].map(i => (
                    <div key={i} className='p-3 rounded-xl bg-muted/40 border text-xs font-medium flex justify-between items-center group cursor-pointer hover:bg-muted transition-colors'>
                      <span className='opacity-70'>#0042{i} - GALAXY ARENA</span>
                      <ArrowRight className='size-3 opacity-0 group-hover:opacity-100 transition-all' />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>
    </div>
  );
}
