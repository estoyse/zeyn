import { useState } from "react";
import { Button } from "@zeyn/ui/components/button";
import { Card, CardContent } from "@zeyn/ui/components/card";
import { Input } from "@zeyn/ui/components/input";
import { UserCircle2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { NAME_MAX_LENGTH } from "@zeyn/api/game-types";

interface LoginRequiredViewProps {
  gameId: string;
  onJoinAsGuest: (name: string) => void;
  onWatch: () => void;
  pending?: boolean;
  allowGuests?: boolean;
}

export function LoginRequiredView({
  gameId,
  onJoinAsGuest,
  onWatch,
  pending = false,
  allowGuests = true,
}: LoginRequiredViewProps) {
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const trimmed = name.trim();

  return (
    <div className='min-h-full bg-background flex items-center justify-center p-4'>
      <Card className='max-w-md w-full text-center'>
        <CardContent className='p-8'>
          <div className='mx-auto mb-6 flex size-16 items-center justify-center bg-brand/10 text-brand'>
            <UserCircle2 className='size-10' />
          </div>
          <div className='space-y-2'>
            <h1 className='text-2xl font-bold'>
              {t("game:auth.loginRequired.title")}
            </h1>
            <p className='text-muted-foreground'>
              {t("game:auth.loginRequired.description")}
            </p>
          </div>

          {allowGuests && (
            <form
              className='mt-6 space-y-3'
              onSubmit={e => {
                e.preventDefault();
                if (trimmed) onJoinAsGuest(trimmed);
              }}
            >
              <Input
                value={name}
                maxLength={NAME_MAX_LENGTH}
                onChange={e => setName(e.target.value)}
                placeholder={t("game:auth.joinChoice.namePlaceholder", {
                  defaultValue: "Your display name",
                })}
                aria-label={t("game:auth.joinChoice.namePlaceholder", {
                  defaultValue: "Your display name",
                })}
              />
              <Button
                type='submit'
                variant='brand'
                className='w-full'
                disabled={!trimmed || pending}
              >
                {t("game:auth.joinChoice.joinAsGuest", {
                  defaultValue: "Join as guest",
                })}
              </Button>
            </form>
          )}

          <Button
            variant='outline'
            className='w-full mt-3'
            onClick={onWatch}
            disabled={pending}
          >
            {t("game:auth.joinChoice.watch", { defaultValue: "Watch" })}
          </Button>

          <Button
            variant='ghost'
            className='w-full mt-3'
            onClick={() =>
              (window.location.href = `/auth/login?redirectTo=/game/${encodeURIComponent(gameId)}`)
            }
          >
            {t("game:auth.loginRequired.signIn")}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
