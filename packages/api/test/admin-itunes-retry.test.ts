import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import {
  ITUNES_CACHE_TTL_SECONDS,
  ItunesRateLimitError,
  itunesSearchUrl,
  searchItunesTracks,
} from "@zeyn/db/itunes";

const fetchMock = vi.fn();

function ok(results: unknown[]) {
  return { ok: true, status: 200, json: async () => ({ results }) };
}
function status(code: number) {
  return { ok: false, status: code, json: async () => ({}) };
}

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

async function runWithTimers<T>(promise: Promise<T>): Promise<T> {
  const settled = promise.catch((error: unknown) => ({ __error: error }));
  await vi.runAllTimersAsync();
  const result = (await settled) as T | { __error: unknown };
  if (result && typeof result === "object" && "__error" in result) {
    throw (result as { __error: unknown }).__error;
  }
  return result as T;
}

describe("itunesSearchUrl", () => {
  it("encodes the term so ampersands do not truncate the query", () => {
    expect(itunesSearchUrl("AC/DC & co", 5)).toBe(
      "https://itunes.apple.com/search?term=AC%2FDC%20%26%20co&entity=song&limit=5"
    );
  });
});

describe("searchItunesTracks", () => {
  it("asks Cloudflare to cache the response so repeat searches cost no quota", async () => {
    fetchMock.mockResolvedValueOnce(ok([]));
    await runWithTimers(searchItunesTracks("daft punk", 5));

    const init = fetchMock.mock.calls[0]?.[1] as {
      cf?: { cacheEverything?: boolean; cacheTtl?: number };
    };
    expect(init.cf?.cacheEverything).toBe(true);
    expect(init.cf?.cacheTtl).toBe(ITUNES_CACHE_TTL_SECONDS);
  });

  it("retries a 429 and succeeds without surfacing an error", async () => {
    fetchMock
      .mockResolvedValueOnce(status(429))
      .mockResolvedValueOnce(ok([{ trackId: 1 }]));

    const tracks = await runWithTimers(searchItunesTracks("x", 5));
    expect(tracks).toHaveLength(1);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("gives up after the configured retries with a typed rate-limit error", async () => {
    fetchMock.mockResolvedValue(status(429));

    await expect(runWithTimers(searchItunesTracks("x", 5))).rejects.toBeInstanceOf(
      ItunesRateLimitError
    );
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("does not retry non-429 failures", async () => {
    fetchMock.mockResolvedValue(status(500));

    await expect(runWithTimers(searchItunesTracks("x", 5))).rejects.toThrow(
      "iTunes responded 500"
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("returns an empty list when iTunes omits results", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({}),
    });
    expect(await runWithTimers(searchItunesTracks("x", 5))).toEqual([]);
  });
});
