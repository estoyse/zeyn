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
import { Disc3, MoreHorizontal, Plus } from "lucide-react";
import { useState } from "react";
import z from "zod";

import { ConfirmDelete } from "@/shared/components/ConfirmDelete";
import { DataTable, type Column } from "@/shared/components/DataTable";
import type { ArtistListItem } from "@/shared/lib/api-types";
import { EmptyState } from "@/shared/components/EmptyState";
import { PageHeader } from "@/shared/components/PageHeader";
import { TablePager } from "@/shared/components/TablePager";
import {
  ArtistDialog,
  type ArtistSummary,
} from "@/features/content/ArtistDialog";
import { trpc } from "@/shared/lib/trpc";
import { useAdminMutation } from "@/shared/lib/useAdminMutation";

const PAGE_SIZE = 25;

const searchSchema = z.object({
  q: z.string().optional(),
  offset: z.number().int().min(0).optional(),
});

export const Route = createFileRoute("/_admin/artists/")({
  validateSearch: searchSchema,
  component: ArtistsPage,
});

function ArtistsPage() {
  const { q, offset = 0 } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });

  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<ArtistListItem | null>(null);
  const [deleting, setDeleting] = useState<ArtistListItem | null>(null);

  const listQuery = useQuery(
    trpc.admin.music.listArtists.queryOptions({
      search: q,
      limit: PAGE_SIZE,
      offset,
    })
  );

  const minSongs = listQuery.data?.minSongs ?? 3;

  const deleteMutation = useAdminMutation(
    trpc.admin.music.deleteArtist.mutationOptions(),
    {
      successMessage: data =>
        data.deletedSongs > 0
          ? `Artist and ${data.deletedSongs} song(s) deleted`
          : "Artist deleted",
      invalidate: [trpc.admin.music.listArtists.queryKey()],
      onDone: () => setDeleting(null),
    }
  );

  const columns: Column<ArtistListItem>[] = [
    {
      id: "artwork",
      header: "",
      className: "w-14",
      cell: row =>
        row.artworkUrl ? (
          <img
            src={row.artworkUrl}
            alt=''
            className='size-8 border object-cover'
          />
        ) : (
          <div className='flex size-8 items-center justify-center border bg-muted'>
            <Disc3 className='size-4 text-muted-foreground' />
          </div>
        ),
    },
    {
      id: "name",
      header: "Name",
      cell: row => <span className='font-medium'>{row.name}</span>,
    },
    {
      id: "songs",
      header: "Songs",
      className: "w-40 tabular-nums",
      cell: row => (
        <Badge tone={row.songCount >= minSongs ? "outline" : "destructive"}>
          {row.songCount}
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
      <PageHeader
        eyebrow='Content'
        title='Artists'
        description={`Music quiz artists. Rooms need at least ${minSongs} songs per artist.`}
      >
        <Button variant='brand' onClick={() => setCreating(true)}>
          <Plus />
          New artist
        </Button>
      </PageHeader>

      <Input
        placeholder='Search artists'
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
            navigate({ to: "/artists/$artistId", params: { artistId: row.id } })
          }
          empty={
            <EmptyState
              title={q ? "No matching artists" : "No artists yet"}
              description={
                q
                  ? "Try a different search term."
                  : `Create an artist, then add at least ${minSongs} songs with playable previews.`
              }
            >
              {q ? null : (
                <Button variant='brand' onClick={() => setCreating(true)}>
                  <Plus />
                  New artist
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
              navigate({
                search: prev => ({ ...prev, offset: next || undefined }),
              })
            }
          />
        ) : null}
      </div>

      <ArtistDialog
        open={creating || editing !== null}
        artist={editing}
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
        title={`Delete ${deleting?.name ?? "artist"}?`}
        description={
          deleting && deleting.songCount > 0
            ? `This also deletes ${deleting.songCount} song(s). Past game results are kept.`
            : "This cannot be undone."
        }
        isPending={deleteMutation.isPending}
        onConfirm={() => {
          if (deleting) deleteMutation.mutate({ id: deleting.id, force: true });
        }}
      />
    </div>
  );
}
