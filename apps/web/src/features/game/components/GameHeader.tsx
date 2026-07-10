import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Button } from "@zeyn/ui/components/button";
import { Logo, LogoMark } from "@zeyn/ui/components/logo";
import { Clock, UserCircle2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { ClientRoomState } from "@/features/game/hooks/useGameState";

interface GameHeaderProps {
  gameId: string;
  state: ClientRoomState;
  onLeave: () => void;
}

export function GameHeader({ gameId, state, onLeave }: GameHeaderProps) {
  const { t } = useTranslation();

  return (
    <header className='flex flex-col md:flex-row justify-between items-center gap-4 border-b bg-background px-4 py-3 md:px-6'>
      <Link to='/' className='flex items-center gap-3 self-start md:self-auto'>
        <span className='flex size-10 shrink-0 items-center justify-center bg-brand text-brand-foreground'>
          <LogoMark className='size-5' />
        </span>
        <div>
          <Logo size='md' />
          <p className='text-xs uppercase tracking-widest text-muted-foreground flex items-center gap-1'>
            <Clock className='size-3' /> {t("game:header.room", { gameId })}
          </p>
        </div>
      </Link>

      <div className='flex w-full gap-2 overflow-x-auto flex-nowrap md:w-auto md:flex-wrap md:justify-center'>
        {Object.values(state.players).map(p => (
          <motion.div
            layout
            key={p.id}
            className='flex shrink-0 items-center gap-2 px-3 py-2 border transition-all bg-muted border-border'
          >
            <div className='relative'>
              <UserCircle2
                className={
                  p.connected
                    ? "text-foreground"
                    : "text-muted-foreground grayscale"
                }
              />
              {p.connected && (
                <div className='absolute -top-0.5 -right-0.5 size-2 rounded-full bg-success border-2 border-background' />
              )}
            </div>
            <div className='flex flex-col'>
              <span className='text-xs text-muted-foreground'>{p.name}</span>
              <span className='font-bold'>{p.score}</span>
            </div>
          </motion.div>
        ))}
      </div>

      <Button variant='ghost' size='sm' onClick={onLeave}>
        {t("game:header.leave")}
      </Button>
    </header>
  );
}
