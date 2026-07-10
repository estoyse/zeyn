import type { ReactNode } from "react";

interface FocusLayoutProps {
  header: ReactNode;
  children: ReactNode;
}

export function FocusLayout({ header, children }: FocusLayoutProps) {
  return (
    <div className='grid grid-rows-[auto_1fr] h-svh bg-background'>
      {header}
      <div className='min-h-0 overflow-y-auto'>{children}</div>
    </div>
  );
}
