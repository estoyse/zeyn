import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { PlusCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@zeyn/ui/components/button";
import { Input } from "@zeyn/ui/components/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@zeyn/ui/components/card";

export function JoinByIdCard() {
  const { t } = useTranslation();
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
          {t("dashboard:joinById.title")}
        </CardTitle>
        <CardDescription className='text-xs'>
          {t("dashboard:joinById.description")}
        </CardDescription>
      </CardHeader>
      <CardContent className='p-4 pt-0'>
        <form onSubmit={handleJoinRoom} className='flex gap-2'>
          <Input
            placeholder={t("dashboard:joinById.placeholder")}
            value={gameToJoin}
            onChange={e => setGameToJoin(e.target.value)}
            className='h-9'
          />
          <Button type='submit' size='sm' disabled={!gameToJoin}>
            {t("dashboard:joinById.submit")}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
