import { Lock, Unlock, Users } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@zeyn/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@zeyn/ui/components/card";
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
  const { t } = useTranslation();
  const locked = !!room.password;

  return (
    <Card className='hover:border-brand/50 transition-all relative'>
      <div
        className={`absolute top-2 right-2 ${
          locked ? "text-destructive" : "text-success"
        }`}
      >
        {locked ? <Lock className='size-4' /> : <Unlock className='size-4' />}
      </div>
      <CardHeader className='p-4 pr-10'>
        <CardTitle className='text-lg font-semibold line-clamp-1'>
          {room.name}
        </CardTitle>
        <CardDescription className='text-xs flex items-center gap-1'>
          {t("dashboard:roomCard.hostPrefix", {
            name: isHost
              ? t("dashboard:roomCard.you")
              : t("dashboard:roomCard.hostFallback"),
          })}
        </CardDescription>
      </CardHeader>
      <CardContent className='p-4 pt-0 space-y-4'>
        <div className='flex items-center justify-between text-xs'>
          <div className='flex items-center gap-1'>
            <Users className='size-3' />
            <span>
              {t("dashboard:roomCard.players", { count: room.maxPlayers })}
            </span>
          </div>
          <StatusBadge>{room.status}</StatusBadge>
        </div>
        <Button
          className='w-full'
          variant={locked ? "outline" : "default"}
          size='sm'
          onClick={onJoin}
        >
          {t("dashboard:roomCard.join")}
        </Button>
      </CardContent>
    </Card>
  );
}
