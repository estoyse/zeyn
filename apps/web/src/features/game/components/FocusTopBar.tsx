import { Link, useNavigate } from "@tanstack/react-router";
import { Button } from "@zeyn/ui/components/button";
import { LogoLockup } from "@zeyn/ui/components/logo";
import { Separator } from "@zeyn/ui/components/separator";
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
    <header className='flex items-center gap-3 border-b bg-background px-4 py-3 md:px-6'>
      <Button
        variant='ghost'
        size='icon-sm'
        onClick={leave}
        aria-label={t("common:back")}
        title={t("common:back")}
      >
        <ArrowLeft className='size-4' />
      </Button>

      <Separator orientation='vertical' className='h-6' />

      <Link to='/'>
        <LogoLockup size='sm' />
      </Link>
    </header>
  );
}
