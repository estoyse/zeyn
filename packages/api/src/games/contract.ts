import type { ZodType } from "zod";

/**
 * The shared, transport-safe description of a game type: identity, presentation
 * metadata, the schema its room-creation config must satisfy, and the schema for
 * the actions its clients send over the WebSocket.
 *
 * This is imported by both the server (to validate config and dispatch actions)
 * and the web app (to render the game catalog and its create form), so it must
 * stay free of any server-only dependency (no DB, no durable-object types).
 *
 * The server-side engine (state transitions, DB hydration, result persistence)
 * and the client-side React views are registered separately, each keyed by the
 * same `type` string.
 */
export interface GameModuleMeta<Config = unknown, Action = unknown> {
  type: string;
  title: string;
  description: string;
  minPlayers: number;
  maxPlayers: number;
  configSchema: ZodType<Config>;
  actionSchema: ZodType<Action>;
}

export type InferConfig<M> = M extends GameModuleMeta<infer C, unknown>
  ? C
  : never;
export type InferAction<M> = M extends GameModuleMeta<unknown, infer A>
  ? A
  : never;

export type GameMetaRegistry = Record<string, GameModuleMeta>;
