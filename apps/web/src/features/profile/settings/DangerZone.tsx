import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Trans, useTranslation } from "react-i18next";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@zeyn/ui/components/alert-dialog";
import { Button } from "@zeyn/ui/components/button";
import { Input } from "@zeyn/ui/components/input";
import { authClient } from "@/features/auth/lib/auth-client";
import { trpc } from "@/shared/lib/trpc";
import { toast } from "sonner";

interface DangerZoneProps {
  username: string;
}

export function DangerZone({ username }: DangerZoneProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [confirm, setConfirm] = useState("");

  const deleteMutation = useMutation(
    trpc.profile.deleteAccount.mutationOptions({
      onSuccess: async () => {
        await authClient.signOut();
        toast.success(t("settings:danger.deleted"));
        navigate({ to: "/" });
      },
      onError: error => toast.error(error.message),
    })
  );

  return (
    <div className='space-y-4 border border-destructive/40 bg-destructive/5 p-6'>
      <div className='space-y-1'>
        <h3 className='font-semibold text-destructive'>
          {t("settings:danger.title")}
        </h3>
        <p className='text-sm text-muted-foreground'>
          {t("settings:danger.description")}
        </p>
      </div>

      <AlertDialog>
        <AlertDialogTrigger
          render={
            <Button variant='destructive'>{t("settings:danger.trigger")}</Button>
          }
        />
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("settings:danger.confirmTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              <Trans
                i18nKey='settings:danger.confirmDescription'
                values={{ username }}
                components={{ bold: <span className='font-semibold' /> }}
              />
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Input
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            placeholder={`@${username}`}
            autoCapitalize='none'
            spellCheck={false}
          />
          <AlertDialogFooter>
            <AlertDialogCancel>{t("settings:danger.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              variant='destructive'
              disabled={
                confirm.replace(/^@/, "") !== username ||
                deleteMutation.isPending
              }
              onClick={() => deleteMutation.mutate()}
            >
              {deleteMutation.isPending
                ? t("settings:danger.deleting")
                : t("settings:danger.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
