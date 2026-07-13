export type GameEvent =
  | { type: "gameStart" }
  | { type: "questionStart"; questionIndex: number }
  | { type: "buzz"; playerId: string; isSelf: boolean }
  | { type: "lockIn"; playerId: string; isSelf: boolean }
  | {
      type: "answer";
      playerId: string;
      isSelf: boolean;
      correct: boolean;
      points: number;
    }
  | { type: "reveal"; solved: boolean; selfScored: boolean }
  | { type: "gameEnd" };

export type GameEventDiff<S> = (prev: S, next: S, selfId: string) => GameEvent[];

export type EventCursor<S> = {
  prev: S | null;
  armed: boolean;
};

export type EventStreamInput<S> = {
  state: S | null;
  isConnected: boolean;
  selfId: string;
};

export function initialCursor<S>(): EventCursor<S> {
  return { prev: null, armed: false };
}

export function advanceEventStream<S>(
  cursor: EventCursor<S>,
  input: EventStreamInput<S>,
  diff: GameEventDiff<S>
): { cursor: EventCursor<S>; events: GameEvent[] } {
  const { state, isConnected, selfId } = input;

  if (!isConnected) {
    return { cursor: { prev: state ?? cursor.prev, armed: false }, events: [] };
  }

  if (state === null) {
    return { cursor: { prev: cursor.prev, armed: false }, events: [] };
  }

  const prev = cursor.prev;

  if (!cursor.armed || prev === null) {
    if (prev !== null && prev === state) {
      return { cursor, events: [] };
    }
    return { cursor: { prev: state, armed: true }, events: [] };
  }

  if (prev === state) {
    return { cursor, events: [] };
  }

  return {
    cursor: { prev: state, armed: true },
    events: diff(prev, state, selfId),
  };
}
