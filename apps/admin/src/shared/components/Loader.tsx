import { Loader2 } from "lucide-react";

export function Loader() {
  return (
    <div className='flex flex-col items-center justify-center gap-4 p-12'>
      <Loader2 className='animate-spin text-brand' size={32} />
      <p className='animate-pulse text-[10px] font-black tracking-[0.4em] text-muted-foreground uppercase'>
        Loading
      </p>
    </div>
  );
}
