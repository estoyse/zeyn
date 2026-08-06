import { LOCAL_PROTOCOL_VERSION } from "./protocol";

export const GUEST_LOGIC_SCRIPT_ID = "guest-logic";

const GUEST_LOGIC_SCRIPT = `
var ZeynGuestLogic = (function () {
  "use strict";

  function parseRoomNonce(search) {
    var query = search.charAt(0) === "?" ? search.slice(1) : search;
    var pairs = query.split("&");
    for (var index = 0; index < pairs.length; index += 1) {
      var pair = pairs[index] || "";
      var separator = pair.indexOf("=");
      if (separator < 0) continue;
      if (pair.slice(0, separator) !== "r") continue;

      var encoded = pair.slice(separator + 1).replace(/\\+/g, " ");
      var decoded = "";
      try {
        decoded = decodeURIComponent(encoded);
      } catch (error) {
        void error;
        return null;
      }

      var nonce = decoded.trim();
      if (nonce.length === 0 || nonce.length > 200) return null;
      return nonce;
    }
    return null;
  }

  function mergePlayers(previous, incoming) {
    var merged = {};
    var carried = Object.keys(previous);
    for (var carriedIndex = 0; carriedIndex < carried.length; carriedIndex += 1) {
      var carriedId = carried[carriedIndex];
      merged[carriedId] = Object.assign({}, previous[carriedId]);
    }

    if (!incoming) return merged;

    var changed = Object.keys(incoming);
    for (var changedIndex = 0; changedIndex < changed.length; changedIndex += 1) {
      var changedId = changed[changedIndex];
      var base = merged[changedId] || {
        id: changedId,
        name: "",
        score: 0,
        connected: false
      };
      merged[changedId] = Object.assign({}, base, incoming[changedId]);
    }
    return merged;
  }

  function nextArmedAt(previousPhase, phase, previousArmedAt, now) {
    if (phase === "ARMED") {
      return previousPhase === "ARMED" ? previousArmedAt : now;
    }
    if (phase === "COLLECTING") return previousArmedAt;
    return null;
  }

  function reactionMsFor(armedAt, pressedAt) {
    if (armedAt === null) return null;
    var elapsed = pressedAt - armedAt;
    if (!isFinite(elapsed) || elapsed < 0) return 0;
    return Math.round(elapsed);
  }

  function buzzerView(inputs) {
    if (inputs.status === "WAITING") {
      return {
        enabled: false,
        label: "WAIT",
        caption: "Waiting for the host to start"
      };
    }
    if (inputs.status === "FINISHED") {
      return { enabled: false, label: "DONE", caption: "Game over" };
    }

    var playerId = inputs.playerId;
    if (inputs.phase === "IDLE") {
      return {
        enabled: false,
        label: "WAIT",
        caption: "Listen for the question"
      };
    }
    if (inputs.phase === "COLLECTING") {
      return { enabled: false, label: "WAIT", caption: "Locking in" };
    }
    if (inputs.phase === "LOCKED") {
      return { enabled: false, label: "LOCKED", caption: "Answer locked in" };
    }

    if (playerId !== null && inputs.lockedOutPlayerIds.indexOf(playerId) >= 0) {
      return {
        enabled: false,
        label: "OUT",
        caption: "You are locked out this round"
      };
    }
    if (playerId !== null && inputs.buzzedPlayerIds.indexOf(playerId) >= 0) {
      return { enabled: false, label: "IN", caption: "Buzzed!" };
    }
    if (inputs.armedAt === null) {
      return { enabled: false, label: "WAIT", caption: "Syncing" };
    }
    return { enabled: true, label: "BUZZ", caption: "Buzz in!" };
  }

  function scoreboardRows(players, nonScoringPlayerIds) {
    var excluded = nonScoringPlayerIds || [];
    var rows = [];
    var ids = Object.keys(players);
    for (var index = 0; index < ids.length; index += 1) {
      var id = ids[index];
      if (excluded.indexOf(id) >= 0) continue;
      var player = players[id];
      rows.push({
        id: id,
        name: player.name || "Player",
        score: player.score || 0,
        connected: player.connected === true,
        rank: 0
      });
    }

    rows.sort(function compare(left, right) {
      if (left.score !== right.score) return right.score - left.score;
      if (left.name !== right.name) return left.name < right.name ? -1 : 1;
      return left.id < right.id ? -1 : 1;
    });

    for (var ranked = 0; ranked < rows.length; ranked += 1) {
      var row = rows[ranked];
      var previous = rows[ranked - 1];
      row.rank =
        previous !== undefined && previous.score === row.score
          ? previous.rank
          : ranked + 1;
    }
    return rows;
  }

  function remainingMs(timerExpiresAt, clockOffsetMs, now) {
    if (!timerExpiresAt) return null;
    var left = timerExpiresAt - (now - clockOffsetMs);
    return left > 0 ? left : 0;
  }

  function formatSeconds(ms) {
    var seconds = Math.ceil(ms / 1000);
    return String(seconds > 0 ? seconds : 0);
  }

  function formatReactionMs(ms) {
    if (ms === null || !isFinite(ms)) return "";
    return String(Math.round(ms)) + "ms";
  }

  return {
    parseRoomNonce: parseRoomNonce,
    mergePlayers: mergePlayers,
    nextArmedAt: nextArmedAt,
    reactionMsFor: reactionMsFor,
    buzzerView: buzzerView,
    scoreboardRows: scoreboardRows,
    remainingMs: remainingMs,
    formatSeconds: formatSeconds,
    formatReactionMs: formatReactionMs
  };
})();
`;

