import { latin1Decode, latin1Encode } from "./bytes";
import { encodeUtf8 } from "./utf8";

export interface ParsedHttpRequest {
  method: string;
  target: string;
  path: string;
  query: Record<string, string>;
  headers: Record<string, string>;
  httpVersion: string;
}

const STATUS_TEXT: Record<number, string> = {
  101: "Switching Protocols",
  200: "OK",
  400: "Bad Request",
  403: "Forbidden",
  404: "Not Found",
  405: "Method Not Allowed",
  408: "Request Timeout",
  426: "Upgrade Required",
  431: "Request Header Fields Too Large",
  500: "Internal Server Error",
  503: "Service Unavailable",
};

export const HEADER_TERMINATOR = "\r\n\r\n";

export function findHeaderEnd(bytes: Uint8Array, from: number): number {
  const start = from < 3 ? 3 : from;
  for (let i = start; i < bytes.length; i++) {
    if (
      bytes[i] === 0x0a &&
      bytes[i - 1] === 0x0d &&
      bytes[i - 2] === 0x0a &&
      bytes[i - 3] === 0x0d
    ) {
      return i + 1;
    }
  }
  return -1;
}

export function parseHttpRequest(headerBlock: Uint8Array): ParsedHttpRequest | null {
  const text = latin1Decode(headerBlock);
  const lines = text.split("\r\n");
  const requestLine = lines[0];
  if (!requestLine) return null;

  const firstSpace = requestLine.indexOf(" ");
  if (firstSpace <= 0) return null;
  const secondSpace = requestLine.indexOf(" ", firstSpace + 1);
  if (secondSpace <= firstSpace + 1) return null;

  const method = requestLine.slice(0, firstSpace);
  const target = requestLine.slice(firstSpace + 1, secondSpace);
  const version = requestLine.slice(secondSpace + 1);
  if (!version.startsWith("HTTP/")) return null;
  const httpVersion = version.slice(5);

  const headers: Record<string, string> = {};
  let lastName: string | null = null;

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]!;
    if (line === "") break;
    if (line[0] === " " || line[0] === "\t") {
      if (lastName === null) return null;
      headers[lastName] = `${headers[lastName]} ${line.trim()}`;
      continue;
    }
    const colon = line.indexOf(":");
    if (colon <= 0) return null;
    const name = line.slice(0, colon).trim().toLowerCase();
    const value = line.slice(colon + 1).trim();
    if (name === "") return null;
    const existing = headers[name];
    headers[name] = existing === undefined ? value : `${existing}, ${value}`;
    lastName = name;
  }

  const questionMark = target.indexOf("?");
  const path = questionMark === -1 ? target : target.slice(0, questionMark);
  const query = questionMark === -1 ? {} : parseQuery(target.slice(questionMark + 1));

  return { method, target, path: decodePath(path), query, headers, httpVersion };
}

function decodePath(path: string): string {
  try {
    return decodeURIComponent(path);
  } catch {
    return path;
  }
}

export function parseQuery(queryString: string): Record<string, string> {
  const result: Record<string, string> = {};
  if (queryString === "") return result;
  for (const pair of queryString.split("&")) {
    if (pair === "") continue;
    const equals = pair.indexOf("=");
    const rawKey = equals === -1 ? pair : pair.slice(0, equals);
    const rawValue = equals === -1 ? "" : pair.slice(equals + 1);
    result[decodeComponent(rawKey)] = decodeComponent(rawValue);
  }
  return result;
}

function decodeComponent(value: string): string {
  try {
    return decodeURIComponent(value.replace(/\+/g, " "));
  } catch {
    return value;
  }
}

export function headerHasToken(headerValue: string | undefined, token: string): boolean {
  if (headerValue === undefined) return false;
  const wanted = token.toLowerCase();
  for (const part of headerValue.split(",")) {
    if (part.trim().toLowerCase() === wanted) return true;
  }
  return false;
}

export function splitHeaderList(headerValue: string | undefined): string[] {
  if (headerValue === undefined) return [];
  return headerValue
    .split(",")
    .map((part) => part.trim())
    .filter((part) => part !== "");
}

export function buildHttpResponse(
  status: number,
  headers: Record<string, string>,
  body: string | Uint8Array = "",
): Uint8Array {
  const bodyBytes = typeof body === "string" ? encodeUtf8(body) : body;
  const statusText = STATUS_TEXT[status] ?? "Unknown";
  let head = `HTTP/1.1 ${status} ${statusText}\r\n`;
  const merged: Record<string, string> = {
    Connection: "close",
    "Content-Length": String(bodyBytes.length),
    ...headers,
  };
  for (const name of Object.keys(merged)) {
    head += `${name}: ${merged[name]}\r\n`;
  }
  head += "\r\n";

  const headBytes = latin1Encode(head);
  const out = new Uint8Array(headBytes.length + bodyBytes.length);
  out.set(headBytes, 0);
  out.set(bodyBytes, headBytes.length);
  return out;
}

export function buildUpgradeResponse(accept: string, subprotocol: string | null): Uint8Array {
  let head = "HTTP/1.1 101 Switching Protocols\r\n";
  head += "Upgrade: websocket\r\n";
  head += "Connection: Upgrade\r\n";
  head += `Sec-WebSocket-Accept: ${accept}\r\n`;
  if (subprotocol !== null) head += `Sec-WebSocket-Protocol: ${subprotocol}\r\n`;
  head += "\r\n";
  return latin1Encode(head);
}
