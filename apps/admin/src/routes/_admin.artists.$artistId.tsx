import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { Button } from "@zeyn/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@zeyn/ui/components/dropdown-menu";
import { ArrowLeft, Disc3, MoreHorizontal, Plus } from "lucide-react";
import { useState } from "react";

import { ConfirmDelete } from "@/shared/components/ConfirmDelete";
import { DataTable, type Column } from "@/shared/components/DataTable";
import { EmptyState } from "@/shared/components/EmptyState";
import { PageHeader } from "@/shared/components/PageHeader";
import { ArtistDialog } from "@/features/content/ArtistDialog";
import { PreviewButton } from "@/features/content/PreviewButton";
import { SongDialog, type SongSummary } from "@/features/content/SongDialog";
import { trpc } from "@/shared/lib/trpc";
import { useAdminMutation } from "@/shared/lib/useAdminMutation";

export const Route = createFileRoute("/_admin/artists/$artistId")({
  component: ArtistDetailPage,
});

function ArtistDetailPage() {
  const { artistId } = Route.useParams();

  const [editingArtist, setEditingArtist] = useState(false);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<SongSummary | null>(null);
  const [deleting, setDeleting] = useState<SongSummary | null>(null);

  const artistQuery = useQuery(
    trpc.admin.music.getArtist.queryOptions({ id: artistId })
  );

  const deleteMutation = useAdminMutation(
    trpc.admin.music.deleteSong.mutationOptions(),
    {
      successMessage: "Song deleted",
      invalidate: [
        trpc.admin.music.getArtist.queryKey({ id: artistId }),
        trpc.admin.music.listArtists.queryKey(),
      ],
      onDone: () => setDeleting(null),
    }
  );

  const artist = artistQuery.data;
  const songs = artist?.songs ?? [];
  const belowMinimum = artist !== undefined && songs.length < artist.minSongs;

  const columns: Column<SongSummary>[] = [
    {
      id: "preview",
      header: "",
      className: "w-14",
      cell: row => (
        <div data-row-action>
          <PreviewButton url={row.previewUrl} />
        </div>
      ),
    },
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
      id: "title",
      header: "Title",
      cell: row => <span className='font-medium'>{row.title}</span>,
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
        to='/artists'
        className='inline-flex items-center gap-1.5 text-xs tracking-widest text-muted-foreground uppercase hover:text-foreground'
      >
        <ArrowLeft className='size-3.5' />
        Artists
      </Link>

      <PageHeader
        eyebrow='Artist'
        title={artist?.name ?? "…"}
        description={
          artist
            ? `${songs.length} song(s). Music rooms need at least ${artist.minSongs}.`
            : undefined
        }
      >
        <Button variant='outline' onClick={() => setEditingArtist(true)}>
          Edit
        </Button>
        <Button variant='brand' onClick={() => setCreating(true)}>
          <Plus />
          Add song
        </Button>
      </PageHeader>

      {belowMinimum ? (
        <p className='border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive'>
          This artist has fewer than {artist.minSongs} songs, so a music room
          built from it will fail to generate questions.
        </p>
      ) : null}

      <DataTable
        columns={columns}
        rows={songs}
        isLoading={artistQuery.isLoading}
        rowKey={row => row.id}
        onRowClick={row => setEditing(row)}
        empty={
          <EmptyState
            title='No songs yet'
            description='Every song needs a playable preview URL.'
          >
            <Button variant='brand' onClick={() => setCreating(true)}>
              <Plus />
              Add song
            </Button>
          </EmptyState>
        }
      />

      <ArtistDialog
        open={editingArtist}
        artist={
          artist
            ? {
                id: artist.id,
                name: artist.name,
                artworkUrl: artist.artworkUrl,
              }
            : null
        }
        onOpenChange={setEditingArtist}
      />

      <SongDialog
        open={creating || editing !== null}
        artistId={artistId}
        song={editing}
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
        title='Delete song?'
        description='Past game results keep their scores. This cannot be undone.'
        isPending={deleteMutation.isPending}
        onConfirm={() => {
          if (deleting) deleteMutation.mutate({ id: deleting.id });
        }}
      />
    </div>
  );
}
