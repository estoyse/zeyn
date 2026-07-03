import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
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
  const navigate = useNavigate();
  const [confirm, setConfirm] = useState("");

  const deleteMutation = useMutation(
    trpc.profile.deleteAccount.mutationOptions({
      onSuccess: async () => {
        await authClient.signOut();
        toast.success("Your account has been deleted");
        navigate({ to: "/" });
      },
      onError: error => toast.error(error.message),
    })
  );

  return (
    <div className='space-y-4 border border-destructive/40 bg-destructive/5 p-6'>
      <div className='space-y-1'>
        <h3 className='font-semibold text-destructive'>Delete account</h3>
        <p className='text-sm text-muted-foreground'>
          Permanently delete your account and all of your game history. This
          cannot be undone.
        </p>
      </div>

      <AlertDialog>
        <AlertDialogTrigger
          render={<Button variant='destructive'>Delete account</Button>}
        />
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete your account?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes your profile, stats, and game history.
              Type <span className='font-semibold'>@{username}</span> to
              confirm.
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
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant='destructive'
              disabled={
                confirm.replace(/^@/, "") !== username ||
                deleteMutation.isPending
              }
              onClick={() => deleteMutation.mutate()}
            >
              {deleteMutation.isPending ? "Deleting…" : "Delete forever"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
