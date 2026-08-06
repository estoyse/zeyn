import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Badge } from "@zeyn/ui/components/badge";
import { Button } from "@zeyn/ui/components/button";
import { Input } from "@zeyn/ui/components/input";
import {
  ItunesRateLimitError,
  searchItunesTracks,
  toArtistAndSongs,
} from "@zeyn/db/itunes";
import { Disc3, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { EmptyState } from "@/shared/components/EmptyState";
import { PageHeader } from "@/shared/components/PageHeader";
import { groupByArtist, tracksForArtist } from "@/features/import/lib/itunes";
import { trpc } from "@/shared/lib/trpc";
import { useAdminMutation } from "@/shared/lib/useAdminMutation";

const SONGS_PER_ARTIST = 15;

export const Route = createFileRoute("/_admin/import/music")({
  component: ImportMusicPage,
});

function ImportMusicPage() {
  const navigate = useNavigate();
  const [term, setTerm] = useState("");
  const [debounced, setDebounced] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(term.trim()), 500);
    return () => clearTimeout(timer);
  }, [term]);

  const searchQuery = useQuery({
    queryKey: ["itunes-search", debounced],
    queryFn: () => searchItunesTracks(debounced, 60),
    enabled: debounced.length >= 2,
    retry: false,
    staleTime: 60 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const tracks = useMemo(() => searchQuery.data ?? [], [searchQuery.data]);
  const candidates = useMemo(() => groupByArtist(tracks), [tracks]);

  const importedQuery = useQuery({
    ...trpc.admin.import.importedArtistIds.queryOptions({
      artistIds: candidates.map(candidate => candidate.artistId),
    }),
    enabled: candidates.length > 0,
  });
  const importedIds = new Set(importedQuery.data ?? []);

  const importMutation = useAdminMutation(
    trpc.admin.import.importArtist.mutationOptions(),
    {
      successMessage: data =>
        `${data.artistName}: ${data.songsFetched} song(s) imported (${data.songsTotal} total)`,
      invalidate: [
        trpc.admin.music.listArtists.queryKey(),
        trpc.admin.import.importedArtistIds.queryKey(),
      ],
    }
  );

  const usableCount = tracks.filter(track => track.previewUrl).length;
  const rateLimited = searchQuery.error instanceof ItunesRateLimitError;

  return (
    <div className='space-y-6'>
      <PageHeader
        eyebrow='Content'
        title='Import from iTunes'
        description='Your browser queries the iTunes Search API directly; only tracks with a playable preview are stored.'
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
          title={rateLimited ? "Rate limited by iTunes" : "Search failed"}
          description={
            rateLimited
              ? "iTunes allows only a handful of searches per minute from one network. Wait about a minute and try again."
              : (searchQuery.error as Error).message
          }
        >
          <Button variant='outline' onClick={() => searchQuery.refetch()}>
            Try again
          </Button>
        </EmptyState>
      ) : candidates.length === 0 ? (
        <EmptyState title='No results' description='Try a different spelling.' />
      ) : (
        <>
          <p className='text-[10px] font-black tracking-[0.3em] text-muted-foreground uppercase'>
            {usableCount} of {tracks.length} tracks have previews
          </p>

          <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-3'>
            {candidates.map(candidate => {
              const alreadyImported = importedIds.has(candidate.artistId);
              const pendingThis =
                importMutation.isPending &&
                importMutation.variables?.artist.id === candidate.artistId;

              return (
                <div
                  key={candidate.artistId}
                  className='flex items-center gap-3 border p-3'
                >
                  {candidate.artworkUrl ? (
                    <img
                      src={candidate.artworkUrl}
                      alt=''
                      className='size-12 shrink-0 border object-cover'
                    />
                  ) : (
                    <div className='flex size-12 shrink-0 items-center justify-center border bg-muted'>
                      <Disc3 className='size-5 text-muted-foreground' />
                    </div>
                  )}

                  <div className='min-w-0 flex-1'>
                    <p className='truncate font-medium'>{candidate.name}</p>
                    <p className='text-xs text-muted-foreground'>
                      {candidate.trackCount} with preview
                      {candidate.tracksWithoutPreview > 0
                        ? ` · ${candidate.tracksWithoutPreview} without`
                        : ""}
                    </p>
                  </div>

                  {alreadyImported ? (
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() =>
                        navigate({
                          to: "/artists/$artistId",
                          params: { artistId: candidate.artistId },
                        })
                      }
                    >
                      Imported
                    </Button>
                  ) : (
                    <Button
                      variant='brand'
                      size='sm'
                      disabled={candidate.trackCount === 0 || pendingThis}
                      onClick={() => {
                        const built = toArtistAndSongs(
                          tracksForArtist(tracks, candidate.itunesArtistId),
                          SONGS_PER_ARTIST
                        );
                        if (!built) return;
                        importMutation.mutate({
                          artist: built.artist,
                          songs: built.songs,
                        });
                      }}
                    >
                      Import
                    </Button>
                  )}
                </div>
              );
            })}
          </div>

          <p className='text-xs text-muted-foreground'>
            Importing stores up to {SONGS_PER_ARTIST} tracks. Ids come from
            iTunes, so re-importing the same artist adds only what is missing.
          </p>
        </>
      )}

      {candidates.some(candidate => candidate.tracksWithoutPreview > 0) ? (
        <Badge tone='warning'>
          Tracks without a preview URL are never imported
        </Badge>
      ) : null}
    </div>
  );
}
