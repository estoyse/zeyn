# @zeyn/ws-server

A transport-agnostic RFC 6455 WebSocket **server** in pure TypeScript.

- `src/` has zero dependencies and zero ambient globals. Its `tsconfig.json` sets `"types": []`, so referencing `node:*`, `Buffer`, `setTimeout`, `TextDecoder`, `btoa`, `crypto` is a compile error. It runs on Hermes.
- Timers are injected (`Timers`), sockets are injected (`ListenerPort` / `SocketPort`). The core never performs I/O.
- SHA-1 (`src/sha1.ts`), base64 (`src/base64.ts`) and UTF-8 (`src/utf8.ts`) are vendored and synchronous. SHA-1 here is the RFC 6455 handshake checksum, not a security primitive.
- `permessage-deflate` is deliberately not negotiated. RSV bits therefore must be zero.

## Layout

| Path | Purpose |
| --- | --- |
| `src/bytes.ts` | `ByteQueue` (zero-copy-ish chunk list), latin1 helpers |
| `src/sha1.ts` | synchronous SHA-1 |
| `src/base64.ts` | synchronous base64 encode/decode |
| `src/utf8.ts` | strict incremental UTF-8 validator + encoder/decoder |
| `src/frame.ts` | RFC 6455 §5 frame reader/writer, masking |
| `src/http.ts` | HTTP/1.1 request parsing, response building |
| `src/handshake.ts` | `Sec-WebSocket-Accept`, upgrade validation |
| `src/connection.ts` | `WsConnection` — one peer, push-driven, no I/O |
| `src/server.ts` | `SocketServer` — binds N connections to an injected listener |
| `src/adapters/react-native.ts` | structural adapter for `react-native-tcp-socket` |
| `node/adapter.ts` | `node:net` adapter (tests + Autobahn only) |

## Transport adapters

The core speaks only `SocketPort`:

```ts
interface SocketPort {
  write(bytes: Uint8Array): void;
  close(): void;
  onData(handler: (bytes: Uint8Array) => void): void;
  onClose(handler: () => void): void;
  onError(handler: (error: unknown) => void): void;
}
```

### Node (`@zeyn/ws-server/node`)

Used by the test suite and the Autobahn harness. Not shipped to the app.

### React Native (`react-native-tcp-socket`)

`src/adapters/react-native.ts` already contains `createReactNativeListener(server, codec)`. It is
typed structurally so this package does **not** depend on `react-native-tcp-socket`. Wiring it up on
device (Gate 1) is:

```ts
import TcpSocket from "react-native-tcp-socket";
import { Buffer } from "buffer";
import { SocketServer, createReactNativeListener } from "@zeyn/ws-server";

const tcpServer = TcpSocket.createServer(() => {});
tcpServer.listen({ port: 8787, host: "0.0.0.0" });

const listener = createReactNativeListener(tcpServer, {
  toBytes: (chunk) =>
    typeof chunk === "string"
      ? Uint8Array.from(Buffer.from(chunk, "binary"))
      : new Uint8Array(chunk as ArrayBufferView["buffer"]),
  fromBytes: (bytes) => Buffer.from(bytes),
});

const server = new SocketServer({
  listener,
  timers: { setTimeout, clearTimeout },
  hooks,
  responder,
});
```

The codec is injected precisely so the core keeps zero Node/`Buffer` coupling: the RN bridge hands
JS a `Buffer` (base64 across the bridge) and expects a `Buffer` back.

## Limits

`DEFAULT_LIMITS` is tuned for a phone listening on an open LAN port:

| Limit | Default | On violation |
| --- | --- | --- |
| `maxHttpHeaderBytes` | 8 KiB | HTTP 431 |
| `handshakeTimeoutMs` | 5 s | HTTP 408 |
| `maxFramePayloadBytes` | 64 KiB | close 1009 |
| `maxMessageBytes` | 256 KiB | close 1009 |
| `maxFragments` | 64 | close 1009 |
| `idleTimeoutMs` | 60 s | close 1001 |
| `maxConnections` | 32 | HTTP 503 |

Every limit is a constructor option. The Autobahn conformance run raises them (see
`autobahn/serve.ts`) because Autobahn section 9 deliberately sends 16 MiB messages and section 9.3
fragments a 4 MiB message into 65536 pieces. The framing code under test is identical; only the
policy numbers differ.

## Verification

```
pnpm -F @zeyn/ws-server test              # 175 vitest cases
pnpm -F @zeyn/ws-server autobahn          # full Autobahn fuzzingclient, relaxed limits (docker)
pnpm -F @zeyn/ws-server autobahn:strict   # Autobahn 1-7 against the shipping DEFAULT_LIMITS
```

Autobahn TestSuite (`crossbario/autobahn-testsuite`, 517 cases), relaxed-limits run:

| Section | Result |
| --- | --- |
| 1 Framing | 16 OK |
| 2 Pings/Pongs | 11 OK |
| 3 Reserved bits | 7 OK |
| 4 Opcodes | 10 OK |
| 5 Fragmentation | 20 OK |
| 6 UTF-8 handling | 143 OK, 2 Non-Strict (6.4.3, 6.4.4) |
| 7 Close handling | 34 OK, 3 Informational |
| 9 Limits/Performance | 54 OK |
| 10 Auto-Fragmentation | 1 OK |
| 12 / 13 permessage-deflate | 216 Unimplemented (not negotiated, by design) |

Zero `FAILED`, zero `WRONG CODE`, zero `UNCLEAN` — including `behaviorClose` on every case.
Sections 1-7 produce the identical table when run against `DEFAULT_LIMITS`.

6.4.3 / 6.4.4 are Non-Strict because the invalid UTF-8 octet is delivered inside a single frame that
Autobahn chops at the TCP level; we fail the connection when the frame completes rather than on the
exact octet. RFC 6455 permits both.
