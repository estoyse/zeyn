import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { PlusCircle } from "lucide-react";
import { Button } from "@shaxsiy-oyin/ui/components/button";
import { Input } from "@shaxsiy-oyin/ui/components/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@shaxsiy-oyin/ui/components/card";

export function JoinByIdCard() {
  const navigate = useNavigate();
  const [gameToJoin, setGameToJoin] = useState("");

  const handleJoinRoom = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!gameToJoin.trim()) return;
    navigate({ to: "/game/$gameId", params: { gameId: gameToJoin.trim() } });
  };

  return (
    <Card>
      <CardHeader className='pb-2'>
        <CardTitle className='text-base flex items-center gap-2'>
          <PlusCircle className='size-4' />
          Join by ID
        </CardTitle>
        <CardDescription className='text-xs'>
          Have a room ID? Enter it below to join.
        </CardDescription>
      </CardHeader>
      <CardContent className='p-4 pt-0'>
        <form onSubmit={handleJoinRoom} className='flex gap-2'>
          <Input
            placeholder='Enter Room ID...'
            value={gameToJoin}
            onChange={e => setGameToJoin(e.target.value)}
            className='h-9'
          />
          <Button type='submit' size='sm' disabled={!gameToJoin}>
            Join
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
