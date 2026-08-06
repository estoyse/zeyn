import type { Player } from "@zeyn/api/game-types";
import type { LivebuzzerPhase } from "@zeyn/api/games";

export type GuestStatus = "WAITING" | "PLAYING" | "FINISHED";

export interface BuzzerInputs {
  status: GuestStatus;
  phase: LivebuzzerPhase;
  lockedOutPlayerIds: string[];
  buzzedPlayerIds: string[];
  playerId: string | null;
  armedAt: number | null;
}

export interface BuzzerView {
  enabled: boolean;
  label: string;
  caption: string;
}

export interface ScoreRow {
  id: string;
  name: string;
  score: number;
  connected: boolean;
  rank: number;
}

export function parseRoomNonce(search: string): string | null {
  const query = search.charAt(0) === "?" ? search.slice(1) : search;
  const pairs = query.split("&");
  for (let index = 0; index < pairs.length; index += 1) {
    const pair = pairs[index] || "";
    const separator = pair.indexOf("=");
    if (separator < 0) continue;
    if (pair.slice(0, separator) !== "r") continue;

    const encoded = pair.slice(separator + 1).replace(/\+/g, " ");
    let decoded = "";
    try {
      decoded = decodeURIComponent(encoded);
    } catch {
      return null;
    }

    const nonce = decoded.trim();
    if (nonce.length === 0 || nonce.length > 200) return null;
    return nonce;
  }
  return null;
}

export function mergePlayers(
  previous: Record<string, Player>,
  incoming: Record<string, Partial<Player>> | undefined
): Record<string, Player> {
  const merged: Record<string, Player> = {};
  const carried = Object.keys(previous);
  for (let index = 0; index < carried.length; index += 1) {
    const id = carried[index] as string;
    merged[id] = Object.assign({}, previous[id]) as Player;
  }

  if (!incoming) return merged;

  const changed = Object.keys(incoming);
  for (let index = 0; index < changed.length; index += 1) {
    const id = changed[index] as string;
    const base = merged[id] || {
      id: id,
      name: "",
      score: 0,
      connected: false,
    };
    merged[id] = Object.assign({}, base, incoming[id]) as Player;
  }
  return merged;
}

export function nextArmedAt(
  previousPhase: LivebuzzerPhase | null,
  phase: LivebuzzerPhase,
  previousArmedAt: number | null,
  now: number
): number | null {
  if (phase === "ARMED") {
    return previousPhase === "ARMED" ? previousArmedAt : now;
  }
  if (phase === "COLLECTING") return previousArmedAt;
  return null;
}

export function reactionMsFor(
  armedAt: number | null,
  pressedAt: number
): number | null {
  if (armedAt === null) return null;
  const elapsed = pressedAt - armedAt;
  if (!isFinite(elapsed) || elapsed < 0) return 0;
  return Math.round(elapsed);
}

export function buzzerView(inputs: BuzzerInputs): BuzzerView {
  if (inputs.status === "WAITING") {
    return {
      enabled: false,
      label: "WAIT",
      caption: "Waiting for the host to start",
    };
  }
  if (inputs.status === "FINISHED") {
    return { enabled: false, label: "DONE", caption: "Game over" };
  }

  const playerId = inputs.playerId;
  if (inputs.phase === "IDLE") {
    return {
      enabled: false,
      label: "WAIT",
      caption: "Listen for the question",
    };
  }
  if (inputs.phase === "COLLECTING") {
    return { enabled: false, label: "WAIT", caption: "Locking in" };
  }
  if (inputs.phase === "LOCKED") {
    return { enabled: false, label: "LOCKED", caption: "Answer locked in" };
  }

  if (playerId !== null && inputs.lockedOutPlayerIds.indexOf(playerId) >= 0) {
    return {
      enabled: false,
      label: "OUT",
      caption: "You are locked out this round",
    };
  }
  if (playerId !== null && inputs.buzzedPlayerIds.indexOf(playerId) >= 0) {
    return { enabled: false, label: "IN", caption: "Buzzed!" };
  }
  if (inputs.armedAt === null) {
    return { enabled: false, label: "WAIT", caption: "Syncing" };
  }
  return { enabled: true, label: "BUZZ", caption: "Buzz in!" };
}

export function scoreboardRows(
  players: Record<string, Player>,
  nonScoringPlayerIds: string[] | undefined
): ScoreRow[] {
  const excluded = nonScoringPlayerIds || [];
  const rows: ScoreRow[] = [];
  const ids = Object.keys(players);
  for (let index = 0; index < ids.length; index += 1) {
    const id = ids[index] as string;
    if (excluded.indexOf(id) >= 0) continue;
    const player = players[id] as Player;
    rows.push({
      id: id,
      name: player.name || "Player",
      score: player.score || 0,
      connected: player.connected === true,
      rank: 0,
    });
  }

  rows.sort(function compare(left, right) {
    if (left.score !== right.score) return right.score - left.score;
    if (left.name !== right.name) return left.name < right.name ? -1 : 1;
    return left.id < right.id ? -1 : 1;
  });

  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index] as ScoreRow;
    const previous = rows[index - 1];
    row.rank =
      previous !== undefined && previous.score === row.score
        ? previous.rank
        : index + 1;
  }
  return rows;
}

export function remainingMs(
  timerExpiresAt: number,
  clockOffsetMs: number,
  now: number
): number | null {
  if (!timerExpiresAt) return null;
  const left = timerExpiresAt - (now - clockOffsetMs);
  return left > 0 ? left : 0;
}

export function formatSeconds(ms: number): string {
  const seconds = Math.ceil(ms / 1000);
  return String(seconds > 0 ? seconds : 0);
}

export function formatReactionMs(ms: number | null): string {
  if (ms === null || !isFinite(ms)) return "";
  return String(Math.round(ms)) + "ms";
}
