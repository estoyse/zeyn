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
import { useState } from "react";
import z from "zod";

import { DataTable, type Column } from "@/shared/components/DataTable";
import { EmptyState } from "@/shared/components/EmptyState";
import { PageHeader } from "@/shared/components/PageHeader";
import { formatDateTime } from "@/shared/lib/format";
import type { RouterOutputs } from "@/shared/lib/api-types";
import { trpc } from "@/shared/lib/trpc";

type HistoryRow =
  RouterOutputs["admin"]["rooms"]["listHistory"]["items"][number];

const searchSchema = z.object({
  gameType: z.string().optional(),
});

function parseSubjects(raw: string): string[] {
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === "string")
      : [];
  } catch {
    return [];
  }
}

export const Route = createFileRoute("/_admin/history/")({
  validateSearch: searchSchema,
  component: HistoryPage,
});

function HistoryPage() {
  const { gameType } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const [cursors, setCursors] = useState<(number | undefined)[]>([undefined]);

  const page = cursors.length - 1;
  const cursor = cursors[page];

  const listQuery = useQuery(
    trpc.admin.rooms.listHistory.queryOptions({ gameType, cursor, limit: 25 })
  );
  const typesQuery = useQuery(trpc.admin.rooms.gameTypes.queryOptions());

  const columns: Column<HistoryRow>[] = [
    {
      id: "gameId",
      header: "Code",
      className: "w-24",
      cell: row => <span className='font-mono text-xs'>{row.gameId}</span>,
    },
    {
      id: "gameType",
      header: "Type",
      className: "w-32",
      cell: row => <Badge tone='outline'>{row.gameType}</Badge>,
    },
    {
      id: "host",
      header: "Host",
      className: "w-48",
      cell: row => (
        <span className='truncate text-muted-foreground'>
          {row.hostName ?? "—"}
        </span>
      ),
    },
    {
      id: "subjects",
      header: "Subjects",
      cell: row => {
        const names = parseSubjects(row.subjects);
        if (names.length === 0) {
          return <span className='text-muted-foreground'>—</span>;
        }
        return (
          <div className='flex flex-wrap gap-1'>
            {names.slice(0, 4).map(name => (
              <Badge key={name} tone='default'>
                {name}
              </Badge>
            ))}
            {names.length > 4 ? (
              <Badge tone='outline'>+{names.length - 4}</Badge>
            ) : null}
          </div>
        );
      },
    },
    {
      id: "players",
      header: "Players",
      className: "w-24 tabular-nums",
      cell: row => row.playerCount,
    },
    {
      id: "played",
      header: "Played",
      className: "w-44",
      cell: row => (
        <span className='text-muted-foreground tabular-nums'>
          {formatDateTime(row.createdAt)}
        </span>
      ),
    },
  ];

  return (
    <div className='space-y-6'>
      <PageHeader
        eyebrow='Activity'
        title='History'
        description='Completed games and their scoreboards.'
      />

      <Select
        value={gameType ?? "all"}
        onValueChange={value => {
          setCursors([undefined]);
          navigate({
            search: {
              gameType: value === "all" || !value ? undefined : String(value),
            },
          });
        }}
      >
        <SelectTrigger className='w-44'>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value='all'>All game types</SelectItem>
          {(typesQuery.data ?? []).map(type => (
            <SelectItem key={type} value={type}>
              {type}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <DataTable
        columns={columns}
        rows={listQuery.data?.items}
        isLoading={listQuery.isLoading}
        rowKey={row => row.id}
        onRowClick={row =>
          navigate({ to: "/history/$historyId", params: { historyId: row.id } })
        }
        empty={<EmptyState title='No games played yet' />}
      />

      <div className='flex items-center justify-between'>
        <Button
          variant='outline'
          size='sm'
          disabled={page === 0}
          onClick={() => setCursors(prev => prev.slice(0, -1))}
        >
          Previous
        </Button>
        <span className='text-xs tracking-widest text-muted-foreground uppercase'>
          Page {page + 1}
        </span>
        <Button
          variant='outline'
          size='sm'
          disabled={!listQuery.data?.nextCursor}
          onClick={() =>
            setCursors(prev => [...prev, listQuery.data?.nextCursor ?? undefined])
          }
        >
          Next
        </Button>
      </div>
    </div>
  );
}
