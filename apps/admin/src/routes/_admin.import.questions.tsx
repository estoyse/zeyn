import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Badge } from "@zeyn/ui/components/badge";
import { Button } from "@zeyn/ui/components/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@zeyn/ui/components/select";
import { Switch } from "@zeyn/ui/components/switch";
import { Tabs, TabsList, TabsTrigger } from "@zeyn/ui/components/tabs";
import { Textarea } from "@zeyn/ui/components/textarea";
import { useMemo, useState } from "react";
import z from "zod";

import { DataTable, type Column } from "@/shared/components/DataTable";
import { PageHeader } from "@/shared/components/PageHeader";
import {
  parseQuestions,
  type ParsedRow,
} from "@/features/import/lib/parseQuestions";
import { trpc } from "@/shared/lib/trpc";
import { useAdminMutation } from "@/shared/lib/useAdminMutation";

const searchSchema = z.object({
  subjectId: z.string().optional(),
});

export const Route = createFileRoute("/_admin/import/questions")({
  validateSearch: searchSchema,
  component: ImportQuestionsPage,
});

const CSV_EXAMPLE = `text,answer,points
Which planet is closest to the Sun?,Mercury,10
"Who wrote ""Hamlet""?",Shakespeare,20`;

const JSON_EXAMPLE = `[
  { "text": "Which planet is closest to the Sun?", "answer": "Mercury", "points": 10 }
]`;

