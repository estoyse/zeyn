import { useCallback, useEffect, useRef } from "react";

import { useGameFx } from "@/features/game/components/GameFxProvider";
import {
  advanceEventStream,
  initialCursor,
  type EventCursor,
  type GameEvent,
  type GameEventDiff,
} from "@/features/game/lib/gameEvents";
import { haptic } from "@/lib/haptics";
import { play } from "@/lib/sfx";

export function useGameEventStream<S>(
  state: S | null,
  isConnected: boolean,
  selfId: string,
  diff: GameEventDiff<S>,
  onEvent: (event: GameEvent) => void
) {
  const cursorRef = useRef<EventCursor<S>>(initialCursor<S>());
  const diffRef = useRef(diff);
  const onEventRef = useRef(onEvent);

  useEffect(() => {
    diffRef.current = diff;
    onEventRef.current = onEvent;
  });

  useEffect(() => {
    const step = advanceEventStream(
      cursorRef.current,
      { state, isConnected, selfId },
      diffRef.current
    );
    cursorRef.current = step.cursor;
    for (const event of step.events) onEventRef.current(event);
  }, [state, isConnected, selfId]);
}

export function useGameFeedback(): (event: GameEvent) => void {
  const { flash, shake, burst, points } = useGameFx();

  return useCallback(
    (event: GameEvent) => {
      switch (event.type) {
        case "gameStart":
          haptic("impact");
          play("countdownGo");
          return;

        case "questionStart":
          haptic("select");
          play("questionStart");
          return;

        case "buzz":
          if (event.isSelf) return;
          haptic("tap");
          play("buzz");
          return;

        case "lockIn":
          if (!event.isSelf) return;
          haptic("tap");
          play("tick");
          return;

        case "answer":
          if (!event.isSelf) return;
          points(event.points);
          if (event.correct) {
            haptic("success");
            flash("success");
            burst("success");
            play("correct");
          } else {
            haptic("error");
            flash("danger");
            shake();
            play("wrong");
          }
          return;

        case "reveal":
          if (event.selfScored) return;
          if (event.solved) {
            flash("neutral");
          }
          return;

        case "gameEnd":
          haptic("success");
          play("win");
          return;
      }
    },
    [flash, shake, burst, points]
  );
}
