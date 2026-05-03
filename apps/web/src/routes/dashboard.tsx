import { useMutation } from "@tanstack/react-query";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { authClient } from "@/lib/auth-client";
import { trpc } from "@/utils/trpc";
import {
  Plus,
  Gamepad2,
  Trophy,
  Users,
  History,
  ArrowRight,
  Search,
  LayoutGrid,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

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
      redirect({
        to: "/auth/login",
        throw: true,
      });
    }
    return { session };
  },
});

function DashboardPage() {
  const { session } = Route.useRouteContext();
  const navigate = useNavigate();
  const [roomToJoin, setRoomToJoin] = useState("");

  const createRoomMutation = useMutation(
    trpc.game.createRoom.mutationOptions()
  );

  const handleCreateRoom = async () => {
    try {
      const { roomId } = await createRoomMutation.mutateAsync({
        name: "My Game",
      });
      navigate({ to: `/game/${roomId}` });
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Failed to create room";
      toast.error(message);
    }
  };

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomToJoin.trim()) return;
    navigate({ to: `/game/${roomToJoin.trim()}` });
  };

  return (
    <div className='min-h-screen bg-background p-6 md:p-12'>
      <div className='mx-auto max-w-7xl space-y-12'>
        <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6'>
          <div className='space-y-1'>
            <h1 className='text-3xl font-bold'>Dashboard</h1>
            <p className='text-muted-foreground'>
              Welcome back,{" "}
              <span className='font-semibold text-foreground'>
                {session.data?.user.name}
              </span>
            </p>
          </div>

          <div className='flex items-center gap-4'>
            <div className='text-right'>
              <p className='text-xs text-muted-foreground uppercase'>
                Global Rank
              </p>
              <p className='text-2xl font-bold'>#2,481</p>
            </div>
            <div className='flex size-12 items-center justify-center bg-primary'>
              <Trophy className='size-5 text-primary-foreground' />
            </div>
          </div>
        </div>

        <div className='grid gap-8 lg:grid-cols-[1fr_350px]'>
          <div className='space-y-8'>
            <div className='grid gap-6 sm:grid-cols-2'>
              <Card className='bg-primary text-primary-foreground'>
                <CardContent className='p-8'>
                  <div className='space-y-6'>
                    <div className='flex size-14 items-center justify-center bg-white/20'>
                      <Plus className='size-7' />
                    </div>
                    <div className='space-y-2'>
                      <h3 className='text-xl font-bold'>Create Private Room</h3>
                      <p className='text-sm opacity-80'>
                        Host a game with custom categories for up to 10 players.
                      </p>
                    </div>
                    <Button
                      size='sm'
                      variant='outline'
                      className='border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10'
                      onClick={handleCreateRoom}
                      disabled={createRoomMutation.isPending}
                    >
                      Start Now
                      <ArrowRight className='size-4 ml-1' />
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className='space-y-4'>
                  <div className='flex size-14 items-center justify-center bg-secondary'>
                    <Users className='size-7 text-secondary-foreground' />
                  </div>
                  <div>
                    <CardTitle>Join a Room</CardTitle>
                    <CardDescription>
                      Enter a unique room code to join an ongoing session.
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleJoinRoom} className='flex gap-2'>
                    <div className='relative flex-1'>
                      <Search className='absolute left-3 top-1/2 -translate-y-1/2 size-5 text-muted-foreground' />
                      <Input
                        value={roomToJoin}
                        onChange={e => setRoomToJoin(e.target.value)}
                        placeholder='Room code'
                        className='pl-10'
                      />
                    </div>
                    <Button type='submit' size='icon'>
                      <ArrowRight className='size-4' />
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            <div className='space-y-4'>
              <div className='flex items-center gap-2'>
                <LayoutGrid className='size-5 text-primary' />
                <h2 className='text-lg font-semibold uppercase tracking-wider'>
                  Statistics
                </h2>
              </div>

              <div className='grid gap-4 sm:grid-cols-3'>
                {[
                  {
                    label: "Games Played",
                    value: "142",
                    icon: Gamepad2,
                    color: "text-blue-500",
                    bg: "bg-blue-500/10",
                  },
                  {
                    label: "Wins Recorded",
                    value: "38",
                    icon: Trophy,
                    color: "text-yellow-500",
                    bg: "bg-yellow-500/10",
                  },
                  {
                    label: "Accuracy Rate",
                    value: "76%",
                    icon: Zap,
                    color: "text-purple-500",
                    bg: "bg-purple-500/10",
                  },
                ].map((stat, i) => (
                  <Card key={i}>
                    <CardContent className='p-6'>
                      <div
                        className={`flex size-12 items-center justify-center ${stat.bg}`}
                      >
                        <stat.icon className={`size-6 ${stat.color}`} />
                      </div>
                      <div className='mt-4 space-y-1'>
                        <p className='text-xs text-muted-foreground uppercase'>
                          {stat.label}
                        </p>
                        <p className='text-3xl font-bold'>{stat.value}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>

          <aside className='space-y-6'>
            <Card>
              <CardHeader className='space-y-4'>
                <div className='flex items-center gap-2'>
                  <History className='size-5 text-muted-foreground' />
                  <CardDescription>Match History</CardDescription>
                </div>
              </CardHeader>
              <CardContent className='space-y-4'>
                {[1, 2, 3].map(m => (
                  <div
                    key={m}
                    className='flex flex-col gap-2 border bg-card p-4 transition-colors hover:border-ring cursor-pointer'
                  >
                    <div className='flex justify-between'>
                      <span className='text-xs font-semibold text-primary uppercase'>
                        Victory
                      </span>
                      <span className='text-xs text-muted-foreground'>
                        2h ago
                      </span>
                    </div>
                    <p className='font-medium'>Trivia Night #{941 - m}</p>
                    <div className='flex justify-between items-end'>
                      <div className='flex -space-x-2'>
                        {[1, 2, 3].map(i => (
                          <div
                            key={i}
                            className='flex size-6 rounded-full border-2 border-background bg-muted'
                          />
                        ))}
                      </div>
                      <p className='text-lg font-bold'>{1250 - m * 100} pts</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Button variant='ghost' className='w-full'>
              View Full Logs
            </Button>
          </aside>
        </div>
      </div>
    </div>
  );
}