function ImportQuestionsPage() {
  const { subjectId: initialSubjectId } = Route.useSearch();
  const navigate = useNavigate();

  const [step, setStep] = useState<"paste" | "preview">("paste");
  const [format, setFormat] = useState<"csv" | "json">("csv");
  const [raw, setRaw] = useState("");
  const [subjectId, setSubjectId] = useState(initialSubjectId ?? "");
  const [onlyErrors, setOnlyErrors] = useState(false);

  const subjectsQuery = useQuery(
    trpc.admin.content.listSubjects.queryOptions({ limit: 100, offset: 0 })
  );

  const rows = useMemo(
    () => (step === "preview" ? parseQuestions(raw, format) : []),
    [step, raw, format]
  );

  const valid = rows.filter(row => row.ok);
  const invalid = rows.filter(row => !row.ok);
  const duplicates = valid.filter(row => row.duplicate);
  const visibleRows = onlyErrors ? invalid : rows;

  const importMutation = useAdminMutation(
    trpc.admin.import.bulkImportQuestions.mutationOptions(),
    {
      successMessage: data =>
        data.duplicates > 0
          ? `${data.created} question(s) imported, ${data.duplicates} duplicate(s) skipped`
          : `${data.created} question(s) imported`,
      invalidate: [
        trpc.admin.content.listSubjects.queryKey(),
        ...(subjectId
          ? [trpc.admin.content.getSubject.queryKey({ id: subjectId })]
          : []),
      ],
      onDone: () => {
        if (subjectId) {
          navigate({ to: "/subjects/$subjectId", params: { subjectId } });
        }
      },
    }
  );

  const columns: Column<ParsedRow>[] = [
    {
      id: "index",
      header: "#",
      className: "w-12 tabular-nums",
      cell: row => row.index + 1,
    },
    {
      id: "text",
      header: "Question",
      cell: row =>
        row.value ? (
          <span className='line-clamp-2'>{row.value.text}</span>
        ) : (
          <span className='line-clamp-2 font-mono text-xs text-muted-foreground'>
            {row.raw}
          </span>
        ),
    },
    {
      id: "answer",
      header: "Answer",
      className: "w-56",
      cell: row => row.value?.answer ?? "—",
    },
    {
      id: "points",
      header: "Points",
      className: "w-20 tabular-nums",
      cell: row => row.value?.points ?? "—",
    },
    {
      id: "status",
      header: "Status",
      className: "w-72",
      cell: row =>
        row.ok ? (
          row.duplicate ? (
            <Badge tone='warning'>Duplicate in paste</Badge>
          ) : (
            <Badge tone='success'>OK</Badge>
          )
        ) : (
          <Badge tone='destructive'>{row.error}</Badge>
        ),
    },
  ];

  return (
    <div className='space-y-6'>
      <PageHeader
        eyebrow='Content'
        title='Bulk import questions'
        description='Paste rows, review what will be created, then import in one request.'
      />

      {step === "paste" ? (
        <div className='space-y-4 border p-6'>
          <div className='flex flex-wrap items-end gap-4'>
            <div className='space-y-1.5'>
              <p className='text-[10px] font-black tracking-[0.3em] text-muted-foreground uppercase'>
                Subject
              </p>
              <Select
                value={subjectId}
                onValueChange={value => setSubjectId(String(value ?? ""))}
              >
                <SelectTrigger className='w-64'>
                  <SelectValue placeholder='Choose a subject' />
                </SelectTrigger>
                <SelectContent>
                  {(subjectsQuery.data?.items ?? []).map(subject => (
                    <SelectItem key={subject.id} value={subject.id}>
                      {subject.name} ({subject.questionCount})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Tabs
              value={format}
              onValueChange={value => setFormat(value as "csv" | "json")}
            >
              <TabsList>
                <TabsTrigger value='csv'>CSV</TabsTrigger>
                <TabsTrigger value='json'>JSON</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <Textarea
            className='min-h-80 font-mono text-xs'
            placeholder={format === "csv" ? CSV_EXAMPLE : JSON_EXAMPLE}
            value={raw}
            onChange={event => setRaw(event.target.value)}
          />

          <details className='text-sm text-muted-foreground'>
            <summary className='cursor-pointer'>Expected format</summary>
            <pre className='mt-2 overflow-x-auto border bg-muted p-3 text-xs'>
              {format === "csv" ? CSV_EXAMPLE : JSON_EXAMPLE}
            </pre>
            <p className='mt-2'>
              CSV: a <code>text,answer,points</code> header is optional; without
              one the columns are read in that order. Points must be a whole
              number between 1 and 1000.
            </p>
          </details>

          <div className='flex justify-end'>
            <Button
              variant='brand'
              disabled={!raw.trim() || !subjectId}
              onClick={() => setStep("preview")}
            >
              Preview
            </Button>
          </div>
        </div>
      ) : (
        <div className='space-y-4'>
          <div className='flex flex-wrap items-center justify-between gap-4 border px-4 py-3'>
            <p className='text-[10px] font-black tracking-[0.3em] uppercase'>
              <span className='text-success'>{valid.length} valid</span>
              {" · "}
              <span className='text-destructive'>
                {invalid.length} skipped
              </span>
              {duplicates.length > 0 ? (
                <>
                  {" · "}
                  <span className='text-warning'>
                    {duplicates.length} duplicate
                  </span>
                </>
              ) : null}
            </p>
            <label className='flex items-center gap-2 text-sm'>
              <Switch checked={onlyErrors} onCheckedChange={setOnlyErrors} />
              Show only errors
            </label>
          </div>

          <DataTable
            columns={columns}
            rows={visibleRows}
            isLoading={false}
            rowKey={row => `${row.index}-${row.raw.slice(0, 24)}`}
            empty={
              <p className='border border-dashed p-8 text-center text-sm text-muted-foreground'>
                Nothing to show.
              </p>
            }
          />

          <div className='sticky bottom-0 flex items-center justify-between gap-4 border-t bg-background py-4'>
            <Button variant='outline' onClick={() => setStep("paste")}>
              Back to edit
            </Button>
            <Button
              variant='brand'
              disabled={valid.length === 0 || importMutation.isPending}
              onClick={() =>
                importMutation.mutate({
                  subjectId,
                  rows: valid.map(row => row.value!),
                })
              }
            >
              Import {valid.length} question(s)
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
