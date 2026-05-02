import { Button } from "@shaxsiy-oyin/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@shaxsiy-oyin/ui/components/dropdown-menu";
import { Skeleton } from "@shaxsiy-oyin/ui/components/skeleton";
import { Link, useNavigate } from "@tanstack/react-router";
import { UserCircle2, LogOut, Settings, User } from "lucide-react";
import { authClient } from "@/lib/auth-client";

export default function UserMenu() {
  const navigate = useNavigate();
  const { data: session, isPending } = authClient.useSession();

  if (isPending) {
    return <Skeleton className="h-10 w-32 rounded-xl bg-white/5" />;
  }

  if (!session) {
    return (
      <Link to="/login">
        <Button className="bg-white text-black hover:bg-gray-200 rounded-xl font-black text-xs h-10 px-6">
          SIGN IN
        </Button>
      </Link>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-3 px-3 py-1.5 bg-white/5 border border-white/5 rounded-xl hover:bg-white/10 transition-all group">
          <div className="w-8 h-8 rounded-lg bg-linear-to-br from-blue-600/20 to-purple-600/20 flex items-center justify-center text-blue-400 border border-blue-500/20">
             <User size={16} />
          </div>
          <span className="text-sm font-black tracking-tight text-gray-300 group-hover:text-white transition-colors">
            {session.user.name}
          </span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64 bg-[#0a0a0f]/95 backdrop-blur-2xl border-white/5 rounded-2xl p-2 shadow-2xl mt-2 overflow-hidden">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="px-3 py-4">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-black leading-none">{session.user.name}</p>
              <p className="text-[10px] font-medium leading-none text-gray-500 truncate">{session.user.email}</p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator className="bg-white/5" />
          
          <div className="p-1 space-y-1">
            <DropdownMenuItem className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold hover:bg-white/5 focus:bg-white/5 cursor-pointer">
              <UserCircle2 size={18} className="text-gray-500" />
              Profile Settings
            </DropdownMenuItem>
            <DropdownMenuItem className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold hover:bg-white/5 focus:bg-white/5 cursor-pointer">
              <Settings size={18} className="text-gray-500" />
              Preferences
            </DropdownMenuItem>
            
            <DropdownMenuSeparator className="bg-white/5 my-1" />
            
            <DropdownMenuItem
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-red-400 hover:bg-red-500/10 focus:bg-red-500/10 cursor-pointer"
              onClick={() => {
                authClient.signOut({
                  fetchOptions: {
                    onSuccess: () => {
                      navigate({ to: "/" });
                    },
                  },
                });
              }}
            >
              <LogOut size={18} />
              Sign Out
            </DropdownMenuItem>
          </div>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
