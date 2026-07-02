import { Loader2 } from "lucide-react";

export default function Loader() {
  return (
    <div className="flex flex-col items-center justify-center p-12 space-y-4">
      <div className="relative">
        <Loader2 className="animate-spin text-brand" size={48} />
        <div className="absolute inset-0 bg-brand/10 blur-xl rounded-full" />
      </div>
      <p className="text-muted-foreground font-black text-[10px] tracking-[0.4em] uppercase animate-pulse">
        Syncing Data...
      </p>
    </div>
  );
}
