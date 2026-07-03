import { useState } from "react";
import { Button } from "@zeyn/ui/components/button";
import { Input } from "@zeyn/ui/components/input";
import { Label } from "@zeyn/ui/components/label";
import { authClient } from "@/features/auth/lib/auth-client";
import { newPasswordSchema } from "@/features/auth/lib/authSchemas";
import { toast } from "sonner";

export function PasswordSettings() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [pending, setPending] = useState(false);

  const canSave =
    currentPassword.length > 0 &&
    newPasswordSchema.safeParse(newPassword).success &&
    !pending;

  const handleSave = async () => {
    setPending(true);
    await authClient.changePassword(
      { currentPassword, newPassword, revokeOtherSessions: true },
      {
        onSuccess: () => {
          toast.success("Password changed");
          setCurrentPassword("");
          setNewPassword("");
        },
        onError: error => {
          toast.error(error.error.message || "Could not change password");
        },
      }
    );
    setPending(false);
  };

  return (
    <div className='space-y-6'>
      <div className='space-y-2'>
        <Label htmlFor='current-password'>Current password</Label>
        <Input
          id='current-password'
          type='password'
          value={currentPassword}
          onChange={e => setCurrentPassword(e.target.value)}
          autoComplete='current-password'
        />
      </div>
      <div className='space-y-2'>
        <Label htmlFor='new-password'>New password</Label>
        <Input
          id='new-password'
          type='password'
          value={newPassword}
          onChange={e => setNewPassword(e.target.value)}
          autoComplete='new-password'
        />
        <p className='text-xs text-muted-foreground'>
          At least 8 characters and 1 number.
        </p>
      </div>
      <Button variant='outline' disabled={!canSave} onClick={handleSave}>
        {pending ? "Saving…" : "Change password"}
      </Button>
    </div>
  );
}
