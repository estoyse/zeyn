import { useForm } from "@tanstack/react-form";
import { useEffect } from "react";
import z from "zod";

import { TextField } from "@/shared/components/FormField";
import { ResourceDialog } from "@/shared/components/ResourceDialog";
import { trpc } from "@/shared/lib/trpc";
import { useAdminMutation } from "@/shared/lib/useAdminMutation";

const banFormSchema = z.object({
  reason: z.string().trim().max(280),
  days: z.string().trim(),
});

export interface BanTarget {
  id: string;
  name: string;
  email: string;
}

interface BanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  target: BanTarget | null;
}

export function BanDialog({ open, onOpenChange, target }: BanDialogProps) {
  const banMutation = useAdminMutation(
    trpc.admin.users.ban.mutationOptions(),
    {
      successMessage: data =>
        data.revokedSessions > 0
          ? `User banned; ${data.revokedSessions} session(s) revoked`
          : "User banned",
      invalidate: [trpc.admin.users.list.queryKey()],
      onDone: () => onOpenChange(false),
    }
  );

  const form = useForm({
    defaultValues: { reason: "", days: "" },
    validators: { onSubmit: banFormSchema },
    onSubmit: ({ value }) => {
      if (!target) return;
      const days = Number(value.days);
      const expiresAt =
        value.days && Number.isFinite(days) && days > 0
          ? Date.now() + days * 24 * 60 * 60 * 1000
          : null;
      banMutation.mutate({
        userId: target.id,
        reason: value.reason || undefined,
        expiresAt,
      });
    },
  });

  useEffect(() => {
    if (open) form.reset({ reason: "", days: "" });
  }, [open, form]);

  return (
    <ResourceDialog
      open={open}
      onOpenChange={onOpenChange}
      title={`Ban ${target?.name ?? "user"}?`}
      description='Existing sessions are revoked immediately and sign-in is blocked. Leave the duration empty for a permanent ban.'
      submitLabel='Ban'
      isPending={banMutation.isPending}
      onSubmit={() => form.handleSubmit()}
    >
      <form.Field name='reason'>
        {field => (
          <TextField
            field={field}
            label='Reason'
            placeholder='Visible in the audit log (optional)'
            multiline
            rows={3}
          />
        )}
      </form.Field>
      <form.Field name='days'>
        {field => (
          <TextField
            field={field}
            label='Duration in days'
            placeholder='Empty = permanent'
          />
        )}
      </form.Field>
    </ResourceDialog>
  );
}
