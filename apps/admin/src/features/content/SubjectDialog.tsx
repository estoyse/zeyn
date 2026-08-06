import { useForm } from "@tanstack/react-form";
import { useEffect } from "react";

import { ResourceDialog } from "@/shared/components/ResourceDialog";
import { TextField } from "@/shared/components/FormField";
import { subjectFormSchema } from "@/features/content/lib/schemas";
import { trpc } from "@/shared/lib/trpc";
import { useAdminMutation } from "@/shared/lib/useAdminMutation";

export interface SubjectSummary {
  id: string;
  name: string;
}

interface SubjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subject: SubjectSummary | null;
}

export function SubjectDialog({
  open,
  onOpenChange,
  subject,
}: SubjectDialogProps) {
  const isEdit = subject !== null;

  const invalidate = [
    trpc.admin.content.listSubjects.queryKey(),
    ...(subject ? [trpc.admin.content.getSubject.queryKey({ id: subject.id })] : []),
  ];

  const createMutation = useAdminMutation(
    trpc.admin.content.createSubject.mutationOptions(),
    {
      successMessage: "Subject created",
      invalidate,
      onDone: () => onOpenChange(false),
    }
  );

  const updateMutation = useAdminMutation(
    trpc.admin.content.updateSubject.mutationOptions(),
    {
      successMessage: "Subject renamed",
      invalidate,
      onDone: () => onOpenChange(false),
    }
  );

  const form = useForm({
    defaultValues: { name: subject?.name ?? "" },
    validators: { onSubmit: subjectFormSchema },
    onSubmit: ({ value }) => {
      if (subject) {
        updateMutation.mutate({ id: subject.id, name: value.name });
      } else {
        createMutation.mutate({ name: value.name });
      }
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({ name: subject?.name ?? "" });
    }
  }, [open, subject, form]);

  return (
    <ResourceDialog
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? "Rename subject" : "New subject"}
      submitLabel={isEdit ? "Save" : "Create"}
      isPending={createMutation.isPending || updateMutation.isPending}
      onSubmit={() => form.handleSubmit()}
    >
      <form.Field name='name'>
        {field => (
          <TextField
            field={field}
            label='Name'
            placeholder='e.g. Geography'
          />
        )}
      </form.Field>
    </ResourceDialog>
  );
}
