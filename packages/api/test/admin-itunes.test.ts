import { describe, it, expect } from "vitest";

import {
  toArtistAndSongs,
  usableTracks,
  type ITunesTrack,
} from "@zeyn/db/itunes";

function track(overrides: Partial<ITunesTrack> = {}): ITunesTrack {
  return {
    artistId: 1,
    artistName: "Primary Artist",
    trackId: Math.floor(Math.random() * 1e6),
    trackName: "A Song",
    previewUrl: "https://example.com/p.m4a",
    artworkUrl100: "https://example.com/a.jpg",
    ...overrides,
  };
}

describe("usableTracks", () => {
  it("drops tracks without a preview URL", () => {
    const tracks = [
      track({ trackId: 1 }),
      track({ trackId: 2, previewUrl: undefined }),
    ];
    expect(usableTracks(tracks).map(t => t.trackId)).toEqual([1]);
  });

  it("drops tracks without a name", () => {
    const tracks = [track({ trackId: 1 }), track({ trackId: 2, trackName: "" })];
    expect(usableTracks(tracks).map(t => t.trackId)).toEqual([1]);
  });
});

describe("toArtistAndSongs", () => {
  it("returns null when nothing is usable", () => {
    expect(toArtistAndSongs([], 15)).toBeNull();
    expect(
      toArtistAndSongs([track({ previewUrl: undefined })], 15)
    ).toBeNull();
  });

  it("builds stable a_/s_ ids so re-imports are idempotent", () => {
    const built = toArtistAndSongs(
      [track({ artistId: 42, trackId: 99, trackName: "One" })],
      15
    );
    expect(built?.artist.id).toBe("a_42");
    expect(built?.songs[0]?.id).toBe("s_99");
    expect(built?.songs[0]?.artistId).toBe("a_42");
  });

  it("excludes tracks credited to a different artist", () => {
    const built = toArtistAndSongs(
      [
        track({ artistId: 1, trackId: 1, trackName: "Mine" }),
        track({ artistId: 2, trackId: 2, trackName: "Someone else's" }),
      ],
      15
    );
    expect(built?.songs.map(s => s.title)).toEqual(["Mine"]);
  });

  it("dedupes titles case-insensitively", () => {
    const built = toArtistAndSongs(
      [
        track({ trackId: 1, trackName: "Echo" }),
        track({ trackId: 2, trackName: "echo" }),
        track({ trackId: 3, trackName: "Other" }),
      ],
      15
    );
    expect(built?.songs.map(s => s.title)).toEqual(["Echo", "Other"]);
  });

  it("honours the song limit", () => {
    const tracks = Array.from({ length: 20 }, (_, i) =>
      track({ trackId: i, trackName: `Song ${i}` })
    );
    expect(toArtistAndSongs(tracks, 5)?.songs).toHaveLength(5);
  });

  it("carries null artwork through rather than undefined", () => {
    const built = toArtistAndSongs(
      [track({ artworkUrl100: undefined })],
      15
    );
    expect(built?.artist.artworkUrl).toBeNull();
    expect(built?.songs[0]?.artworkUrl).toBeNull();
  });

  it("every emitted song has a non-empty previewUrl, which the column requires", () => {
    const built = toArtistAndSongs(
      [
        track({ trackId: 1, trackName: "Has preview" }),
        track({ trackId: 2, trackName: "No preview", previewUrl: undefined }),
      ],
      15
    );
    expect(built?.songs).toHaveLength(1);
    for (const song of built?.songs ?? []) {
      expect(song.previewUrl).toBeTruthy();
    }
  });
});
