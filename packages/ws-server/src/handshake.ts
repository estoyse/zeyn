import { base64Decode, base64Encode } from "./base64";
import { latin1Encode } from "./bytes";
import { headerHasToken, type ParsedHttpRequest } from "./http";
import { sha1 } from "./sha1";

export const WEBSOCKET_GUID = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11";

export function computeAcceptValue(secWebSocketKey: string): string {
  return base64Encode(sha1(latin1Encode(secWebSocketKey + WEBSOCKET_GUID)));
}

export function isUpgradeRequest(request: ParsedHttpRequest): boolean {
  return headerHasToken(request.headers["upgrade"], "websocket");
}

export type HandshakeCheck =
  | { ok: true; key: string }
  | { ok: false; status: number; reason: string };

export type OriginPolicy = (
  origin: string | null,
  request: ParsedHttpRequest
) => boolean;

export function originAuthority(origin: string): string | null {
  const scheme = origin.indexOf("://");
  if (scheme < 0) return null;
  const rest = origin.slice(scheme + 3);
  if (rest === "") return null;
  const end = rest.search(/[/?#]/);
  const authority = end < 0 ? rest : rest.slice(0, end);
  return authority === "" ? null : authority.toLowerCase();
}

export const sameOriginOnly: OriginPolicy = (origin, request) => {
  if (origin === null) return true;
  const host = request.headers["host"];
  if (host === undefined || host === "") return false;
  return originAuthority(origin) === host.toLowerCase();
};

export const allowAnyOrigin: OriginPolicy = () => true;

export function validateHandshake(
  request: ParsedHttpRequest,
  originPolicy: OriginPolicy = sameOriginOnly
): HandshakeCheck {
  if (request.method !== "GET") {
    return { ok: false, status: 400, reason: "websocket upgrade requires GET" };
  }
  const origin = request.headers["origin"] ?? null;
  if (!originPolicy(origin, request)) {
    return { ok: false, status: 403, reason: "origin not allowed" };
  }
  if (request.httpVersion !== "1.1" && request.httpVersion !== "2") {
    return { ok: false, status: 400, reason: "websocket upgrade requires HTTP/1.1" };
  }
  if (!headerHasToken(request.headers["connection"], "upgrade")) {
    return { ok: false, status: 400, reason: "missing Connection: Upgrade" };
  }
  const version = request.headers["sec-websocket-version"];
  if (version !== "13") {
    return { ok: false, status: 426, reason: "unsupported Sec-WebSocket-Version" };
  }
  const key = request.headers["sec-websocket-key"];
  if (key === undefined || key === "") {
    return { ok: false, status: 400, reason: "missing Sec-WebSocket-Key" };
  }
  const decoded = base64Decode(key);
  if (decoded === null || decoded.length !== 16) {
    return { ok: false, status: 400, reason: "malformed Sec-WebSocket-Key" };
  }
  return { ok: true, key };
}
