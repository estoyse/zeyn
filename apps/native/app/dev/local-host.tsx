import { LOCAL_CODE_VERSION, LOCAL_PORT, encodeLocalCode, generateLocalNonce, localGuestUrl } from "@zeyn/api/local-code";
import { LocalGameHost } from "@zeyn/local-host";
import { useKeepAwake } from "expo-keep-awake";
import { Redirect, type Href } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

import {
  createHostDeviceId,
  createLocalListener,
  createRandomBytes,
  createRnTimers,
  getLanIpAddress,
  loadTcpSocketModule,
  type RnRawServer,
} from "@/features/local/transport";

const ECHO_PORT = 47802;

interface HostInfo {
  ip: string;
  port: number;
  roomCode: string;
  guestUrl: string;
}

export default function LocalHostDevRoute() {
  if (!__DEV__) return <Redirect href={"/(tabs)/home" as Href} />;
  return <LocalHostDevScreen />;
}

function LocalHostDevScreen() {
  useKeepAwake();

  const [log, setLog] = useState<string[]>([]);
  const [hostInfo, setHostInfo] = useState<HostInfo | null>(null);
  const [echoRunning, setEchoRunning] = useState(false);
  const [hostRunning, setHostRunning] = useState(false);

  const echoServerRef = useRef<RnRawServer | null>(null);
  const hostRef = useRef<LocalGameHost | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const appendLog = useCallback((line: string) => {
    const stamp = new Date().toLocaleTimeString();
    setLog((prev) => [...prev, `${stamp}  ${line}`].slice(-300));
  }, []);

  const startEchoTest = useCallback(() => {
    if (echoServerRef.current) {
      appendLog("echo: already running");
      return;
    }
    try {
      const module = loadTcpSocketModule();
      const server = module.createServer();
      server.on("listening", () => appendLog(`echo: listening on 0.0.0.0:${ECHO_PORT}`));
      server.on("error", (error) => appendLog(`echo: server error -- ${String(error)}`));
      server.on("close", () => {
        appendLog("echo: server closed");
        setEchoRunning(false);
      });
      server.on("connection", (socket) => {
        appendLog(`echo: connection from ${socket.remoteAddress ?? "unknown"}`);
        socket.on("data", (data) => {
          const byteCount = typeof data === "string" ? data.length : (data as Uint8Array).byteLength;
          appendLog(`echo: received ${byteCount} bytes`);
          try {
            socket.write(data as Uint8Array);
          } catch (error) {
            appendLog(`echo: write failed -- ${String(error)}`);
          }
        });
        socket.on("error", (error) => appendLog(`echo: socket error -- ${String(error)}`));
        socket.on("close", () => appendLog("echo: socket closed"));
      });
      server.listen({ port: ECHO_PORT, host: "0.0.0.0", reuseAddress: true });
      echoServerRef.current = server;
      setEchoRunning(true);
    } catch (error) {
      appendLog(`echo: failed to start -- ${String(error)}`);
    }
  }, [appendLog]);

  const startLocalHost = useCallback(async () => {
    if (hostRef.current) {
      appendLog("host: already running");
      return;
    }
    try {
      const ip = await getLanIpAddress();
      const randomBytes = createRandomBytes();
      const nonceNumber = generateLocalNonce(randomBytes);
      const address = { version: LOCAL_CODE_VERSION, ip, nonce: nonceNumber };
      const guestUrl = localGuestUrl(address);
      const nonceString = guestUrl.slice(guestUrl.indexOf("?r=") + 3);
      const roomCode = encodeLocalCode(ip, nonceNumber);
      const hostDeviceId = createHostDeviceId(randomBytes);

      const listener = createLocalListener(LOCAL_PORT, {
        onListening: () => appendLog(`host: listener listening on ${LOCAL_PORT}`),
        onServerError: (error) => appendLog(`host: server error -- ${String(error)}`),
        onServerClose: () => {
          appendLog("host: server closed");
          setHostRunning(false);
        },
        onSocketConnection: (remote) => appendLog(`host: connection from ${remote ?? "unknown"}`),
        onSocketData: (remote, count) => appendLog(`host: ${count} bytes from ${remote ?? "unknown"}`),
        onSocketError: (remote, error) =>
          appendLog(`host: socket error from ${remote ?? "unknown"} -- ${String(error)}`),
        onSocketClose: (remote) => appendLog(`host: socket closed ${remote ?? "unknown"}`),
      });

      const host = new LocalGameHost({
        listener,
        timers: createRnTimers(),
        now: Date.now,
        nonce: nonceString,
        hostDeviceId,
      });

      hostRef.current = host;
      setHostInfo({ ip, port: LOCAL_PORT, roomCode, guestUrl });
      setHostRunning(true);
      appendLog(`host: started -- room code ${roomCode}`);
      appendLog(`host: hostDeviceId ${hostDeviceId}`);

      let previous = { connectionCount: -1, playerCount: -1, status: "", phase: "" };
      pollRef.current = setInterval(() => {
        const state = host.state;
        const snapshot = {
          connectionCount: host.connectionCount,
          playerCount: host.playerCount,
          status: state.status,
          phase: state.phase,
        };
        if (
          snapshot.connectionCount !== previous.connectionCount ||
          snapshot.playerCount !== previous.playerCount ||
          snapshot.status !== previous.status ||
          snapshot.phase !== previous.phase
        ) {
          appendLog(
            `host: state -- connections=${snapshot.connectionCount} players=${snapshot.playerCount} status=${snapshot.status} phase=${snapshot.phase}`
          );
          previous = snapshot;
        }
      }, 1000);
    } catch (error) {
      appendLog(`host: failed to start -- ${String(error)}`);
    }
  }, [appendLog]);

  const stopAll = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    if (hostRef.current) {
      hostRef.current.stop();
      hostRef.current = null;
      setHostInfo(null);
      setHostRunning(false);
      appendLog("host: stopped");
    }
    if (echoServerRef.current) {
      echoServerRef.current.close();
      echoServerRef.current = null;
      setEchoRunning(false);
      appendLog("echo: stopped");
    }
  }, [appendLog]);

  return (
    <View style={{ flex: 1, paddingTop: 60, paddingHorizontal: 16, backgroundColor: "#0E0F13" }}>
      <Text style={{ color: "#fff", fontSize: 20, fontWeight: "700", marginBottom: 16 }}>Local host dev screen</Text>

      <Pressable
        onPress={startEchoTest}
        style={{
          backgroundColor: echoRunning ? "#2E7D32" : "#1E88E5",
          padding: 14,
          borderRadius: 8,
          marginBottom: 12,
        }}
      >
        <Text style={{ color: "#fff", fontSize: 16, textAlign: "center" }}>
          1. Raw TCP echo test {echoRunning ? "(running)" : ""}
        </Text>
      </Pressable>

      <Pressable
        onPress={startLocalHost}
        style={{
          backgroundColor: hostRunning ? "#2E7D32" : "#1E88E5",
          padding: 14,
          borderRadius: 8,
          marginBottom: 12,
        }}
      >
        <Text style={{ color: "#fff", fontSize: 16, textAlign: "center" }}>
          2. Start local game host {hostRunning ? "(running)" : ""}
        </Text>
      </Pressable>

      <Pressable onPress={stopAll} style={{ backgroundColor: "#C62828", padding: 14, borderRadius: 8, marginBottom: 16 }}>
        <Text style={{ color: "#fff", fontSize: 16, textAlign: "center" }}>Stop</Text>
      </Pressable>

      {hostInfo ? (
        <View style={{ marginBottom: 16, borderColor: "#333", borderWidth: 1, borderRadius: 8, padding: 12 }}>
          <Text selectable style={{ color: "#fff", fontSize: 16 }}>
            IP: {hostInfo.ip}
          </Text>
          <Text selectable style={{ color: "#fff", fontSize: 16 }}>
            Port: {hostInfo.port}
          </Text>
          <Text selectable style={{ color: "#fff", fontSize: 20, fontWeight: "700" }}>
            Room code: {hostInfo.roomCode}
          </Text>
          <Text selectable style={{ color: "#fff", fontSize: 14 }}>
            {hostInfo.guestUrl}
          </Text>
        </View>
      ) : null}

      <ScrollView style={{ flex: 1, borderColor: "#333", borderWidth: 1, borderRadius: 8, padding: 8 }}>
        {log.map((line, index) => (
          <Text key={index} style={{ color: "#9CCC65", fontFamily: "monospace", fontSize: 12 }}>
            {line}
          </Text>
        ))}
      </ScrollView>
    </View>
  );
}
