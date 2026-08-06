import type { ReactNode } from "react";

import { formatNumber } from "@/shared/lib/format";

interface StatCardProps {
  label: string;
  value: number | string | undefined;
  hint?: ReactNode;
  isLoading?: boolean;
}

export function StatCard({ label, value, hint, isLoading }: StatCardProps) {
  return (
    <div className='border p-4'>
      <p className='text-[10px] font-black tracking-[0.3em] text-muted-foreground uppercase'>
        {label}
      </p>
      <p className='mt-2 text-3xl font-semibold tabular-nums'>
        {isLoading
          ? "—"
          : typeof value === "number"
            ? formatNumber(value)
            : (value ?? "—")}
      </p>
      {hint ? (
        <p className='mt-1 text-xs text-muted-foreground'>{hint}</p>
      ) : null}
    </div>
  );
}
