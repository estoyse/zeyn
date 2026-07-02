import { motion } from "framer-motion";
import { Button } from "@zeyn/ui/components/button";
import { LayoutGrid, Clock, UserCircle2 } from "lucide-react";
import type { ClientRoomState } from "@/features/game/hooks/useGameState";

interface GameHeaderProps {
  gameId: string;
  state: ClientRoomState;
  onLeave: () => void;
}

export function GameHeader({ gameId, state, onLeave }: GameHeaderProps) {
  return (
    <header className='flex flex-col md:flex-row justify-between items-center gap-4 pb-6 border-b'>
      <div className='flex items-center gap-3'>
        <div className='flex size-10 items-center justify-center bg-brand text-brand-foreground'>
          <LayoutGrid className='size-5' />
        </div>
        <div>
          <h1 className='text-xl font-bold'>Zeyn</h1>
          <p className='text-xs uppercase tracking-widest text-muted-foreground flex items-center gap-1'>
            <Clock className='size-3' /> Room: {gameId}
          </p>
        </div>
      </div>

      <div className='flex flex-wrap justify-center gap-2'>
        {Object.values(state.players).map(p => (
          <motion.div
            layout
            key={p.id}
            className='flex items-center gap-2 px-3 py-2 border transition-all bg-muted border-border'
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
        Leave
      </Button>
    </header>
  );
}