const STYLES = `
:root {
  color-scheme: dark;
  --bg: #08080c;
  --panel: #14141c;
  --panel-edge: #26263a;
  --text: #f4f4f8;
  --muted: #9a9ab0;
  --accent: #ff3b5c;
  --accent-dim: #3a1522;
  --good: #35d07f;
}
* { box-sizing: border-box; margin: 0; padding: 0; }
html, body {
  height: 100%;
  background: var(--bg);
  color: var(--text);
  font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  -webkit-font-smoothing: antialiased;
  overscroll-behavior: none;
}
body {
  display: flex;
  flex-direction: column;
  min-height: 100dvh;
  padding: max(12px, env(safe-area-inset-top)) 16px max(16px, env(safe-area-inset-bottom));
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
}
[hidden] { display: none !important; }
header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding-bottom: 12px;
}
#room-name { font-size: 15px; font-weight: 650; letter-spacing: 0.01em; }
#link-state {
  font-size: 12px;
  font-weight: 600;
  color: var(--muted);
  display: flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
}
#link-dot {
  width: 8px; height: 8px; border-radius: 999px;
  background: var(--muted);
}
#link-dot.live { background: var(--good); }
#link-dot.down { background: var(--accent); }
main { flex: 1; display: flex; flex-direction: column; gap: 16px; }
.card {
  background: var(--panel);
  border: 1px solid var(--panel-edge);
  border-radius: 18px;
  padding: 16px;
}
#join { margin: auto 0; display: flex; flex-direction: column; gap: 14px; }
#join h1 { font-size: 26px; line-height: 1.15; font-weight: 750; }
#join p { color: var(--muted); font-size: 14px; line-height: 1.45; }
input[type="text"] {
  width: 100%;
  font: inherit;
  font-size: 17px;
  padding: 14px 16px;
  border-radius: 14px;
  border: 1px solid var(--panel-edge);
  background: #0e0e15;
  color: var(--text);
}
input[type="text"]:focus { outline: 2px solid var(--accent); outline-offset: 1px; }
button {
  font: inherit;
  font-weight: 700;
  color: var(--text);
  border: none;
  cursor: pointer;
  touch-action: manipulation;
  -webkit-user-select: none;
  user-select: none;
}
.primary {
  width: 100%;
  font-size: 17px;
  padding: 16px;
  border-radius: 14px;
  background: var(--accent);
}
.primary:disabled { opacity: 0.45; }
#stage {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 18px;
  min-height: 46dvh;
}
#headline {
  font-size: 19px;
  font-weight: 700;
  text-align: center;
  min-height: 24px;
  line-height: 1.3;
}
#headline.mine { color: var(--good); }
#countdown {
  font-variant-numeric: tabular-nums;
  font-size: 13px;
  font-weight: 700;
  color: var(--muted);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  min-height: 16px;
}
#buzzer {
  width: min(74vw, 290px);
  aspect-ratio: 1;
  border-radius: 999px;
  font-size: 30px;
  font-weight: 850;
  letter-spacing: 0.06em;
  background: radial-gradient(circle at 50% 34%, #ff5c77, var(--accent) 62%, #b81b38);
  box-shadow: 0 16px 40px -12px rgba(255, 59, 92, 0.6), inset 0 -6px 18px rgba(0,0,0,0.35);
  transition: transform 70ms ease-out, filter 120ms ease-out;
}
#buzzer:disabled {
  background: #1c1c26;
  color: #4e4e63;
  box-shadow: none;
  cursor: default;
}
#buzzer.pressed { transform: scale(0.94); filter: brightness(1.15); }
#me {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
}
#me-name { font-size: 15px; font-weight: 650; }
#me-score { font-size: 30px; font-weight: 800; font-variant-numeric: tabular-nums; }
#board-title {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--muted);
  margin-bottom: 10px;
}
#board { list-style: none; display: flex; flex-direction: column; gap: 2px; }
#board li {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: 10px;
  font-size: 15px;
}
#board li.mine { background: var(--accent-dim); }
#board li.away { opacity: 0.45; }
.rank { width: 22px; color: var(--muted); font-variant-numeric: tabular-nums; font-weight: 700; }
.who { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.pts { font-weight: 800; font-variant-numeric: tabular-nums; }
#notice {
  font-size: 14px;
  line-height: 1.45;
  color: var(--accent);
  text-align: center;
  min-height: 20px;
}
#fatal { margin: auto 0; text-align: center; display: flex; flex-direction: column; gap: 14px; }
#fatal h1 { font-size: 22px; font-weight: 750; }
#fatal p { color: var(--muted); font-size: 15px; line-height: 1.45; }
`;

