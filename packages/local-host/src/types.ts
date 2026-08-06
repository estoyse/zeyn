import type { LivebuzzerConfig } from "@zeyn/api/games";
import type {
  ListenerPort,
  OriginPolicy,
  Timers,
  WsLimits,
} from "@zeyn/ws-server";

export interface LocalGameHostOptions {
  listener: ListenerPort;
  timers: Timers;
  now: () => number;
  nonce: string;
  hostDeviceId: string;
  roomId?: string;
  roomName?: string;
  config?: Partial<LivebuzzerConfig>;
  maxPlayers?: number;
  guestPage?: string;
  helloTimeoutMs?: number;
  maxFailedHellosPerPeer?: number;
  failedHelloWindowMs?: number;
  maxConnections?: number;
  heartbeatIntervalMs?: number;
  limits?: Partial<WsLimits>;
  originPolicy?: OriginPolicy;
  createPlayerId?: () => string;
}
