import { cn } from "@zeyn/ui/lib/utils";
import type { ReactNode } from "react";

const WIDTH = {
  sm: "max-w-2xl",
  md: "max-w-4xl",
  lg: "max-w-6xl",
  xl: "max-w-7xl",
} as const;

const GAP = {
  md: "space-y-8",
  lg: "space-y-12",
} as const;

interface PageShellProps {
  width?: keyof typeof WIDTH;
  gap?: keyof typeof GAP;
  className?: string;
  children: ReactNode;
}

export function PageShell({
  width = "xl",
  gap = "lg",
  className,
  children,
}: PageShellProps) {
  return (
    <div className='min-h-full bg-background p-4 md:p-8 lg:p-12'>
      <div className={cn("mx-auto", WIDTH[width], GAP[gap], className)}>
        {children}
      </div>
    </div>
  );
}
