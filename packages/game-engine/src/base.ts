import { roomLimits } from "@zeyn/api/game-types";
import type {
  BaseGameState,
  EngineDirectives,
  ServerMessage,
} from "@zeyn/api/game-types";
import type { JoinParams } from "./contract";

export interface RoomMeta {
  name: string;
  hostId: string;
  maxPlayers: number;
  isPublic: boolean;
  password: string | null;
  allowGuests: boolean;
  status: "waiting" | "playing" | "finished";
}

export function gameError(message: string, code?: string): ServerMessage {
  return code ? { type: "ERROR", message, code } : { type: "ERROR", message };
}

export function initBaseState(gameType: string): BaseGameState {
  return {
    status: "WAITING",
    gameType,
    gameId: null,
    gameName: null,
    hostId: null,
    maxPlayers: roomLimits.maxPlayers,
    isPublic: true,
    hasPassword: false,
    allowGuests: true,
    players: {},
  };
}

export function hydrateBase(
  state: BaseGameState,
  gameId: string,
  room: RoomMeta | undefined
): EngineDirectives {
  if (!room) {
    return {
      reply: gameError("Room not found", "NOT_FOUND"),
      closeSocket: true,
    };
  }
  if (room.status === "playing") {
    return {
      reply: gameError("Game already started", "ALREADY_STARTED"),
      closeSocket: true,
    };
  }
  if (room.status === "finished") {
    return {
      reply: gameError("Game already ended", "ALREADY_FINISHED"),
      closeSocket: true,
    };
  }

  state.gameId = gameId;
  state.gameName = room.name;
  state.hostId = room.hostId;
  state.maxPlayers = room.maxPlayers;
  state.isPublic = room.isPublic;
  state.hasPassword = !!room.password;
  state.allowGuests = room.allowGuests;
  return {};
}

export function joinPlayer(
  state: BaseGameState,
  params: JoinParams
): EngineDirectives {
  const { playerId, name, isGuest, password, roomPassword } = params;

  if (!playerId || !name) {
    return {
      reply: gameError("Player ID and name are required to join."),
      closeSocket: true,
    };
  }

  if (isGuest && !state.allowGuests) {
    return {
      reply: gameError(
        "This room does not allow guests. Please sign in.",
        "GUESTS_NOT_ALLOWED"
      ),
      closeSocket: true,
    };
  }

  const isNewPlayer = !state.players[playerId];
  const lateJoinAllowed =
    params.allowLateJoin === true && state.status === "PLAYING";
  if (isNewPlayer && state.status !== "WAITING" && !lateJoinAllowed) {
    return {
      reply: gameError(
        state.status === "FINISHED"
          ? "Game already ended"
          : "Game already started",
        state.status === "FINISHED" ? "ALREADY_FINISHED" : "ALREADY_STARTED"
      ),
      closeSocket: true,
    };
  }

  if (roomPassword && roomPassword !== password) {
    return {
      reply: gameError(
        "Incorrect or missing password for this room",
        "PASSWORD_REQUIRED"
      ),
    };
  }

  if (isNewPlayer && Object.keys(state.players).length >= state.maxPlayers) {
    return { reply: gameError("Room is full") };
  }

  const existing = state.players[playerId];
  if (existing) {
    existing.connected = true;
    existing.name = name;
    existing.isGuest = isGuest;
  } else {
    state.players[playerId] = {
      id: playerId,
      name,
      score: 0,
      connected: true,
      isGuest,
    };
  }

  return { accepted: true };
}
