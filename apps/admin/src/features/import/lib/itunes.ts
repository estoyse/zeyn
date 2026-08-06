import type { ITunesTrack } from "@zeyn/db/itunes";

export interface ArtistCandidate {
  itunesArtistId: number;
  artistId: string;
  name: string;
  artworkUrl: string | null;
  trackCount: number;
  tracksWithoutPreview: number;
}

export function groupByArtist(tracks: ITunesTrack[]): ArtistCandidate[] {
  const byArtist = new Map<number, ArtistCandidate>();

  for (const track of tracks) {
    const hasPreview = Boolean(track.previewUrl && track.trackName);
    const existing = byArtist.get(track.artistId);

    if (existing) {
      if (hasPreview) existing.trackCount += 1;
      else existing.tracksWithoutPreview += 1;
      continue;
    }

    byArtist.set(track.artistId, {
      itunesArtistId: track.artistId,
      artistId: `a_${track.artistId}`,
      name: track.artistName,
      artworkUrl: track.artworkUrl100 ?? null,
      trackCount: hasPreview ? 1 : 0,
      tracksWithoutPreview: hasPreview ? 0 : 1,
    });
  }

  return [...byArtist.values()].sort((a, b) => b.trackCount - a.trackCount);
}

export function tracksForArtist(
  tracks: ITunesTrack[],
  itunesArtistId: number
): ITunesTrack[] {
  return tracks.filter(track => track.artistId === itunesArtistId);
}
