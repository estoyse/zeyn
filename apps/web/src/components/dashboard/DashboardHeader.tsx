import { Trophy } from "lucide-react";

interface DashboardHeaderProps {
  userName?: string | null;
}

export function DashboardHeader({ userName }: DashboardHeaderProps) {
  return (
    <header className='flex flex-col md:flex-row justify-between items-start md:items-center gap-6'>
      <div className='space-y-1'>
        <h1 className='text-4xl font-black italic tracking-tighter'>
          COMMAND CENTER
        </h1>
        <p className='text-muted-foreground'>
          Welcome back, {userName}. Ready for deployment?
        </p>
      </div>
      <div className='flex items-center gap-4 bg-muted/30 p-2 rounded-2xl border'>
        <div className='flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-xl border border-primary/20'>
          <Trophy className='size-5 text-primary' />
          <span className='font-bold italic'>4,250 PTS</span>
        </div>
      </div>
    </header>
  );
}
