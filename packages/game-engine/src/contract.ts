import type {
  BaseGameState,
  BasePublicGameState,
  EngineDirectives,
} from "@zeyn/api/game-types";

/** Parameters the platform passes to a game when admitting a player. */
export interface JoinParams {
  playerId: string;
  name: string;
  isGuest: boolean;
  password?: string;
  /** The room's real password (never part of broadcast state); null if open. */
  roomPassword: string | null;
  allowLateJoin?: boolean;
}

/**
 * A live game instance owned by one GameRoom durable object. The durable object
 * is a transport shell: it owns the opaque state blob and the sockets, and routes
 * every message, alarm, and broadcast through this interface. All game rules —
 * state transitions and the public-state view sent to clients — live behind it.
 *
 * State is typed as `BaseGameState` here because the DO treats it opaquely; each
 * implementation narrows to its own concrete state internally.
 */
export interface RoomGame {
  readonly type: string;

  /** The fresh, un-hydrated state a brand-new room starts from. */
  createInitialState(): BaseGameState;

  /** Validate and admit a player, or reconnect an existing one. */
  join(state: BaseGameState, params: JoinParams): EngineDirectives;

  /** Host starts the match; content was already loaded at hydrate. */
  start(
    state: BaseGameState,
    playerId: string,
    now: number
  ): Promise<EngineDirectives>;

  /** A game-specific action, already validated against the module's schema. */
  handleAction(
    state: BaseGameState,
    action: unknown,
    now: number
  ): EngineDirectives;

  /** Fired when a scheduled phase deadline elapses. */
  handleTimeout(state: BaseGameState, now: number): EngineDirectives;

  /** Build the public view broadcast to clients. */
  toPublic(
    state: BaseGameState,
    forceFullPlayers?: boolean
  ): BasePublicGameState;
}
