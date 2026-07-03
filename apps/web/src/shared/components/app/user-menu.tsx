import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@zeyn/ui/components/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@zeyn/ui/components/dropdown-menu";
import { BellIcon, LogOutIcon, SettingsIcon, UserIcon } from "lucide-react";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { trpc } from "@/shared/lib/trpc";

export function DropdownMenuAvatar() {
  const { user, signOut } = useAuth();
  const meQuery = useQuery({
    ...trpc.profile.getMe.queryOptions(),
    enabled: !!user,
  });
  const username = meQuery.data?.username;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <Avatar className="cursor-pointer hover:opacity-80 transition-opacity">
          {user?.image ? (
            <AvatarImage src={user.image} alt={user.name ?? "User profile"} />
          ) : null}
          <AvatarFallback>
            {user?.name?.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuGroup>
          <DropdownMenuItem
            render={
              <Link
                to="/u/$username"
                params={{ username: username ?? "" }}
                disabled={!username}
              />
            }
          >
            <UserIcon />
            Profile
          </DropdownMenuItem>
          <DropdownMenuItem render={<Link to="/settings" />}>
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
