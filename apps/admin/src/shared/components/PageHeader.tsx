import type { ReactNode } from "react";

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  children?: ReactNode;
}

export function PageHeader({
  eyebrow,
  title,
  description,
  children,
}: PageHeaderProps) {
  return (
    <div className='flex items-start justify-between gap-4'>
      <div className='min-w-0'>
        {eyebrow ? (
          <p className='text-[10px] font-black tracking-[0.3em] text-muted-foreground uppercase'>
            {eyebrow}
          </p>
        ) : null}
        <h1 className='mt-1 truncate text-2xl font-semibold tracking-tight'>
          {title}
        </h1>
        {description ? (
          <p className='mt-1 text-sm text-muted-foreground'>{description}</p>
        ) : null}
      </div>
      {children ? (
        <div className='flex shrink-0 items-center gap-2'>{children}</div>
      ) : null}
    </div>
  );
}