const BODY = `
<header>
  <div id="room-name">Zeyn</div>
  <div id="link-state"><span id="link-dot"></span><span id="link-text">Offline</span></div>
</header>

<main>
  <section id="fatal" hidden>
    <h1 id="fatal-title">Something went wrong</h1>
    <p id="fatal-detail"></p>
    <button class="primary" id="fatal-retry" hidden>Try again</button>
  </section>

  <section id="join" hidden>
    <div>
      <h1>Get ready to buzz</h1>
      <p>Pick a name your friends will recognise on the scoreboard.</p>
    </div>
    <input id="name" type="text" inputmode="text" autocomplete="nickname"
      autocapitalize="words" autocorrect="off" spellcheck="false"
      maxlength="40" placeholder="Your name">
    <button class="primary" id="join-go">Join the room</button>
    <div id="notice"></div>
  </section>

  <section id="room" hidden>
    <div id="stage">
      <div id="countdown"></div>
      <button id="buzzer" type="button" disabled>WAIT</button>
      <div id="headline">Connecting&hellip;</div>
    </div>
    <div class="card" id="me">
      <span id="me-name"></span>
      <span id="me-score">0</span>
    </div>
    <div class="card">
      <div id="board-title">Scoreboard</div>
      <ul id="board"></ul>
    </div>
  </section>
</main>
`;

