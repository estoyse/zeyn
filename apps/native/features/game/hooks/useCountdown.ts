import { useEffect } from "react";
import {
  useFrameCallback,
  useSharedValue,
  type SharedValue,
} from "react-native-reanimated";

export const URGENCY_WINDOW_MS = 5000;

export type Countdown = {
  progress: SharedValue<number>;
  remainingMs: SharedValue<number>;
  urgency: SharedValue<number>;
};

function remainingFor(expiresAt: number) {
  return Math.max(0, expiresAt - Date.now());
}

export function useCountdown(
  expiresAt: number,
  duration: number,
  active = true
): Countdown {
  const expiry = useSharedValue(expiresAt);
  const total = useSharedValue(duration);

  const initialRemaining = remainingFor(expiresAt);
  const remainingMs = useSharedValue(initialRemaining);
  const progress = useSharedValue(
    duration > 0 ? Math.min(1, initialRemaining / duration) : 0
  );
  const urgency = useSharedValue(
    1 - Math.min(1, initialRemaining / URGENCY_WINDOW_MS)
  );

  useEffect(() => {
    expiry.value = expiresAt;
    total.value = duration;
  }, [expiresAt, duration, expiry, total]);

  const frame = useFrameCallback(() => {
    "worklet";
    const left = Math.max(0, expiry.value - Date.now());
    remainingMs.value = left;
    progress.value = total.value > 0 ? Math.min(1, left / total.value) : 0;
    urgency.value = 1 - Math.min(1, left / URGENCY_WINDOW_MS);
  }, false);

  useEffect(() => {
    frame.setActive(active);
    return () => frame.setActive(false);
  }, [active, frame]);

  return { progress, remainingMs, urgency };
}
