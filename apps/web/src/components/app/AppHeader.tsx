import { Button } from "@shaxsiy-oyin/ui/components/button";
import { Bell } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { DropdownMenuAvatar } from "./user-menu";
import { ModeToggle } from "../mode-toggle";

export function AppHeader() {
  const { user, signOut } = useAuth();

  const userInitials = user?.name
    ? user.name
        .split(" ")
        .map(n => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "U";

  return (
    <header className='border-b border-black/10 bg-background'>
      <div className='max-w-7xl mx-auto py-4'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-2'>
            <div className='w-8 h-8 bg-black rounded-full flex items-center justify-center'>
              <span className='text-white font-bold'>S</span>
            </div>
            <span className='text-lg font-medium'>Shaxsiy O'yin</span>
          </div>

          <div className='flex items-center gap-2'>
            <ModeToggle />
            <Button variant='ghost' size='icon' title='Bildirishnomalar'>
              <Bell className='w-5 h-5' />
            </Button>
            <DropdownMenuAvatar />
          </div>
        </div>
      </div>
    </header>
  );
}
