import { DurableObject } from "cloudflare:workers";
import { createD1Db, inArray, eq, schema } from "@shaxsiy-oyin/db";
import { isFuzzyMatch } from "../utils/fuzzy-match";
import {
  gameConfig,
  type ClientMessage,
  type ServerMessage,
  type GameState,
} from "@shaxsiy-oyin/api/game-types";

export class GameRoom extends DurableObject {
  private state: GameState = {
    status: "WAITING",
    roomId: null,
    roomName: null,
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
  private roomPassword: string | null = null;
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
        state: this.state,
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
          action.roomId,
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
    this.broadcast({
      type: "STATE_UPDATE",
      state: this.state,
      serverTime: Date.now(),
    });
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
    roomId: string,
    password?: string
  ) {
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
    if (!this.state.roomId) {
      const db = createD1Db(this.env.DB);
      const room = await db
        .select()
        .from(schema.activeRooms)
        .where(eq(schema.activeRooms.id, roomId))
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

      this.state.roomId = roomId;
      this.state.roomName = room.name;
      this.state.hostId = room.hostId;
      this.state.maxPlayers = room.maxPlayers;
      this.state.isPublic = room.isPublic;
      this.state.hasPassword = !!room.password;
      this.roomPassword = room.password;

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
    if (this.roomPassword && this.roomPassword !== password) {
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

    this.state.players[playerId] = {
      id: playerId,
      name: name,
      score: 0,
      connected: true,
    };
    (ws as any).playerId = playerId;
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
    if (!this.state.roomId) return;
    try {
      const db = createD1Db(this.env.DB);
      await db
        .update(schema.activeRooms)
        .set({ status })
        .where(eq(schema.activeRooms.id, this.state.roomId));
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
    this.broadcast({
      type: "STATE_UPDATE",
      state: this.state,
      serverTime: Date.now(),
    });
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
    this.broadcast({
      type: "STATE_UPDATE",
      state: this.state,
      serverTime: Date.now(),
    });
  }

  private async persistResults() {
    if (!this.state.hostId) return;
    const db = createD1Db(this.env.DB);
    const gameId = crypto.randomUUID();

    try {
      // 1. Create game history
      await db.insert(schema.gameHistory).values({
        id: gameId,
        roomId: this.state.roomId || "unknown",
        hostId: this.state.hostId,
        createdAt: new Date(),
      });

      // 2. Insert question results
      if (this.state.questionResults.length > 0) {
        await db.insert(schema.gameQuestionResults).values(
          this.state.questionResults.map(r => ({
            id: crypto.randomUUID(),
            gameId: gameId,
            userId: r.userId,
            questionId: r.questionId,
            correct: r.correct,
            pointsAwarded: r.pointsAwarded,
          }))
        );
      }

      // 3. Insert final player results
      const players = Object.values(this.state.players);
      if (players.length > 0) {
        await db.insert(schema.gamePlayerResults).values(
          players.map(p => ({
            id: crypto.randomUUID(),
            gameId: gameId,
            userId: p.id,
            playerName: p.name,
            score: p.score,
          }))
        );
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
    if (playerId && this.state.players[playerId]) {
      this.state.players[playerId].connected = false;
      this.broadcast({
        type: "STATE_UPDATE",
        state: this.state,
        serverTime: Date.now(),
      });
      await this.saveState();
    }
  }

  async webSocketError(ws: WebSocket, _error: any) {
    this.webSocketClose(ws, 1011, "Error", false);
  }

  private broadcast(message: ServerMessage) {
    if (message.type === "STATE_UPDATE") {
      message.serverTime = Date.now();
    }
    const data = JSON.stringify(message);
    for (const ws of this.ctx.getWebSockets()) {
      try {
        ws.send(data);
      } catch (e) {
        // socket might be closed
      }
    }
  }
}
