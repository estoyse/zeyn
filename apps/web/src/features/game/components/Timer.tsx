import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { cn } from "@zeyn/ui/lib/utils";

interface TimerProps {
  expiresAt: number;
  duration?: number;
  onTimeout?: () => void;
}

export function Timer({ expiresAt, duration = 15000, onTimeout }: TimerProps) {
  const [timeLeft, setTimeLeft] = useState(Math.max(0, expiresAt - Date.now()));

  useEffect(() => {
    const interval = setInterval(() => {
      const remaining = Math.max(0, expiresAt - Date.now());
      setTimeLeft(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
        onTimeout?.();
      }
    }, 50);
    return () => clearInterval(interval);
  }, [expiresAt, onTimeout]);

  const percentage = Math.min(100, (timeLeft / duration) * 100);
  const isUrgent = timeLeft < 5000;

  return (
    <div className='w-full space-y-2'>
      <div className='flex justify-between text-xs text-muted-foreground'>
        <span className={cn(isUrgent && "text-destructive animate-pulse")}>
          {isUrgent ? "HURRY UP!" : "TIME REMAINING"}
        </span>
        <span>{(timeLeft / 1000).toFixed(1)}s</span>
      </div>
      <div className='w-full h-3 bg-muted overflow-hidden border p-[2px]'>
        <motion.div
          initial={false}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.2 }}
          className={cn(
            "h-full",
            isUrgent ? "bg-destructive" : "bg-brand"
          )}
        />
      </div>
    </div>
  );
}
