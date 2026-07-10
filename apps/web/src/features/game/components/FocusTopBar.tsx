import { Link, useNavigate } from "@tanstack/react-router";
import { Button } from "@zeyn/ui/components/button";
import { LogoLockup } from "@zeyn/ui/components/logo";
import { ArrowLeft } from "lucide-react";
import { useTranslation } from "react-i18next";

interface FocusTopBarProps {
  onLeave?: () => void;
}

export function FocusTopBar({ onLeave }: FocusTopBarProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const leave = onLeave ?? (() => navigate({ to: "/" }));

  return (
    <header className='flex items-center justify-between border-b bg-background px-4 py-3 md:px-6'>
      <Link to='/'>
        <LogoLockup size='sm' />
      </Link>
      <Button variant='ghost' size='sm' onClick={leave}>
        <ArrowLeft className='size-4 mr-2' />
        {t("game:typePage.backToDashboard")}
      </Button>
    </header>
  );
}
