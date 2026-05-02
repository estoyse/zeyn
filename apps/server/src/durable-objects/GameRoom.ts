import { DurableObject } from "cloudflare:workers";
import { 
  createD1Db, 
  inArray,
  schema
} from "@shaxsiy-oyin/db";
const { 
  questions, 
  subjects: subjectsTable,
  gameHistory 
} = schema;
import { isFuzzyMatch } from "../utils/fuzzy-match";

interface Question {
  id: string;
  text: string;
  answer: string;
  points: number;
}

interface Subject {
  id: string;
  name: string;
  questions: Question[];
}

interface Player {
  id: string;
  name: string;
  score: number;
  connected: boolean;
}

interface GameState {
  status: "WAITING" | "PLAYING" | "FINISHED";
  hostId: string | null;
  players: Record<string, Player>;
  subjects: Subject[];
  currentSubjectIndex: number;
  currentQuestionIndex: number;
  phase: "SUBJECT_REVEAL" | "ACTIVE" | "ANSWERING" | "REVEALED";
  activeQuestionState: {
    buzzedPlayerId: string | null;
    wrongAttempts: number;
    playersWhoAttempted: string[];
    timerExpiresAt: number;
  } | null;
}

type ClientMessage =
  | { type: "JOIN"; playerId: string; name: string }
  | { type: "START"; playerId: string; subjectIds: string[] }
  | { type: "BUZZ"; playerId: string }
  | { type: "SUBMIT_ANSWER"; playerId: string; answer: string };

type ServerMessage =
  | { type: "STATE_UPDATE"; state: GameState }
  | { type: "ERROR"; message: string };

export class GameRoom extends DurableObject {
  private state: GameState = {
    status: "WAITING",
    hostId: null,
    players: {},
    subjects: [],
    currentSubjectIndex: 0,
    currentQuestionIndex: 0,
    phase: "SUBJECT_REVEAL",
    activeQuestionState: null,
  };

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
    server.send(JSON.stringify({ type: "STATE_UPDATE", state: this.state }));
    
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
      ws.send(JSON.stringify({ type: "ERROR", message: "Invalid message format" }));
    }
  }

  private async handleClientAction(ws: WebSocket, action: ClientMessage) {
    switch (action.type) {
      case "JOIN":
        this.handleJoin(ws, action.playerId, action.name);
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

    await this.ctx.storage.put("state", this.state);
    this.broadcast({ type: "STATE_UPDATE", state: this.state });
  }

  private handleJoin(ws: WebSocket, playerId: string, name: string) {
    if (!this.state.hostId) {
      this.state.hostId = playerId;
    }
    this.state.players[playerId] = {
      id: playerId,
      name: name,
      score: 0,
      connected: true,
    };
    (ws as any).playerId = playerId;
  }

  private async handleStart(ws: WebSocket, playerId: string, subjectIds: string[]) {
    if (this.state.hostId !== playerId) {
      ws.send(JSON.stringify({ type: "ERROR", message: "Only the host can start the game" }));
      return;
    }
    if (this.state.status !== "WAITING") {
      ws.send(JSON.stringify({ type: "ERROR", message: "Game already started" }));
      return;
    }

    const db = createD1Db(this.env.DB);
    const subjectsData = await db
      .select()
      .from(subjectsTable)
      .where(inArray(subjectsTable.id, subjectIds));
    const questionsData = await db
      .select()
      .from(questions)
      .where(inArray(questions.subjectId, subjectIds));

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
          points: q.points
        }))
    }));

    if (this.state.subjects.some(s => s.questions.length !== 5)) {
       ws.send(JSON.stringify({ type: "ERROR", message: "Each subject must have exactly 5 questions" }));
       return;
    }

    this.state.status = "PLAYING";
    this.startQuestionCycle();
  }

  private startQuestionCycle() {
     this.state.phase = "ACTIVE";
     this.state.activeQuestionState = {
       buzzedPlayerId: null,
       wrongAttempts: 0,
       playersWhoAttempted: [],
       timerExpiresAt: Date.now() + 15000
     };
     
     this.setTimer(15000, () => this.handleQuestionTimeout());
  }

  private handleBuzz(_ws: WebSocket, playerId: string) {
    if (this.state.phase !== "ACTIVE") return;
    if (this.state.activeQuestionState?.buzzedPlayerId) return;
    if (this.state.activeQuestionState?.playersWhoAttempted.includes(playerId)) return;

    this.state.phase = "ANSWERING";
    this.state.activeQuestionState!.buzzedPlayerId = playerId;
    this.state.activeQuestionState!.timerExpiresAt = Date.now() + 20000;

    this.setTimer(20000, () => this.handleAnswerTimeout());
  }

  private handleSubmitAnswer(_ws: WebSocket | null, playerId: string, answer: string) {
    if (this.state.phase !== "ANSWERING") return;
    if (!this.state.activeQuestionState || this.state.activeQuestionState.buzzedPlayerId !== playerId) return;

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
      this.revealAnswer();
    } else {
      const player = this.state.players[playerId];
      if (player) {
        player.score -= currentQuestion.points;
      }
      this.state.activeQuestionState.wrongAttempts++;
      this.state.activeQuestionState.playersWhoAttempted.push(playerId);
      this.state.activeQuestionState.buzzedPlayerId = null;
      
      if (this.state.activeQuestionState.wrongAttempts >= 3) {
        this.revealAnswer();
      } else {
        this.state.phase = "ACTIVE";
        this.state.activeQuestionState.timerExpiresAt = Date.now() + 10000;
        this.setTimer(10000, () => this.handleQuestionTimeout());
      }
    }
  }

  private revealAnswer() {
    this.state.phase = "REVEALED";
    if (this.state.activeQuestionState) {
      this.state.activeQuestionState.timerExpiresAt = Date.now() + 5000;
    }
    this.setTimer(5000, () => this.nextQuestion());
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
      await this.persistResults();
    } else {
      this.startQuestionCycle();
    }
    
    this.broadcast({ type: "STATE_UPDATE", state: this.state });
  }

  private async persistResults() {
    if (!this.state.hostId) return;
    const db = createD1Db(this.env.DB);
    const gameId = crypto.randomUUID();
    await db.insert(gameHistory).values({
      id: gameId,
      hostId: this.state.hostId,
      createdAt: new Date(),
    });
  }

  private handleQuestionTimeout() {
     if (this.state.phase === "ACTIVE") {
       this.revealAnswer();
       this.broadcast({ type: "STATE_UPDATE", state: this.state });
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
    setTimeout(callback, ms);
  }

  async webSocketClose(ws: WebSocket, _code: number, _reason: string, _wasClean: boolean) {
    const playerId = (ws as any).playerId;
    if (playerId && this.state.players[playerId]) {
      this.state.players[playerId].connected = false;
      this.broadcast({ type: "STATE_UPDATE", state: this.state });
    }
  }

  async webSocketError(ws: WebSocket, _error: any) {
    this.webSocketClose(ws, 1011, "Error", false);
  }

  private broadcast(message: ServerMessage) {
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
