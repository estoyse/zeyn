import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@zeyn/ui/components/dropdown-menu";
import { Globe } from "lucide-react";
import { useTranslation } from "react-i18next";

import { authClient } from "@/features/auth/lib/auth-client";
import { Button } from "@zeyn/ui/components/button";

export function LanguageToggle() {
  const { i18n } = useTranslation();
  const { data } = authClient.useSession();

  const handleChangeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    if (data?.user) {
      authClient.updateUser({ locale: lng }).catch(() => {});
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant='outline' size='icon' />}>
        <Globe className='h-[1.2rem] w-[1.2rem]' />
        <span className='sr-only'>Toggle language</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end'>
        <DropdownMenuItem onClick={() => handleChangeLanguage("en")}>
          English
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleChangeLanguage("uz")}>
          O'zbekcha
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleChangeLanguage("ru")}>
          Русский
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