const SCRIPT = `
"use strict";
(function () {
  var parseRoomNonce = ZeynGuestLogic.parseRoomNonce;
  var mergePlayers = ZeynGuestLogic.mergePlayers;
  var nextArmedAt = ZeynGuestLogic.nextArmedAt;
  var reactionMsFor = ZeynGuestLogic.reactionMsFor;
  var buzzerView = ZeynGuestLogic.buzzerView;
  var scoreboardRows = ZeynGuestLogic.scoreboardRows;
  var remainingMs = ZeynGuestLogic.remainingMs;
  var formatSeconds = ZeynGuestLogic.formatSeconds;
  var formatReactionMs = ZeynGuestLogic.formatReactionMs;

  var DEVICE_KEY = "zeyn.local.deviceId";
  var NAME_KEY = "zeyn.local.name";
  var PROTOCOL_VERSION = ${LOCAL_PROTOCOL_VERSION};
  var RECONNECT_BASE_MS = 600;
  var RECONNECT_MAX_MS = 8000;
  var FATAL_CODES = ["BAD_NONCE", "BAD_HELLO", "ALREADY_FINISHED", "GUESTS_NOT_ALLOWED"];
  var FATAL_TITLES = {
    BAD_NONCE: "Wrong room code",
    BAD_HELLO: "This link is out of date",
    ALREADY_FINISHED: "That game already ended",
    GUESTS_NOT_ALLOWED: "This room is not open to guests",
    THROTTLED: "Too many attempts"
  };

  var byId = function (id) { return document.getElementById(id); };
  var joinSection = byId("join");
  var roomSection = byId("room");
  var fatalSection = byId("fatal");
  var fatalTitle = byId("fatal-title");
  var fatalDetail = byId("fatal-detail");
  var fatalRetry = byId("fatal-retry");
  var nameInput = byId("name");
  var joinButton = byId("join-go");
  var notice = byId("notice");
  var buzzer = byId("buzzer");
  var headline = byId("headline");
  var countdown = byId("countdown");
  var board = byId("board");
  var meName = byId("me-name");
  var meScore = byId("me-score");
  var roomName = byId("room-name");
  var linkDot = byId("link-dot");
  var linkText = byId("link-text");

  var memoryStore = {};
  function readStored(key) {
    try {
      var value = window.localStorage.getItem(key);
      if (value !== null) return value;
    } catch (error) { void error; }
    return Object.prototype.hasOwnProperty.call(memoryStore, key) ? memoryStore[key] : null;
  }
  function writeStored(key, value) {
    memoryStore[key] = value;
    try { window.localStorage.setItem(key, value); } catch (error) { void error; }
  }

  function randomToken() {
    var api = window.crypto || window.msCrypto;
    if (api && typeof api.randomUUID === "function") return api.randomUUID();
    if (api && typeof api.getRandomValues === "function") {
      var bytes = api.getRandomValues(new Uint8Array(16));
      var hex = "";
      for (var index = 0; index < bytes.length; index += 1) {
        hex += (bytes[index] + 256).toString(16).slice(1);
      }
      return hex;
    }
    var weak = "";
    for (var attempt = 0; attempt < 4; attempt += 1) {
      weak += Math.random().toString(36).slice(2, 10);
    }
    return weak + Date.now().toString(36);
  }

  function deviceToken() {
    var existing = readStored(DEVICE_KEY);
    if (existing && existing.length >= 16) return existing;
    var minted = randomToken();
    writeStored(DEVICE_KEY, minted);
    return minted;
  }

  var nonce = parseRoomNonce(window.location.search);
  var deviceId = deviceToken();
  var socket = null;
  var reconnectTimer = null;
  var reconnectAttempts = 0;
  var countdownTimer = null;
  var stopped = false;
  var playerName = "";

  var room = {
    playerId: null,
    state: null,
    players: {},
    previousPhase: null,
    armedAt: null,
    clockOffsetMs: 0
  };
  var buzzSent = false;

  function showFatal(title, detail, retryable) {
    stopped = true;
    if (reconnectTimer !== null) { window.clearTimeout(reconnectTimer); reconnectTimer = null; }
    if (socket !== null) { try { socket.close(); } catch (error) { void error; } socket = null; }
    setLink("down", "Stopped");
    joinSection.hidden = true;
    roomSection.hidden = true;
    fatalSection.hidden = false;
    fatalTitle.textContent = title;
    fatalDetail.textContent = detail;
    fatalRetry.hidden = !retryable;
  }

  function setLink(kind, text) {
    linkDot.className = kind;
    linkText.textContent = text;
  }

  if (nonce === null) {
    showFatal(
      "No room code",
      "This page needs the link from the host's QR code. Scan it again from the host's screen.",
      false
    );
    return;
  }

  fatalRetry.addEventListener("click", function () {
    window.location.reload();
  });

  var storedName = readStored(NAME_KEY);
  if (storedName) nameInput.value = storedName;
  joinSection.hidden = false;
  nameInput.addEventListener("input", function () { notice.textContent = ""; });

  joinButton.addEventListener("click", function () {
    var candidate = nameInput.value.trim().slice(0, 40);
    if (candidate.length === 0) {
      notice.textContent = "Enter a name first.";
      return;
    }
    playerName = candidate;
    writeStored(NAME_KEY, candidate);
    joinSection.hidden = true;
    roomSection.hidden = false;
    meName.textContent = candidate;
    connect();
  });

  function connect() {
    if (stopped) return;
    setLink("", reconnectAttempts === 0 ? "Connecting\\u2026" : "Reconnecting\\u2026");
    var url = (window.location.protocol === "https:" ? "wss://" : "ws://") + window.location.host + "/";
    var next;
    try {
      next = new WebSocket(url);
    } catch (error) {
      void error;
      scheduleReconnect();
      return;
    }
    socket = next;

    next.addEventListener("open", function () {
      if (socket !== next) return;
      next.send(JSON.stringify({
        type: "HELLO",
        v: PROTOCOL_VERSION,
        nonce: nonce,
        deviceId: deviceId,
        name: playerName
      }));
    });
    next.addEventListener("message", function (event) {
      if (socket !== next) return;
      receive(String(event.data));
    });
    next.addEventListener("close", function () {
      if (socket !== next) return;
      socket = null;
      room.previousPhase = null;
      room.armedAt = null;
      setLink("down", "Reconnecting\\u2026");
      render();
      scheduleReconnect();
    });
    next.addEventListener("error", function () {
      if (socket !== next) return;
      setLink("down", "Reconnecting\\u2026");
    });
  }

  function scheduleReconnect() {
    if (stopped || reconnectTimer !== null) return;
    var step = Math.min(reconnectAttempts, 5);
    var backoff = Math.min(RECONNECT_BASE_MS * Math.pow(1.7, step), RECONNECT_MAX_MS);
    var delay = backoff * (0.75 + Math.random() * 0.5);
    reconnectAttempts += 1;
    reconnectTimer = window.setTimeout(function () {
      reconnectTimer = null;
      connect();
    }, delay);
  }

  function receive(raw) {
    var message;
    try {
      message = JSON.parse(raw);
    } catch (error) {
      void error;
      return;
    }
    if (!message || typeof message !== "object") return;

    if (message.type === "WELCOME") {
      room.playerId = typeof message.playerId === "string" ? message.playerId : null;
      return;
    }
    if (message.type === "ERROR") {
      handleError(message);
      return;
    }
    if (message.type !== "STATE_UPDATE" || !message.state) return;

    var now = Date.now();
    var state = message.state;
    reconnectAttempts = 0;
    setLink("live", "Live");

    if (typeof message.serverTime === "number") {
      room.clockOffsetMs = now - message.serverTime;
    }
    room.players = mergePlayers(room.players, state.players);

    var previousArmedAt = room.armedAt;
    room.armedAt = nextArmedAt(room.previousPhase, state.phase, previousArmedAt, now);
    if (room.armedAt !== null && room.armedAt !== previousArmedAt) buzzSent = false;
    room.previousPhase = state.phase;
    room.state = state;

    render();
  }

  function handleError(message) {
    var code = typeof message.code === "string" ? message.code : "";
    var text = typeof message.message === "string" ? message.message : "Something went wrong";

    if (room.state === null) {
      var title = FATAL_TITLES[code] || "Could not join";
      var retryable = FATAL_CODES.indexOf(code) < 0;
      showFatal(title, text, retryable);
      return;
    }
    if (FATAL_CODES.indexOf(code) >= 0) {
      showFatal(FATAL_TITLES[code] || "Disconnected", text, false);
      return;
    }
    headline.textContent = text;
  }

  function lockedHeadline(state) {
    var winner = room.players[state.lockedPlayerId];
    var who = winner && winner.name ? winner.name : "Someone";
    var reaction = formatReactionMs(state.lockedReactionMs);
    return reaction ? who + " \\u2014 " + reaction : who + " buzzed";
  }

  function render() {
    var state = room.state;
    if (state === null) {
      buzzer.disabled = true;
      buzzer.textContent = "WAIT";
      headline.textContent = socket === null ? "Reconnecting\\u2026" : "Connecting\\u2026";
      return;
    }

    if (state.gameName) roomName.textContent = state.gameName;

    var view = buzzerView({
      status: state.status,
      phase: state.phase,
      lockedOutPlayerIds: state.lockedOutPlayerIds || [],
      buzzedPlayerIds: state.buzzedPlayerIds || [],
      playerId: room.playerId,
      armedAt: room.armedAt
    });

    buzzer.disabled = !view.enabled;
    buzzer.textContent = view.label;
    if (!view.enabled) buzzer.classList.remove("pressed");

    var mine = false;
    if (state.status === "FINISHED") {
      headline.textContent = "Final scores";
    } else if (state.phase === "LOCKED" && state.lockedPlayerId) {
      headline.textContent = lockedHeadline(state);
      mine = state.lockedPlayerId === room.playerId;
    } else {
      headline.textContent = view.caption;
    }
    headline.classList.toggle("mine", mine);

    renderCountdown();
    renderBoard(state);
  }

  function renderCountdown() {
    var state = room.state;
    if (state === null || state.status !== "PLAYING") {
      countdown.textContent = "";
      return;
    }
    var left = remainingMs(state.timerExpiresAt || 0, room.clockOffsetMs, Date.now());
    if (left === null || state.phase === "COLLECTING") {
      countdown.textContent = "";
      return;
    }
    countdown.textContent = formatSeconds(left) + "s";
  }

  function renderBoard(state) {
    var rows = scoreboardRows(room.players, state.nonScoringPlayerIds);
    while (board.firstChild !== null) board.removeChild(board.firstChild);

    for (var index = 0; index < rows.length; index += 1) {
      var row = rows[index];
      var item = document.createElement("li");
      if (row.id === room.playerId) item.className = "mine";
      else if (!row.connected) item.className = "away";

      var rank = document.createElement("span");
      rank.className = "rank";
      rank.textContent = String(row.rank);

      var who = document.createElement("span");
      who.className = "who";
      who.textContent = row.name;

      var points = document.createElement("span");
      points.className = "pts";
      points.textContent = String(row.score);

      item.appendChild(rank);
      item.appendChild(who);
      item.appendChild(points);
      board.appendChild(item);

      if (row.id === room.playerId) {
        meName.textContent = row.name;
        meScore.textContent = String(row.score);
      }
    }
  }

  function onBuzzDown(event) {
    var pressedAt = Date.now();
    if (event.cancelable) event.preventDefault();
    if (buzzSent || buzzer.disabled) return;

    var reactionMs = reactionMsFor(room.armedAt, pressedAt);
    if (reactionMs === null) return;
    if (socket === null || socket.readyState !== 1) return;

    buzzSent = true;
    buzzer.classList.add("pressed");
    try {
      socket.send(JSON.stringify({
        type: "BUZZ",
        playerId: room.playerId || "me",
        reactionMs: reactionMs
      }));
    } catch (error) {
      void error;
      buzzSent = false;
      return;
    }
    if (typeof navigator.vibrate === "function") navigator.vibrate(35);
    buzzer.disabled = true;
    buzzer.textContent = "IN";
    headline.textContent = "Buzzed in " + formatReactionMs(reactionMs);
  }

  if (typeof window.PointerEvent === "function") {
    buzzer.addEventListener("pointerdown", onBuzzDown);
  } else {
    buzzer.addEventListener("touchstart", onBuzzDown, { passive: false });
    buzzer.addEventListener("mousedown", onBuzzDown);
  }
  buzzer.addEventListener("contextmenu", function (event) { event.preventDefault(); });

  countdownTimer = window.setInterval(renderCountdown, 100);
  window.addEventListener("pagehide", function () {
    window.clearInterval(countdownTimer);
  });
})();
`;

export function buildGuestPage(): string {
  return [
    "<!doctype html>",
    '<html lang="en">',
    "<head>",
    '<meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover">',
    '<meta name="color-scheme" content="dark">',
    '<meta name="theme-color" content="#08080c">',
    '<meta name="robots" content="noindex">',
    "<title>Zeyn &mdash; Buzz in</title>",
    `<style>${STYLES}</style>`,
    "</head>",
    "<body>",
    BODY,
    `<script id="${GUEST_LOGIC_SCRIPT_ID}">${GUEST_LOGIC_SCRIPT}</script>`,
    `<script>${SCRIPT}</script>`,
    "</body>",
    "</html>",
  ].join("\n");
}
