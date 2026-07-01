import { Lock, Unlock, Users } from "lucide-react";
import { Button } from "@shaxsiy-oyin/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@shaxsiy-oyin/ui/components/card";
import { StatusBadge } from "@/shared/components/StatusBadge";

interface RoomCardRoom {
  id: string;
  name: string;
  hostId: string;
  maxPlayers: number;
  status: string;
  password?: string | null;
}

interface RoomCardProps {
  room: RoomCardRoom;
  isHost: boolean;
  onJoin: () => void;
}

export function RoomCard({ room, isHost, onJoin }: RoomCardProps) {
  const locked = !!room.password;

  return (
    <Card className='hover:border-primary/50 transition-all relative'>
      <div
        className={`absolute top-2 right-2 ${
          locked ? "text-destructive" : "text-green-500"
        }`}
      >
        {locked ? <Lock className='size-4' /> : <Unlock className='size-4' />}
      </div>
      <CardHeader className='p-4 pr-10'>
        <CardTitle className='text-lg font-semibold line-clamp-1'>
          {room.name}
        </CardTitle>
        <CardDescription className='text-xs flex items-center gap-1'>
          Host: {isHost ? "You" : "Host"}
        </CardDescription>
      </CardHeader>
      <CardContent className='p-4 pt-0 space-y-4'>
        <div className='flex items-center justify-between text-xs'>
          <div className='flex items-center gap-1'>
            <Users className='size-3' />
            <span>{room.maxPlayers} players</span>
          </div>
          <StatusBadge>{room.status}</StatusBadge>
        </div>
        <Button
          className='w-full'
          variant={locked ? "outline" : "default"}
          size='sm'
          onClick={onJoin}
        >
          Join Game
        </Button>
      </CardContent>
    </Card>
  );
}
