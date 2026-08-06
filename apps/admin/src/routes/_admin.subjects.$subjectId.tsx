import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { Badge } from "@zeyn/ui/components/badge";
import { Button } from "@zeyn/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@zeyn/ui/components/dropdown-menu";
import { ArrowLeft, MoreHorizontal, Plus } from "lucide-react";
import { useState } from "react";

import { ConfirmDelete } from "@/shared/components/ConfirmDelete";
import { DataTable, type Column } from "@/shared/components/DataTable";
import { EmptyState } from "@/shared/components/EmptyState";
import { PageHeader } from "@/shared/components/PageHeader";
import { QuestionDialog } from "@/features/content/QuestionDialog";
import type { QuestionItem } from "@/shared/lib/api-types";
import { SubjectDialog } from "@/features/content/SubjectDialog";
import { trpc } from "@/shared/lib/trpc";
import { useAdminMutation } from "@/shared/lib/useAdminMutation";

export const Route = createFileRoute("/_admin/subjects/$subjectId")({
  component: SubjectDetailPage,
});

function SubjectDetailPage() {
  const { subjectId } = Route.useParams();

  const [renaming, setRenaming] = useState(false);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<QuestionItem | null>(null);
  const [deleting, setDeleting] = useState<QuestionItem | null>(null);

  const subjectQuery = useQuery(
    trpc.admin.content.getSubject.queryOptions({ id: subjectId })
  );

  const deleteMutation = useAdminMutation(
    trpc.admin.content.deleteQuestion.mutationOptions(),
    {
      successMessage: "Question deleted",
      invalidate: [
        trpc.admin.content.getSubject.queryKey({ id: subjectId }),
        trpc.admin.content.listSubjects.queryKey(),
      ],
      onDone: () => setDeleting(null),
    }
  );

  const subject = subjectQuery.data;
  const questions = subject?.questions ?? [];
  const belowMinimum =
    subject !== undefined && questions.length < subject.minQuestions;

  const columns: Column<QuestionItem>[] = [
    {
      id: "points",
      header: "Points",
      className: "w-24 tabular-nums",
      cell: row => <Badge tone='outline'>{row.points}</Badge>,
    },
    {
      id: "text",
      header: "Question",
      cell: row => <span className='line-clamp-2'>{row.text}</span>,
    },
    {
      id: "answer",
      header: "Answer",
      className: "w-64",
      cell: row => (
        <span className='text-muted-foreground'>{row.answer}</span>
      ),
    },
    {
      id: "actions",
      header: "",
      className: "w-12",
      cell: row => (
        <div data-row-action>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={<Button variant='ghost' size='icon-xs' />}
            >
              <MoreHorizontal />
              <span className='sr-only'>Actions</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end'>
              <DropdownMenuItem onClick={() => setEditing(row)}>
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                variant='destructive'
                onClick={() => setDeleting(row)}
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ];

  return (
    <div className='space-y-6'>
      <Link
        to='/subjects'
        className='inline-flex items-center gap-1.5 text-xs tracking-widest text-muted-foreground uppercase hover:text-foreground'
      >
        <ArrowLeft className='size-3.5' />
        Subjects
      </Link>

      <PageHeader
        eyebrow='Subject'
        title={subject?.name ?? "…"}
        description={
          subject
            ? `${questions.length} question(s). Games need at least ${subject.minQuestions}.`
            : undefined
        }
      >
        <Button variant='outline' onClick={() => setRenaming(true)}>
          Rename
        </Button>
        <Button variant='brand' onClick={() => setCreating(true)}>
          <Plus />
          Add question
        </Button>
      </PageHeader>

      {belowMinimum ? (
        <p className='border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive'>
          This subject has fewer than {subject.minQuestions} questions and will
          not fill a buzzer board.
        </p>
      ) : null}

      <DataTable
        columns={columns}
        rows={questions}
        isLoading={subjectQuery.isLoading}
        rowKey={row => row.id}
        onRowClick={row => setEditing(row)}
        empty={
          <EmptyState
            title='No questions yet'
            description='Add questions at increasing point values, typically 10 through 50.'
          >
            <Button variant='brand' onClick={() => setCreating(true)}>
              <Plus />
              Add question
            </Button>
          </EmptyState>
        }
      />

      <SubjectDialog
        open={renaming}
        subject={subject ? { id: subject.id, name: subject.name } : null}
        onOpenChange={setRenaming}
      />

      <QuestionDialog
        open={creating || editing !== null}
        subjectId={subjectId}
        question={editing}
        onOpenChange={open => {
          if (!open) {
            setCreating(false);
            setEditing(null);
          }
        }}
      />

      <ConfirmDelete
        open={deleting !== null}
        onOpenChange={open => {
          if (!open) setDeleting(null);
        }}
        title='Delete question?'
        description='Past game results keep their scores. This cannot be undone.'
        isPending={deleteMutation.isPending}
        onConfirm={() => {
          if (deleting) deleteMutation.mutate({ id: deleting.id });
        }}
      />
    </div>
  );
}
