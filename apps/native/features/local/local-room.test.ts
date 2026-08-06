import { describe, expect, it } from "vitest";
import { localResults } from "./local-room";
import type { ClientRoomState } from "@/features/game/hooks/useGameState";

function state(overrides: Partial<ClientRoomState> = {}): ClientRoomState {
  return {
    status: "FINISHED",
    gameType: "livebuzzer",
    gameId: "local",
    gameName: "Local room",
    hostId: "host-1",
    maxPlayers: 10,
    isPublic: false,
    hasPassword: false,
    allowGuests: true,
    players: {
      "host-1": { id: "host-1", name: "Host", score: 0, connected: true },
      "p-2": { id: "p-2", name: "Ali", score: 20, connected: true },
      "p-3": { id: "p-3", name: "Bek", score: 10, connected: true },
    },
    ...overrides,
  } as ClientRoomState;
}

describe("localResults", () => {
  it("keeps a moderator host off the leaderboard", () => {
    const results = localResults(state({ nonScoringPlayerIds: ["host-1"] }));
    const names = results.playerResults.map(p => p.playerName);

    expect(names).toEqual(["Ali", "Bek"]);
    expect(names).not.toContain("Host");
  });

  it("keeps a host who also plays on the leaderboard", () => {
    const results = localResults(state({ nonScoringPlayerIds: [] }));
    const names = results.playerResults.map(p => p.playerName);

    expect(names).toContain("Host");
    expect(names).toHaveLength(3);
  });

  it("ranks everyone when the field is absent", () => {
    const results = localResults(state());
    expect(results.playerResults).toHaveLength(3);
  });
});
