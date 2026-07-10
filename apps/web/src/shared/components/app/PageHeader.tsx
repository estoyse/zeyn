import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { BackButton, type BackTarget } from "./BackButton";

interface PageHeaderProps {
  title: ReactNode;
  subtitle?: ReactNode;
  icon?: LucideIcon;
  back?: BackTarget;
  children?: ReactNode;
}

export function PageHeader({
  title,
  subtitle,
  icon: Icon,
  back,
  children,
}: PageHeaderProps) {
  return (
    <header className='space-y-4'>
      {back && (
        <div className='-ml-4'>
          <BackButton target={back} />
        </div>
      )}

      <div className='flex flex-col md:flex-row items-start md:items-center justify-between gap-6'>
        <div className='flex items-center gap-3'>
          {Icon && (
            <div className='flex size-12 shrink-0 items-center justify-center bg-brand text-brand-foreground'>
              <Icon className='size-6' />
            </div>
          )}
          <div>
            <h1 className='text-3xl font-bold tracking-tight'>{title}</h1>
            {subtitle && (
              <p className='text-muted-foreground italic'>{subtitle}</p>
            )}
          </div>
        </div>

        {children && <div className='flex items-center gap-2'>{children}</div>}
      </div>
    </header>
  );
}
