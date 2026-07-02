import type { ComponentProps } from "react";
import { cn } from "@zeyn/ui/lib/utils";

const wordmarkSizes = {
  sm: "text-lg",
  md: "text-2xl",
  lg: "text-4xl",
  xl: "text-6xl",
} as const;

const dotSizes = {
  sm: "size-[0.2em]",
  md: "size-[0.2em]",
  lg: "size-[0.19em]",
  xl: "size-[0.18em]",
} as const;

type WordmarkSize = keyof typeof wordmarkSizes;

interface LogoProps extends ComponentProps<"span"> {
  size?: WordmarkSize;
  dot?: boolean;
}

export function Logo({ size = "md", dot = true, className, ...props }: LogoProps) {
  return (
    <span
      className={cn(
        "font-heading font-bold lowercase leading-none tracking-tight select-none inline-flex items-baseline",
        wordmarkSizes[size],
        className,
      )}
      {...props}
    >
      zeyn
      {dot && (
        <span
          aria-hidden="true"
          className={cn(
            "ml-[0.09em] inline-block rounded-full bg-buzzer",
            dotSizes[size],
          )}
        />
      )}
    </span>
  );
}

export function LogoMark({ className, ...props }: ComponentProps<"svg">) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="currentColor"
      aria-hidden="true"
      className={cn("size-6", className)}
      {...props}
    >
      <path d="M20 16 H80 V33 L47 62 H80 V84 H20 V67 L53 38 H20 Z" />
    </svg>
  );
}

interface LogoLockupProps extends ComponentProps<"span"> {
  size?: WordmarkSize;
}

export function LogoLockup({ size = "md", className, ...props }: LogoLockupProps) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)} {...props}>
      <span className="flex size-8 items-center justify-center bg-brand text-brand-foreground">
        <LogoMark className="size-5" />
      </span>
      <Logo size={size} />
    </span>
  );
}
