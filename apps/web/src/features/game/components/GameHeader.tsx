import { motion } from "framer-motion";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@zeyn/ui/components/alert-dialog";
import { Button } from "@zeyn/ui/components/button";
import { Logo, LogoMark } from "@zeyn/ui/components/logo";
import { Clock, LogOut, UserCircle2 } from "lucide-react";
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
    <header className='flex flex-wrap items-center gap-x-4 gap-y-3 border-b bg-background px-4 py-3 md:flex-nowrap md:px-6'>
      <div className='order-1 flex items-center gap-3'>
        <span className='flex size-10 shrink-0 items-center justify-center bg-brand text-brand-foreground'>
          <LogoMark className='size-5' />
        </span>
        <div>
          <Logo size='md' />
          <p className='text-xs uppercase tracking-widest text-muted-foreground flex items-center gap-1'>
            <Clock className='size-3' /> {t("game:header.room", { gameId })}
          </p>
        </div>
      </div>

      <AlertDialog>
        <AlertDialogTrigger
          render={
            <Button
              variant='destructive'
              size='sm'
              className='order-2 ml-auto md:order-3 md:ml-0'
            >
              <LogOut className='size-4 mr-2' />
              {t("game:header.leave")}
            </Button>
          }
        />
        <AlertDialogContent size='sm'>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("game:header.leaveConfirm.title")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("game:header.leaveConfirm.description")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common:cancel")}</AlertDialogCancel>
            <AlertDialogAction variant='destructive' onClick={onLeave}>
              {t("game:header.leaveConfirm.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className='order-3 flex w-full gap-2 overflow-x-auto md:order-2 md:w-auto md:flex-1 md:flex-wrap md:justify-center'>
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
    </header>
  );
}
