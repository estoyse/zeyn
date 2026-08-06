import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Badge } from "@zeyn/ui/components/badge";
import { Button } from "@zeyn/ui/components/button";
import { Input } from "@zeyn/ui/components/input";
import { Disc3, Search } from "lucide-react";
import { useEffect, useState } from "react";

import { EmptyState } from "@/shared/components/EmptyState";
import { PageHeader } from "@/shared/components/PageHeader";
import { trpc } from "@/shared/lib/trpc";
import { useAdminMutation } from "@/shared/lib/useAdminMutation";

function isRateLimited(error: unknown): boolean {
  return (
    (error as { data?: { code?: string } | null } | null)?.data?.code ===
    "TOO_MANY_REQUESTS"
  );
}

export const Route = createFileRoute("/_admin/import/music")({
  component: ImportMusicPage,
});

function ImportMusicPage() {
  const navigate = useNavigate();
  const [term, setTerm] = useState("");
  const [debounced, setDebounced] = useState("");
  const [importing, setImporting] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(term.trim()), 700);
    return () => clearTimeout(timer);
  }, [term]);

  const searchQuery = useQuery({
    ...trpc.admin.import.searchItunes.queryOptions({ term: debounced }),
    enabled: debounced.length >= 2,
    retry: false,
    staleTime: 60 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const importMutation = useAdminMutation(
    trpc.admin.import.importItunesArtist.mutationOptions(),
    {
      successMessage: data =>
        `${data.artistName}: ${data.songsFetched} song(s) imported (${data.songsTotal} total)`,
      invalidate: [
        trpc.admin.music.listArtists.queryKey(),
        trpc.admin.import.searchItunes.queryKey(),
      ],
      onDone: () => setImporting(null),
    }
  );

  const result = searchQuery.data;

  return (
    <div className='space-y-6'>
      <PageHeader
        eyebrow='Content'
        title='Import from iTunes'
        description='The server queries the iTunes Search API and stores only tracks that have a playable preview.'
      />

      <div className='relative max-w-md'>
        <Search className='pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground' />
        <Input
          className='pl-9'
          placeholder='Search an artist'
          value={term}
          onChange={event => setTerm(event.target.value)}
        />
      </div>

      {debounced.length < 2 ? (
        <EmptyState
          title='Search for an artist'
          description='Type at least two characters.'
        />
      ) : searchQuery.isLoading ? (
        <p className='text-sm text-muted-foreground'>Searching…</p>
      ) : searchQuery.isError ? (
        <EmptyState
          title={isRateLimited(searchQuery.error) ? "Rate limited by iTunes" : "Search failed"}
          description={
            isRateLimited(searchQuery.error)
              ? "iTunes allows only a handful of searches per minute and the limit is shared across everything running on this Worker. Wait about a minute, then try again — repeating a search you already ran is free, because results are cached for an hour."
              : searchQuery.error.message
          }
        >
          <Button variant='outline' onClick={() => searchQuery.refetch()}>
            Try again
          </Button>
        </EmptyState>
      ) : !result || result.artists.length === 0 ? (
        <EmptyState title='No results' description='Try a different spelling.' />
      ) : (
        <>
          <p className='text-[10px] font-black tracking-[0.3em] text-muted-foreground uppercase'>
            {result.usableTracks} of {result.totalTracks} tracks have previews
          </p>

          <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-3'>
            {result.artists.map(artist => (
              <div
                key={artist.artistId}
                className='flex items-center gap-3 border p-3'
              >
                {artist.artworkUrl ? (
                  <img
                    src={artist.artworkUrl}
                    alt=''
                    className='size-12 shrink-0 border object-cover'
                  />
                ) : (
                  <div className='flex size-12 shrink-0 items-center justify-center border bg-muted'>
                    <Disc3 className='size-5 text-muted-foreground' />
                  </div>
                )}

                <div className='min-w-0 flex-1'>
                  <p className='truncate font-medium'>{artist.name}</p>
                  <p className='text-xs text-muted-foreground'>
                    {artist.trackCount} with preview
                    {artist.tracksWithoutPreview > 0
                      ? ` · ${artist.tracksWithoutPreview} without`
                      : ""}
                  </p>
                </div>

                {artist.alreadyImported ? (
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() =>
                      navigate({
                        to: "/artists/$artistId",
                        params: { artistId: artist.artistId },
                      })
                    }
                  >
                    Imported
                  </Button>
                ) : (
                  <Button
                    variant='brand'
                    size='sm'
                    disabled={
                      artist.trackCount === 0 ||
                      (importMutation.isPending && importing === artist.name)
                    }
                    onClick={() => {
                      setImporting(artist.name);
                      importMutation.mutate({
                        term: artist.name,
                        songLimit: 15,
                      });
                    }}
                  >
                    Import
                  </Button>
                )}
              </div>
            ))}
          </div>

          <p className='text-xs text-muted-foreground'>
            Importing re-queries iTunes for that artist and stores up to 15
            tracks. Ids are derived from iTunes, so re-importing the same artist
            adds only what is missing.
          </p>
        </>
      )}

      {result && result.artists.some(a => a.tracksWithoutPreview > 0) ? (
        <Badge tone='warning'>
          Tracks without a preview URL are never imported
        </Badge>
      ) : null}
    </div>
  );
}
