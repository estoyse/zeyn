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
  return {};
}

export function joinPlayer(
  state: BaseGameState,
  params: JoinParams
): EngineDirectives {
  const { playerId, name, password, roomPassword } = params;

  if (!playerId || !name) {
    return {
      reply: gameError("Player ID and name are required to join."),
      closeSocket: true,
    };
  }

  if (playerId.startsWith("guest-")) {
    return {
      reply: gameError("Guest access is disabled. Please login."),
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

  const isNewPlayer = !state.players[playerId];
  if (isNewPlayer && Object.keys(state.players).length >= state.maxPlayers) {
    return { reply: gameError("Room is full") };
  }

  const existing = state.players[playerId];
  if (existing) {
    existing.connected = true;
    existing.name = name;
  } else {
    state.players[playerId] = {
      id: playerId,
      name,
      score: 0,
      connected: true,
    };
  }

  return { accepted: true };
}
