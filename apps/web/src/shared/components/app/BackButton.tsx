import {
  Link,
  useCanGoBack,
  useNavigate,
  useRouter,
  type LinkProps,
} from "@tanstack/react-router";
import { Button } from "@zeyn/ui/components/button";
import { ArrowLeft } from "lucide-react";
import { useTranslation } from "react-i18next";

export type BackTarget = "auto" | LinkProps;

interface BackButtonProps {
  target: BackTarget;
  label?: string;
}

export function BackButton({ target, label }: BackButtonProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const canGoBack = useCanGoBack();
  const navigate = useNavigate();

  const text = label ?? t("common:back");

  if (target !== "auto") {
    return (
      <Link {...target}>
        <Button variant='ghost' size='sm'>
          <ArrowLeft className='size-4 mr-2' />
          {text}
        </Button>
      </Link>
    );
  }

  return (
    <Button
      variant='ghost'
      size='sm'
      onClick={() => (canGoBack ? router.history.back() : navigate({ to: "/" }))}
    >
      <ArrowLeft className='size-4 mr-2' />
      {text}
    </Button>
  );
}
