import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Badge } from "@zeyn/ui/components/badge";
import { Button } from "@zeyn/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@zeyn/ui/components/dropdown-menu";
import { Input } from "@zeyn/ui/components/input";
import { MoreHorizontal, Plus } from "lucide-react";
import { useState } from "react";
import z from "zod";

import { ConfirmDelete } from "@/shared/components/ConfirmDelete";
import { DataTable, type Column } from "@/shared/components/DataTable";
import { EmptyState } from "@/shared/components/EmptyState";
import { PageHeader } from "@/shared/components/PageHeader";
import { TablePager } from "@/shared/components/TablePager";
import { SubjectDialog } from "@/features/content/SubjectDialog";
import { trpc } from "@/shared/lib/trpc";
import { useAdminMutation } from "@/shared/lib/useAdminMutation";

const PAGE_SIZE = 25;

const searchSchema = z.object({
  q: z.string().optional(),
  offset: z.number().int().min(0).optional(),
});

interface SubjectRow {
  id: string;
  name: string;
  questionCount: number;
}

export const Route = createFileRoute("/_admin/subjects/")({
  validateSearch: searchSchema,
  component: SubjectsPage,
});

function SubjectsPage() {
  const { q, offset = 0 } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });

  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<SubjectRow | null>(null);
  const [deleting, setDeleting] = useState<SubjectRow | null>(null);

  const listInput = { search: q, limit: PAGE_SIZE, offset };
  const listQuery = useQuery(
    trpc.admin.content.listSubjects.queryOptions(listInput)
  );

  const deleteMutation = useAdminMutation(
    trpc.admin.content.deleteSubject.mutationOptions(),
    {
      successMessage: data =>
        data.deletedQuestions > 0
          ? `Subject and ${data.deletedQuestions} question(s) deleted`
          : "Subject deleted",
      invalidate: [trpc.admin.content.listSubjects.queryKey()],
      onDone: () => setDeleting(null),
    }
  );

  const columns: Column<SubjectRow>[] = [
    {
      id: "name",
      header: "Name",
      cell: row => <span className='font-medium'>{row.name}</span>,
    },
    {
      id: "questions",
      header: "Questions",
      className: "w-40 tabular-nums",
      cell: row => (
        <Badge tone={row.questionCount >= 5 ? "outline" : "destructive"}>
          {row.questionCount}
        </Badge>
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
                Rename
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
      <PageHeader
        eyebrow='Content'
        title='Subjects'
        description='Trivia categories used by buzzer rooms.'
      >
        <Button variant='brand' onClick={() => setCreating(true)}>
          <Plus />
          New subject
        </Button>
      </PageHeader>

      <Input
        placeholder='Search subjects'
        className='max-w-xs'
        defaultValue={q ?? ""}
        onChange={event => {
          const value = event.target.value.trim();
          navigate({
            search: { q: value || undefined, offset: undefined },
            replace: true,
          });
        }}
      />

      <div>
        <DataTable
          columns={columns}
          rows={listQuery.data?.items}
          isLoading={listQuery.isLoading}
          rowKey={row => row.id}
          onRowClick={row =>
            navigate({
              to: "/subjects/$subjectId",
              params: { subjectId: row.id },
            })
          }
          empty={
            <EmptyState
              title={q ? "No matching subjects" : "No subjects yet"}
              description={
                q
                  ? "Try a different search term."
                  : "Create a subject, then add at least five questions to it."
              }
            >
              {q ? null : (
                <Button variant='brand' onClick={() => setCreating(true)}>
                  <Plus />
                  New subject
                </Button>
              )}
            </EmptyState>
          }
        />
        {listQuery.data ? (
          <TablePager
            total={listQuery.data.total}
            limit={listQuery.data.limit}
            offset={listQuery.data.offset}
            onOffsetChange={next =>
              navigate({ search: prev => ({ ...prev, offset: next || undefined }) })
            }
          />
        ) : null}
      </div>

      <SubjectDialog
        open={creating || editing !== null}
        subject={editing}
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
        title={`Delete ${deleting?.name ?? "subject"}?`}
        description={
          deleting && deleting.questionCount > 0
            ? `This also deletes ${deleting.questionCount} question(s). Past game results are kept.`
            : "This cannot be undone."
        }
        isPending={deleteMutation.isPending}
        onConfirm={() => {
          if (deleting) {
            deleteMutation.mutate({ id: deleting.id, force: true });
          }
        }}
      />
    </div>
  );
}
