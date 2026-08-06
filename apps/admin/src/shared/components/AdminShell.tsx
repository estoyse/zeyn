import { Link, useNavigate } from "@tanstack/react-router";
import { Button } from "@zeyn/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@zeyn/ui/components/dropdown-menu";
import { LogOut } from "lucide-react";
import type { ReactNode } from "react";

import { AdminNav } from "@/shared/components/AdminNav";
import { ModeToggle } from "@/shared/components/ModeToggle";
import { authClient } from "@/shared/lib/auth-client";
import { queryClient } from "@/shared/lib/trpc";
import { refreshSession } from "@/shared/lib/session";

interface AdminShellProps {
  user: { name: string; email: string };
  children: ReactNode;
}

export function AdminShell({ user, children }: AdminShellProps) {
  const navigate = useNavigate();

  const signOut = async () => {
    await authClient.signOut();
    await refreshSession(queryClient);
    navigate({ to: "/login" });
  };

  return (
    <div className='grid h-svh grid-cols-[240px_1fr]'>
      <aside className='flex min-h-0 flex-col border-r'>
        <Link
          to='/'
          className='flex h-14 shrink-0 items-center gap-2 border-b px-4'
        >
          <span className='text-sm font-black tracking-[0.3em] uppercase'>
            Zeyn
          </span>
          <span className='bg-brand px-1.5 py-0.5 text-[10px] font-black tracking-widest text-brand-foreground uppercase'>
            Admin
          </span>
        </Link>
        <div className='min-h-0 flex-1 overflow-y-auto'>
          <AdminNav />
        </div>
      </aside>

      <div className='grid min-w-0 grid-rows-[auto_1fr]'>
        <header className='flex h-14 shrink-0 items-center justify-end gap-2 border-b px-4'>
          <ModeToggle />
          <DropdownMenu>
            <DropdownMenuTrigger
              render={<Button variant='outline' size='sm' />}
            >
              {user.name}
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end'>
              <DropdownMenuItem disabled>{user.email}</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={signOut}>
                <LogOut className='size-3.5' />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        <main className='min-h-0 overflow-y-auto p-8'>{children}</main>
      </div>
    </div>
  );
}
