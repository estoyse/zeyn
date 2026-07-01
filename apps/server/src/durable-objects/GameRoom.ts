import { DurableObject } from "cloudflare:workers";
import { createD1Db, inArray, eq, schema } from "@shaxsiy-oyin/db";
import { isFuzzyMatch } from "../utils/fuzzy-match";
import {
  gameConfig,
  type ClientMessage,
  type GameState,
} from "@shaxsiy-oyin/api/game-types";

// Cloudflare D1 rejects any query with more than 100 bound parameters. Multi-row
// inserts must be split so (columns * rows) stays under this ceiling.
const D1_MAX_PARAMS_PER_QUERY = 99;

function chunk<T>(items: T[], size: number): T[][] {
  const maxPerChunk = Math.max(1, Math.floor(size));
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += maxPerChunk) {
    chunks.push(items.slice(i, i + maxPerChunk));
  }
  return chunks;
}

export class GameRoom extends DurableObject {
  private state: GameState = {
    status: "WAITING",
    gameId: null,
    gameName: null,
    hostId: null,
    maxPlayers: 10,
    isPublic: true,
    hasPassword: false,
    players: {},
    subjects: [],
    currentSubjectIndex: 0,
    currentQuestionIndex: 0,
    phase: "ACTIVE",
    activeQuestionState: null,
    questionResults: [],
  };
  private lastBroadcastPlayers: Record<string, string> = {}; // playerId -> JSON string of player state
  private gamePassword: string | null = null;
  private timerId: any = null;

  constructor(ctx: DurableObjectState, env: any) {
    super(ctx, env);
    this.ctx.blockConcurrencyWhile(async () => {
      const savedState = await this.ctx.storage.get<GameState>("state");
      if (savedState) {
        this.state = savedState;
      }
    });
  }

  async fetch(_request: Request): Promise<Response> {
    if (_request.headers.get("Upgrade") === "websocket") {
      return this.handleWebSocket(_request);
    }
    return new Response("Not found", { status: 404 });
  }

