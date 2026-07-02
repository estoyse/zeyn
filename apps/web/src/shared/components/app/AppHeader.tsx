import { Button } from "@zeyn/ui/components/button";
import { LogoLockup } from "@zeyn/ui/components/logo";
import { Bell } from "lucide-react";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { DropdownMenuAvatar } from "./user-menu";
import { ModeToggle } from "../mode-toggle";
import { Link } from "@tanstack/react-router";

export function AppHeader() {
  const { user } = useAuth();

  return (
    <header className="border-b bg-background">
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex items-center justify-between">
          <Link to="/dashboard">
            <LogoLockup size="sm" />
          </Link>

          <div className="flex items-center gap-2">
            <ModeToggle />
            <Button variant="ghost" size="icon" title="Bildirishnomalar">
              <Bell className="w-5 h-5" />
            </Button>
            <DropdownMenuAvatar />
          </div>
        </div>
      </div>
    </header>
  );
}
