import type { ReactNode } from "react";

interface EmptyStateProps {
  title: string;
  description?: string;
  children?: ReactNode;
}

export function EmptyState({ title, description, children }: EmptyStateProps) {
  return (
    <div className='flex flex-col items-center justify-center gap-2 border border-dashed p-12 text-center'>
      <p className='text-sm font-semibold tracking-wider uppercase'>{title}</p>
      {description ? (
        <p className='max-w-sm text-sm text-muted-foreground'>{description}</p>
      ) : null}
      {children ? <div className='mt-3'>{children}</div> : null}
    </div>
  );
}