  async handleWebSocket(_request: Request): Promise<Response> {
    const pair = new WebSocketPair();
    const client = pair[0];
    const server = pair[1];

    this.ctx.acceptWebSocket(server);

    // Send initial state
    server.send(
      JSON.stringify({
        type: "STATE_UPDATE",
        state: this.getPublicState(true),
        serverTime: Date.now(),
      })
    );

    return new Response(null, {
      status: 101,
      webSocket: client,
    });
  }

  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer) {
    if (typeof message !== "string") return;
    try {
      const data: ClientMessage = JSON.parse(message);
      await this.handleClientAction(ws, data);
    } catch (e) {
      ws.send(
        JSON.stringify({ type: "ERROR", message: "Invalid message format" })
      );
    }
  }

  private async handleClientAction(ws: WebSocket, action: ClientMessage) {
    switch (action.type) {
      case "JOIN":
        await this.handleJoin(
          ws,
          action.playerId,
          action.name,
          action.gameId,
          action.password
        );
        break;
      case "START":
        await this.handleStart(ws, action.playerId, action.subjectIds);
        break;
      case "BUZZ":
        this.handleBuzz(ws, action.playerId);
        break;
      case "SUBMIT_ANSWER":
        this.handleSubmitAnswer(ws, action.playerId, action.answer);
        break;
    }

    await this.saveState();
    this.broadcast();
  }

  private async saveState() {
    try {
      await this.ctx.storage.put("state", this.state);
    } catch (e) {
      console.error("Failed to save state to storage:", e);
    }
  }

  private async handleJoin(
    ws: WebSocket,
    playerId: string,
    name: string,
    gameId: string,
    password?: string
  ) {
    if (!playerId || !name) {
      ws.send(
        JSON.stringify({
          type: "ERROR",
          message: "Player ID and name are required to join.",
        })
      );
      ws.close();
      return;
    }

    if (playerId.startsWith("guest-")) {
      ws.send(
        JSON.stringify({
          type: "ERROR",
          message: "Guest access is disabled. Please login.",
        })
      );
      ws.close();
      return;
    }

    // Hydrate room from DB if not already initialized
    if (!this.state.gameId) {
      const db = createD1Db(this.env.DB);
      const room = await db
        .select()
        .from(schema.activeGames)
        .where(eq(schema.activeGames.id, gameId))
        .get();

      if (!room) {
        ws.send(
          JSON.stringify({
            type: "ERROR",
            code: "NOT_FOUND",
            message: "Room not found",
          })
        );
        ws.close();
        return;
      }

      if (room.status === "playing") {
        ws.send(
          JSON.stringify({
            type: "ERROR",
            code: "ALREADY_STARTED",
            message: "Game already started",
          })
        );
        ws.close();
        return;
      }

      if (room.status === "finished") {
        ws.send(
          JSON.stringify({
            type: "ERROR",
            code: "ALREADY_FINISHED",
            message: "Game already ended",
          })
        );
        ws.close();
        return;
      }

      this.state.gameId = gameId;
      this.state.gameName = room.name;
      this.state.hostId = room.hostId;
      this.state.maxPlayers = room.maxPlayers;
      this.state.isPublic = room.isPublic;
      this.state.hasPassword = !!room.password;
      this.gamePassword = room.password;

      // Pre-load subjects
      const subjectIds = JSON.parse(room.subjectIds) as string[];
      const subjectsData = await db
        .select()
        .from(schema.subjects)
        .where(inArray(schema.subjects.id, subjectIds));
      const questionsData = await db
        .select()
        .from(schema.questions)
        .where(inArray(schema.questions.subjectId, subjectIds));

      this.state.subjects = subjectsData.map((s: any) => ({
        id: s.id,
        name: s.name,
        questions: questionsData
          .filter((q: any) => q.subjectId === s.id)
          .sort((a: any, b: any) => a.points - b.points)
          .map((q: any) => ({
            id: q.id,
            text: q.text,
            answer: q.answer,
            points: q.points,
          })),
      }));
    }

    // Password Validation
    if (this.gamePassword && this.gamePassword !== password) {
      ws.send(
        JSON.stringify({
          type: "ERROR",
          code: "PASSWORD_REQUIRED",
          message: "Incorrect or missing password for this room",
        })
      );
      return;
    }

    // Player Limit Check
    if (
      Object.keys(this.state.players).length >= this.state.maxPlayers &&
      !this.state.players[playerId]
    ) {
      ws.send(JSON.stringify({ type: "ERROR", message: "Room is full" }));
      return;
    }

    const existingPlayer = this.state.players[playerId];
    if (existingPlayer) {
      existingPlayer.connected = true;
      existingPlayer.name = name;
    } else {
      this.state.players[playerId] = {
        id: playerId,
        name: name,
        score: 0,
        connected: true,
      };
    }

    (ws as any).playerId = playerId;
    (ws as any).joinTime = Date.now();
  }

  private async handleStart(
    ws: WebSocket,
    playerId: string,
    subjectIds?: string[]
  ) {
    if (this.state.hostId !== playerId) {
      ws.send(
        JSON.stringify({
          type: "ERROR",
          message: "Only the host can start the game",
        })
      );
      return;
    }
    if (this.state.status !== "WAITING") {
      ws.send(
        JSON.stringify({ type: "ERROR", message: "Game already started" })
      );
      return;
    }

    // If subjects are already loaded (from DB hydration), we don't need to fetch them again
    if (
      this.state.subjects.length === 0 &&
      subjectIds &&
      subjectIds.length > 0
    ) {
      const db = createD1Db(this.env.DB);
      const subjectsData = await db
        .select()
        .from(schema.subjects)
        .where(inArray(schema.subjects.id, subjectIds));
      const questionsData = await db
        .select()
        .from(schema.questions)
        .where(inArray(schema.questions.subjectId, subjectIds));

      this.state.subjects = subjectsData.map((s: any) => ({
        id: s.id,
        name: s.name,
        questions: questionsData
          .filter((q: any) => q.subjectId === s.id)
          .sort((a: any, b: any) => a.points - b.points)
          .map((q: any) => ({
            id: q.id,
            text: q.text,
            answer: q.answer,
            points: q.points,
          })),
      }));
    }

    if (this.state.subjects.length < gameConfig.minSubjects) {
      ws.send(
        JSON.stringify({
          type: "ERROR",
          message: "Game requires at least 5 subjects to start",
        })
      );
      return;
    }

    // Update room status to PLAYING
    await this.updateRoomStatus("playing");

    this.state.status = "PLAYING";
    this.startQuestionCycle();
  }

  private async updateRoomStatus(status: "waiting" | "playing" | "finished") {
    if (!this.state.gameId) return;
    try {
      const db = createD1Db(this.env.DB);
      await db
        .update(schema.activeGames)
        .set({ status })
        .where(eq(schema.activeGames.id, this.state.gameId));
    } catch (e) {
      console.error("Failed to update room status:", e);
    }
  }

  private startQuestionCycle() {
    this.state.phase = "ACTIVE";
    this.state.activeQuestionState = {
      buzzedPlayerId: null,
      wrongAttempts: 0,
      playersWhoAttempted: [],
      timerExpiresAt: Date.now() + gameConfig.questionTimeMs,
    };

    this.setTimer(gameConfig.questionTimeMs, () =>
      this.handleQuestionTimeout()
    );
  }

  private handleBuzz(_ws: WebSocket, playerId: string) {
    if (!this.state.players[playerId]?.connected) return;
    if (this.state.phase !== "ACTIVE") return;
    if (this.state.activeQuestionState?.buzzedPlayerId) return;
    if (this.state.activeQuestionState?.playersWhoAttempted.includes(playerId))
      return;

    this.state.phase = "ANSWERING";
    this.state.activeQuestionState!.buzzedPlayerId = playerId;
    this.state.activeQuestionState!.timerExpiresAt =
      Date.now() + gameConfig.answerTimeMs;

    this.setTimer(gameConfig.answerTimeMs, () => this.handleAnswerTimeout());
  }

  private handleSubmitAnswer(
    _ws: WebSocket | null,
    playerId: string,
    answer: string
  ) {
    if (!this.state.players[playerId]?.connected) return;
    if (this.state.phase !== "ANSWERING") return;
    if (
      !this.state.activeQuestionState ||
      this.state.activeQuestionState.buzzedPlayerId !== playerId
    )
      return;

    const subject = this.state.subjects[this.state.currentSubjectIndex];
    if (!subject) return;
    const currentQuestion = subject.questions[this.state.currentQuestionIndex];
    if (!currentQuestion) return;

    const isCorrect = isFuzzyMatch(answer, currentQuestion.answer);

    if (isCorrect) {
      const player = this.state.players[playerId];
      if (player) {
        player.score += currentQuestion.points;
      }
      this.state.questionResults.push({
        questionId: currentQuestion.id,
        userId: playerId,
        correct: true,
        pointsAwarded: currentQuestion.points,
        subjectIndex: this.state.currentSubjectIndex,
        questionIndex: this.state.currentQuestionIndex,
        subjectName: subject.name,
      });
      this.revealAnswer();
    } else {
      const player = this.state.players[playerId];
      if (player) {
        player.score -= currentQuestion.points;
      }
      this.state.questionResults.push({
        questionId: currentQuestion.id,
        userId: playerId,
        correct: false,
        pointsAwarded: -currentQuestion.points,
        subjectIndex: this.state.currentSubjectIndex,
        questionIndex: this.state.currentQuestionIndex,
        subjectName: subject.name,
      });

      this.state.activeQuestionState.wrongAttempts++;
      this.state.activeQuestionState.playersWhoAttempted.push(playerId);
      this.state.activeQuestionState.buzzedPlayerId = null;

      if (
        this.state.activeQuestionState.wrongAttempts >=
        gameConfig.maxWrongAttempts
      ) {
        this.revealAnswer();
      } else {
        this.state.phase = "ACTIVE";
        this.state.activeQuestionState.timerExpiresAt =
          Date.now() + gameConfig.questionTimeMs;
        this.setTimer(gameConfig.questionTimeMs, () =>
          this.handleQuestionTimeout()
        );
      }
    }
  }

  private revealAnswer() {
    this.state.phase = "REVEALED";
    if (this.state.activeQuestionState) {
      this.state.activeQuestionState.timerExpiresAt =
        Date.now() + gameConfig.revealTimeMs;
    }
    this.broadcast();
    this.saveState();
    this.setTimer(gameConfig.revealTimeMs, () => this.nextQuestion());
  }

  private async nextQuestion() {
    this.state.currentQuestionIndex++;
    if (this.state.currentQuestionIndex >= 5) {
      this.state.currentQuestionIndex = 0;
      this.state.currentSubjectIndex++;
    }

    if (this.state.currentSubjectIndex >= this.state.subjects.length) {
      this.state.status = "FINISHED";
      this.state.phase = "REVEALED";
      await this.updateRoomStatus("finished");
      await this.persistResults();
      this.clearTimer();
    } else {
      this.startQuestionCycle();
    }

    await this.saveState();
    this.broadcast();
  }

  private async persistResults() {
    if (!this.state.hostId) return;
    const db = createD1Db(this.env.DB);
    const gameId = crypto.randomUUID();

    try {
      // 1. Create game history (snapshot subject order for the scoreboard)
      await db.insert(schema.gameHistory).values({
        id: gameId,
        gameId: this.state.gameId || "unknown",
        hostId: this.state.hostId,
        subjects: JSON.stringify(this.state.subjects.map(s => s.name)),
        createdAt: new Date(),
      });

      // 2. Insert question results.
      // NOTE: D1 caps a query at 100 bound parameters, so these multi-row
      // inserts must be chunked (9 columns -> max 11 rows/query). A full game
      // easily produces dozens of rows; a single insert would throw and, being
      // swallowed below, silently drop every result. See CHUNK_SIZES.
      if (this.state.questionResults.length > 0) {
        const rows = this.state.questionResults.map(r => ({
          id: crypto.randomUUID(),
          gameId: gameId,
          userId: r.userId,
          questionId: r.questionId,
          subjectName: r.subjectName,
          subjectPosition: r.subjectIndex,
          questionPosition: r.questionIndex,
          correct: r.correct,
          pointsAwarded: r.pointsAwarded,
        }));
        for (const part of chunk(rows, D1_MAX_PARAMS_PER_QUERY / 9)) {
          await db.insert(schema.gameQuestionResults).values(part);
        }
      }

      // 3. Insert final player results (5 columns -> max 20 rows/query).
      const players = Object.values(this.state.players);
      if (players.length > 0) {
        const rows = players.map(p => ({
          id: crypto.randomUUID(),
          gameId: gameId,
          userId: p.id,
          playerName: p.name,
          score: p.score,
        }));
        for (const part of chunk(rows, D1_MAX_PARAMS_PER_QUERY / 5)) {
          await db.insert(schema.gamePlayerResults).values(part);
        }
      }
    } catch (e) {
      console.error("Failed to persist game results:", e);
    }
  }

  private handleQuestionTimeout() {
    if (this.state.phase === "ACTIVE") {
      this.revealAnswer();
    }
  }

  private handleAnswerTimeout() {
    if (this.state.phase === "ANSWERING") {
      const playerId = this.state.activeQuestionState?.buzzedPlayerId;
      if (playerId) {
        this.handleSubmitAnswer(null, playerId, "");
      }
    }
  }

  private setTimer(ms: number, callback: () => void) {
    if (this.timerId) {
      clearTimeout(this.timerId);
    }
    this.timerId = setTimeout(callback, ms);
  }

  private clearTimer() {
    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
  }

  async webSocketClose(
    ws: WebSocket,
    _code: number,
    _reason: string,
    _wasClean: boolean
  ) {
    const playerId = (ws as any).playerId;
    const joinTime = (ws as any).joinTime;

    if (playerId && this.state.players[playerId]) {
      // Only mark disconnected if this was the latest connection
      // or if no other connections for this player exist
      const otherConnections = this.ctx
        .getWebSockets()
        .filter(
          s =>
            (s as any).playerId === playerId && (s as any).joinTime > joinTime
        );

      if (otherConnections.length === 0) {
        this.state.players[playerId].connected = false;
        this.broadcast();
        await this.saveState();
      }
    }
  }

  async webSocketError(ws: WebSocket, _error: any) {
    this.webSocketClose(ws, 1011, "Error", false);
  }

  private broadcast() {
    const publicState = this.getPublicState();
    const data = JSON.stringify({
      type: "STATE_UPDATE",
      state: publicState,
      serverTime: Date.now(),
    });

    for (const ws of this.ctx.getWebSockets()) {
      try {
        ws.send(data);
      } catch (e) {
        // socket might be closed
      }
    }
  }

  private getPublicState(forceFullPlayers = false): any {
    const { subjects, players, ...baseState } = this.state;

    // Calculate player deltas
    const playerDeltas: Record<string, any> = {};
    let hasChanges = false;

    for (const [id, player] of Object.entries(players)) {
      const playerJson = JSON.stringify(player);
      if (forceFullPlayers || this.lastBroadcastPlayers[id] !== playerJson) {
        playerDeltas[id] = player;
        this.lastBroadcastPlayers[id] = playerJson;
        hasChanges = true;
      }
    }

    const publicState: any = {
      ...baseState,
      subjectCount: subjects.length,
    };

    if (hasChanges || forceFullPlayers) {
      publicState.players = playerDeltas;
    }

    if (this.state.status === "PLAYING") {
      const currentSubject = subjects[this.state.currentSubjectIndex];
      const currentQuestion =
        currentSubject?.questions?.[this.state.currentQuestionIndex];

      if (currentSubject) {
        publicState.currentSubjectName = currentSubject.name;
      }

      if (currentQuestion) {
        publicState.currentQuestion = {
          text: currentQuestion.text,
          points: currentQuestion.points,
        };

        if (this.state.phase === "REVEALED") {
          publicState.currentQuestion.answer = currentQuestion.answer;
        }
      }
    }

    return publicState;
  }
}
