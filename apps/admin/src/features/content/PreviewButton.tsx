import { Button } from "@zeyn/ui/components/button";
import { Pause, Play } from "lucide-react";
import { useEffect, useRef, useState } from "react";

let currentAudio: HTMLAudioElement | null = null;
const listeners = new Set<() => void>();

function setCurrent(audio: HTMLAudioElement | null) {
  currentAudio = audio;
  for (const listener of listeners) listener();
}

export function PreviewButton({ url }: { url: string }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const sync = () => setPlaying(currentAudio === audioRef.current);
    listeners.add(sync);
    return () => {
      listeners.delete(sync);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (audioRef.current && currentAudio === audioRef.current) {
        audioRef.current.pause();
        setCurrent(null);
      }
    };
  }, []);

  const toggle = () => {
    if (!audioRef.current) {
      audioRef.current = new Audio(url);
      audioRef.current.addEventListener("ended", () => setCurrent(null));
    }

    if (currentAudio === audioRef.current) {
      audioRef.current.pause();
      setCurrent(null);
      return;
    }

    if (currentAudio) currentAudio.pause();
    void audioRef.current.play().catch(() => setCurrent(null));
    setCurrent(audioRef.current);
  };

  return (
    <Button variant='outline' size='icon-xs' onClick={toggle}>
      {playing ? <Pause /> : <Play />}
      <span className='sr-only'>{playing ? "Pause" : "Play"} preview</span>
    </Button>
  );
}
