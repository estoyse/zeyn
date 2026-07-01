import type { ReactNode } from "react";
import { cn } from "@shaxsiy-oyin/ui/lib/utils";

type Tone = "primary" | "success" | "destructive" | "muted";

const TONES: Record<Tone, string> = {
  primary: "bg-primary/10 text-primary",
  success: "bg-green-500/10 text-green-500",
  destructive: "bg-destructive/10 text-destructive",
  muted: "bg-muted text-muted-foreground",
};

interface StatusBadgeProps {
  children: ReactNode;
  tone?: Tone;
  className?: string;
}

// Small pill used for room status, roles, etc. Centralises the repeated
// "rounded bg-*/10 text-* text-xs" badge styling.
export function StatusBadge({
  children,
  tone = "primary",
  className,
}: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium",
        TONES[tone],
        className
      )}
    >
      {children}
    </span>
  );
}
