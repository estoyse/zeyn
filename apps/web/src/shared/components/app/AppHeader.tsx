import { Button } from "@zeyn/ui/components/button";
import { LogoLockup } from "@zeyn/ui/components/logo";
import { Bell } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { DropdownMenuAvatar } from "./user-menu";
import { LanguageToggle } from "../language-toggle";
import { ModeToggle } from "../mode-toggle";
import { Link } from "@tanstack/react-router";

export function AppHeader() {
  const { t } = useTranslation();
  const { user } = useAuth();

  return (
    <header className="border-b bg-background">
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex items-center justify-between">
          <Link to="/">
            <LogoLockup size="sm" />
          </Link>

          <div className="flex items-center gap-2">
            <ModeToggle />
            <LanguageToggle />
            {user ? (
              <>
                <Button variant="ghost" size="icon" title={t("common:userMenu.notifications")}>
                  <Bell className="w-5 h-5" />
                </Button>
                <DropdownMenuAvatar />
              </>
            ) : (
              <Link to="/auth/login">
                <Button variant="brand">{t("common:signIn")}</Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
