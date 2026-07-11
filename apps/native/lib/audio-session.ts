import { setAudioModeAsync } from "expo-audio";

let configured = false;

export function ensureAudioSession() {
  if (configured) return;
  configured = true;

  setAudioModeAsync({
    playsInSilentMode: true,
    interruptionMode: "mixWithOthers",
    shouldPlayInBackground: false,
    allowsRecording: false,
  }).catch(() => {});
}
