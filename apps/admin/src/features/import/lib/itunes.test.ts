import { describe, it, expect } from "vitest";
import type { ITunesTrack } from "@zeyn/db/itunes";

import { groupByArtist, tracksForArtist } from "./itunes";

function track(overrides: Partial<ITunesTrack> = {}): ITunesTrack {
  return {
    artistId: 1,
    artistName: "Primary",
    trackId: 1,
    trackName: "Song",
    previewUrl: "https://example.com/p.m4a",
    artworkUrl100: "https://example.com/a.jpg",
    ...overrides,
  };
}

describe("groupByArtist", () => {
  it("collapses tracks into one entry per artist", () => {
    const result = groupByArtist([
      track({ artistId: 1, trackId: 1 }),
      track({ artistId: 1, trackId: 2 }),
      track({ artistId: 2, trackId: 3, artistName: "Other" }),
    ]);

    expect(result).toHaveLength(2);
    expect(result[0]?.name).toBe("Primary");
    expect(result[0]?.trackCount).toBe(2);
  });

  it("orders by how many previewable tracks each artist has", () => {
    const result = groupByArtist([
      track({ artistId: 1, trackId: 1, artistName: "One" }),
      track({ artistId: 2, trackId: 2, artistName: "Two" }),
      track({ artistId: 2, trackId: 3, artistName: "Two" }),
    ]);

    expect(result.map(a => a.name)).toEqual(["Two", "One"]);
  });

  it("counts tracks without a preview separately, never as importable", () => {
    const result = groupByArtist([
      track({ artistId: 1, trackId: 1 }),
      track({ artistId: 1, trackId: 2, previewUrl: undefined }),
    ]);

    expect(result[0]?.trackCount).toBe(1);
    expect(result[0]?.tracksWithoutPreview).toBe(1);
  });

  it("gives an artist with no previewable tracks a zero count", () => {
    const result = groupByArtist([
      track({ artistId: 9, previewUrl: undefined }),
    ]);
    expect(result[0]?.trackCount).toBe(0);
  });

  it("derives the same a_<id> key the server stores", () => {
    const result = groupByArtist([track({ artistId: 4221631 })]);
    expect(result[0]?.artistId).toBe("a_4221631");
  });

  it("carries missing artwork through as null", () => {
    const result = groupByArtist([track({ artworkUrl100: undefined })]);
    expect(result[0]?.artworkUrl).toBeNull();
  });

  it("returns nothing for an empty search", () => {
    expect(groupByArtist([])).toEqual([]);
  });
});

describe("tracksForArtist", () => {
  it("keeps only the requested artist's tracks", () => {
    const tracks = [
      track({ artistId: 1, trackId: 1 }),
      track({ artistId: 2, trackId: 2 }),
      track({ artistId: 1, trackId: 3 }),
    ];
    expect(tracksForArtist(tracks, 1).map(t => t.trackId)).toEqual([1, 3]);
  });
});
