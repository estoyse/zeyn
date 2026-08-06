import { z } from "zod";
import { NAME_MAX_LENGTH } from "@zeyn/api/game-types";

export const LOCAL_PROTOCOL_VERSION = 1;

export const localHelloSchema = z.object({
  type: z.literal("HELLO"),
  v: z.literal(LOCAL_PROTOCOL_VERSION),
  nonce: z.string().min(1).max(200),
  deviceId: z.string().min(1).max(200),
  name: z.string().min(1).max(NAME_MAX_LENGTH),
});

export type LocalHello = z.infer<typeof localHelloSchema>;

export interface LocalWelcome {
  type: "WELCOME";
  v: typeof LOCAL_PROTOCOL_VERSION;
  playerId: string;
}

export function localWelcome(playerId: string): LocalWelcome {
  return { type: "WELCOME", v: LOCAL_PROTOCOL_VERSION, playerId };
}

export const LOCAL_ERROR_CODE = {
  BAD_HELLO: "BAD_HELLO",
  BAD_NONCE: "BAD_NONCE",
  HELLO_TIMEOUT: "HELLO_TIMEOUT",
  THROTTLED: "THROTTLED",
} as const;
