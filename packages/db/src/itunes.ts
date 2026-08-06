export interface ITunesTrack {
  artistId: number;
  artistName: string;
  trackId: number;
  trackName: string;
  previewUrl?: string;
  artworkUrl100?: string;
}

export interface ITunesArtistSeed {
  id: string;
  name: string;
  artworkUrl: string | null;
}

export interface ITunesSongSeed {
  id: string;
  artistId: string;
  title: string;
  previewUrl: string;
  artworkUrl: string | null;
}

export const ITUNES_SEARCH_URL = "https://itunes.apple.com/search";

export async function searchItunesTracks(
  term: string,
  limit = 60
): Promise<ITunesTrack[]> {
  const url = `${ITUNES_SEARCH_URL}?term=${encodeURIComponent(
    term
  )}&entity=song&limit=${limit}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`iTunes responded ${res.status}`);
  const data = (await res.json()) as { results?: ITunesTrack[] };
  return data.results ?? [];
}

export function usableTracks(tracks: ITunesTrack[]): ITunesTrack[] {
  return tracks.filter(
    track => track.previewUrl && track.trackName && track.artistId
  );
}

export function toArtistAndSongs(
  tracks: ITunesTrack[],
  songLimit: number
): { artist: ITunesArtistSeed; songs: ITunesSongSeed[] } | null {
  const usable = usableTracks(tracks);
  const primary = usable[0];
  if (!primary) return null;

  const artistId = `a_${primary.artistId}`;
  const artist: ITunesArtistSeed = {
    id: artistId,
    name: primary.artistName,
    artworkUrl: primary.artworkUrl100 ?? null,
  };

  const seen = new Set<string>();
  const songs: ITunesSongSeed[] = [];
  for (const track of usable) {
    if (track.artistId !== primary.artistId) continue;
    const key = track.trackName.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    songs.push({
      id: `s_${track.trackId}`,
      artistId,
      title: track.trackName,
      previewUrl: track.previewUrl!,
      artworkUrl: track.artworkUrl100 ?? null,
    });
    if (songs.length >= songLimit) break;
  }

  return { artist, songs };
}
