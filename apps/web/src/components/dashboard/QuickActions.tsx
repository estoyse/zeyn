import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Zap, PlusCircle, ArrowRight } from "lucide-react";
import { Button } from "@shaxsiy-oyin/ui/components/button";
import { Input } from "@shaxsiy-oyin/ui/components/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@shaxsiy-oyin/ui/components/card";

export function QuickActions() {
  const navigate = useNavigate();
  const [roomToJoin, setRoomToJoin] = useState("");

  const handleJoinRoom = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!roomToJoin.trim()) return;
    navigate({ to: "/game/$roomId", params: { roomId: roomToJoin.trim() } });
  };

  return (
    <div className='grid gap-6 md:grid-cols-2'>
      <Card
        className='glass-card group hover:border-primary/50 transition-all cursor-pointer overflow-hidden relative'
        onClick={() => navigate({ to: "/game/create" })}
      >
        <div className='absolute top-0 right-0 size-24 bg-primary/5 -mr-8 -mt-8 rounded-full blur-2xl group-hover:bg-primary/20 transition-all' />
        <CardHeader>
          <div className='size-12 rounded-xl bg-primary/10 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform'>
            <Zap className='size-6 text-primary' />
          </div>
          <CardTitle className='text-xl italic font-black'>
            CREATE ARENA
          </CardTitle>
          <CardDescription>
            Setup a custom match with your own rules and subjects.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant='outline'
            className='w-full group-hover:bg-primary group-hover:text-primary-foreground transition-all uppercase font-bold tracking-widest text-xs'
          >
            Configure Match
            <ArrowRight className='size-4 ml-2 group-hover:translate-x-1 transition-transform' />
          </Button>
        </CardContent>
      </Card>

      <Card className='glass-card group hover:border-secondary/50 transition-all'>
        <CardHeader>
          <div className='size-12 rounded-xl bg-secondary/10 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform'>
            <PlusCircle className='size-6 text-secondary-foreground' />
          </div>
          <CardTitle className='text-xl italic font-black'>
            JOIN VIA ID
          </CardTitle>
          <CardDescription>
            Have a secret code? Enter the arena directly.
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <form onSubmit={handleJoinRoom} className='flex gap-2'>
            <Input
              placeholder='Enter Room ID...'
              value={roomToJoin}
              onChange={e => setRoomToJoin(e.target.value)}
              className='bg-background/50 h-11'
            />
            <Button
              type='submit'
              className='h-11 px-6 font-bold'
              disabled={!roomToJoin}
            >
              JOIN
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
