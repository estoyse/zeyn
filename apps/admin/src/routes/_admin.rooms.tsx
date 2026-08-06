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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@zeyn/ui/components/select";
import { MoreHorizontal } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import z from "zod";

import { ConfirmDelete } from "@/shared/components/ConfirmDelete";
import { DataTable, type Column } from "@/shared/components/DataTable";
import { EmptyState } from "@/shared/components/EmptyState";
import { PageHeader } from "@/shared/components/PageHeader";
import { RoomStatusBadge } from "@/features/rooms/RoomStatusBadge";
import { formatDateTime, formatRelative } from "@/shared/lib/format";
import type { RouterOutputs } from "@/shared/lib/api-types";
import { trpc } from "@/shared/lib/trpc";
import { useAdminMutation } from "@/shared/lib/useAdminMutation";

type RoomRow = RouterOutputs["admin"]["rooms"]["listActive"]["items"][number];

const searchSchema = z.object({
  status: z.enum(["waiting", "playing", "finished"]).optional(),
  gameType: z.string().optional(),
});

export const Route = createFileRoute("/_admin/rooms")({
  validateSearch: searchSchema,
  component: RoomsPage,
});

function RoomsPage() {
  const { status, gameType } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const [closing, setClosing] = useState<RoomRow | null>(null);

  const listQuery = useQuery({
    ...trpc.admin.rooms.listActive.queryOptions({ status, gameType, limit: 50 }),
    refetchInterval: 5000,
  });
  const typesQuery = useQuery(trpc.admin.rooms.gameTypes.queryOptions());

  const closeMutation = useAdminMutation(
    trpc.admin.rooms.forceClose.mutationOptions(),
    {
      successMessage: data =>
        data.closedSockets > 0
          ? `Room closed; ${data.closedSockets} connection(s) dropped`
          : "Room closed",
      invalidate: [trpc.admin.rooms.listActive.queryKey()],
      onDone: () => setClosing(null),
    }
  );

  const purgeMutation = useAdminMutation(
    trpc.admin.rooms.purgeFinished.mutationOptions(),
    {
      successMessage: data => `${data.deleted} finished room(s) purged`,
      invalidate: [trpc.admin.rooms.listActive.queryKey()],
    }
  );

  const columns: Column<RoomRow>[] = [
    {
      id: "id",
      header: "Code",
      className: "w-24",
      cell: row => <span className='font-mono text-xs'>{row.id}</span>,
    },
    {
      id: "name",
      header: "Room",
      cell: row => <span className='font-medium'>{row.name}</span>,
    },
    {
      id: "gameType",
      header: "Type",
      className: "w-32",
      cell: row => <Badge tone='outline'>{row.gameType}</Badge>,
    },
    {
      id: "status",
      header: "Status",
      className: "w-28",
      cell: row => <RoomStatusBadge status={row.status} />,
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
      id: "visibility",
      header: "Access",
      className: "w-36",
      cell: row => (
        <span className='text-xs text-muted-foreground uppercase'>
          {row.isPublic ? "public" : "private"}
          {row.allowGuests ? " · guests" : ""}
        </span>
      ),
    },
    {
      id: "created",
      header: "Created",
      className: "w-36",
      cell: row => (
        <span
          className='text-muted-foreground tabular-nums'
          title={formatDateTime(row.createdAt)}
        >
          {formatRelative(row.createdAt)}
        </span>
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
              <DropdownMenuItem
                onClick={() => {
                  void navigator.clipboard.writeText(row.id);
                  toast.success("Room code copied");
                }}
              >
                Copy code
              </DropdownMenuItem>
              <DropdownMenuItem
                variant='destructive'
                disabled={row.status === "finished"}
                onClick={() => setClosing(row)}
              >
                Force close
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
        eyebrow='Activity'
        title='Live rooms'
        description='Refreshes every 5 seconds.'
      >
        <Button
          variant='outline'
          disabled={purgeMutation.isPending}
          onClick={() => purgeMutation.mutate({ olderThanDays: 7 })}
        >
          Purge finished &gt; 7d
        </Button>
      </PageHeader>

      <div className='flex flex-wrap items-center gap-2'>
        <Select
          value={status ?? "all"}
          onValueChange={value =>
            navigate({
              search: prev => ({
                ...prev,
                status:
                  value === "all" || !value
                    ? undefined
                    : (value as "waiting" | "playing" | "finished"),
              }),
            })
          }
        >
          <SelectTrigger className='w-44'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>All statuses</SelectItem>
            <SelectItem value='waiting'>Waiting</SelectItem>
            <SelectItem value='playing'>Playing</SelectItem>
            <SelectItem value='finished'>Finished</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={gameType ?? "all"}
          onValueChange={value =>
            navigate({
              search: prev => ({
                ...prev,
                gameType: value === "all" || !value ? undefined : String(value),
              }),
            })
          }
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
      </div>

      <DataTable
        columns={columns}
        rows={listQuery.data?.items}
        isLoading={listQuery.isLoading}
        rowKey={row => row.id}
        empty={<EmptyState title='No rooms match these filters' />}
      />

      <ConfirmDelete
        open={closing !== null}
        onOpenChange={open => {
          if (!open) setClosing(null);
        }}
        title={`Force close ${closing?.name ?? "room"}?`}
        description='Everyone is disconnected immediately and the room is marked finished. Scores are NOT saved.'
        confirmLabel='Force close'
        isPending={closeMutation.isPending}
        onConfirm={() => {
          if (closing) closeMutation.mutate({ id: closing.id });
        }}
      />
    </div>
  );
}
