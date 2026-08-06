import { useForm } from "@tanstack/react-form";
import { useEffect } from "react";

import { NumberField, TextField } from "@/shared/components/FormField";
import { ResourceDialog } from "@/shared/components/ResourceDialog";
import { questionFormSchema } from "@/features/content/lib/schemas";
import { trpc } from "@/shared/lib/trpc";
import { useAdminMutation } from "@/shared/lib/useAdminMutation";

export interface QuestionSummary {
  id: string;
  text: string;
  answer: string;
  points: number;
}

interface QuestionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subjectId: string;
  question: QuestionSummary | null;
}

export function QuestionDialog({
  open,
  onOpenChange,
  subjectId,
  question,
}: QuestionDialogProps) {
  const isEdit = question !== null;

  const invalidate = [
    trpc.admin.content.getSubject.queryKey({ id: subjectId }),
    trpc.admin.content.listSubjects.queryKey(),
  ];

  const createMutation = useAdminMutation(
    trpc.admin.content.createQuestion.mutationOptions(),
    {
      successMessage: "Question added",
      invalidate,
      onDone: () => onOpenChange(false),
    }
  );

  const updateMutation = useAdminMutation(
    trpc.admin.content.updateQuestion.mutationOptions(),
    {
      successMessage: "Question updated",
      invalidate,
      onDone: () => onOpenChange(false),
    }
  );

  const form = useForm({
    defaultValues: {
      text: question?.text ?? "",
      answer: question?.answer ?? "",
      points: question?.points ?? 10,
    },
    validators: { onSubmit: questionFormSchema },
    onSubmit: ({ value }) => {
      if (question) {
        updateMutation.mutate({ id: question.id, ...value });
      } else {
        createMutation.mutate({ subjectId, ...value });
      }
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        text: question?.text ?? "",
        answer: question?.answer ?? "",
        points: question?.points ?? 10,
      });
    }
  }, [open, question, form]);

  return (
    <ResourceDialog
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? "Edit question" : "New question"}
      description='Answers are matched fuzzily during play, so minor typos still count.'
      submitLabel={isEdit ? "Save" : "Add"}
      isPending={createMutation.isPending || updateMutation.isPending}
      onSubmit={() => form.handleSubmit()}
    >
      <form.Field name='text'>
        {field => (
          <TextField
            field={field}
            label='Question'
            placeholder='Which planet is closest to the Sun?'
            multiline
          />
        )}
      </form.Field>
      <form.Field name='answer'>
        {field => (
          <TextField field={field} label='Answer' placeholder='Mercury' />
        )}
      </form.Field>
      <form.Field name='points'>
        {field => (
          <NumberField field={field} label='Points' min={1} max={1000} />
        )}
      </form.Field>
    </ResourceDialog>
  );
}
