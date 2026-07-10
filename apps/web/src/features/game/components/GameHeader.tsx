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
import { Clock, LogOut } from "lucide-react";
import { useTranslation } from "react-i18next";

interface GameHeaderProps {
  gameId: string;
  onLeave: () => void;
}

export function GameHeader({ gameId, onLeave }: GameHeaderProps) {
  const { t } = useTranslation();

  return (
    <header className='flex items-center justify-between gap-4 border-b bg-background px-4 py-3 md:px-6'>
      <div className='flex min-w-0 items-center gap-3'>
        <span className='flex size-10 shrink-0 items-center justify-center bg-brand text-brand-foreground'>
          <LogoMark className='size-5' />
        </span>
        <div className='min-w-0'>
          <Logo size='md' />
          <p className='flex items-center gap-1 truncate text-xs uppercase tracking-widest text-muted-foreground'>
            <Clock className='size-3 shrink-0' />
            {t("game:header.room", { gameId })}
          </p>
        </div>
      </div>

      <AlertDialog>
        <AlertDialogTrigger
          render={
            <Button variant='destructive' size='sm' className='shrink-0'>
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
    </header>
  );
}
