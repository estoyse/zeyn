import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@shaxsiy-oyin/ui/components/avatar";
import { Button } from "@shaxsiy-oyin/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@shaxsiy-oyin/ui/components/dropdown-menu";
import { BellIcon, LogOutIcon, SettingsIcon, UserIcon } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export function DropdownMenuAvatar() {
  const { user, signOut } = useAuth();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <Button variant='ghost' size='icon'>
          <Avatar className='rounded-none'>
            {user?.image ? (
              <AvatarImage src={user.image} alt={user.name ?? "User profile"} />
            ) : null}
            <AvatarFallback className='rounded-none'>
              {user?.name?.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end'>
        <DropdownMenuGroup>
          <DropdownMenuItem>
            <UserIcon />
            Profile
          </DropdownMenuItem>
          <DropdownMenuItem>
            <SettingsIcon />
            Settings
          </DropdownMenuItem>
          <DropdownMenuItem>
            <BellIcon />
            Notifications
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={signOut}>
          <LogOutIcon />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
