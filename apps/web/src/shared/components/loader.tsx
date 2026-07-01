import { Loader2 } from "lucide-react";

export default function Loader() {
  return (
    <div className="flex flex-col items-center justify-center p-12 space-y-4">
      <div className="relative">
        <Loader2 className="animate-spin text-blue-500" size={48} />
        <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full" />
      </div>
      <p className="text-gray-500 font-black text-[10px] tracking-[0.4em] uppercase animate-pulse">Syncing Data...</p>
    </div>
  );
}
