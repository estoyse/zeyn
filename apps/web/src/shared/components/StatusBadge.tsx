import type { ReactNode } from "react";
import { Badge } from "@zeyn/ui/components/badge";
import { cn } from "@zeyn/ui/lib/utils";

type Tone = "primary" | "success" | "destructive" | "muted" | "brand" | "warning";

const STATUS_TONE: Record<string, Tone> = {
  waiting: "warning",
  lobby: "warning",
  playing: "success",
  active: "success",
  finished: "muted",
  archived: "muted",
};

interface StatusBadgeProps {
  children: ReactNode;
  tone?: Tone;
  className?: string;
}

export function StatusBadge({ children, tone, className }: StatusBadgeProps) {
  const resolved =
    tone ??
    (typeof children === "string"
      ? STATUS_TONE[children.toLowerCase()] ?? "primary"
      : "primary");

  return (
    <Badge tone={resolved === "muted" ? "default" : resolved} className={cn(className)}>
      {children}
    </Badge>
  );
}
