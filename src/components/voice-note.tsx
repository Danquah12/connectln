import { useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { canListen, startListening } from "@/lib/listen";
import { startMic } from "@/lib/record";
import { useForge } from "@/lib/store";
import type { Person } from "@/lib/types";

export function VoiceNote({ person }: { person: Person }) {
  const logLine = useForge((s) => s.logLine);
  const [on, setOn] = useState(false);
  const [text, setText] = useState("");
  const stopListen = useRef<(() => void) | null>(null);
  const mic = useRef<Awaited<ReturnType<typeof startMic>>>(null);
  const started = useRef(new Date().toISOString());

  async function begin() {
    started.current = new Date().toISOString();
    setText("");
    setOn(true);
    mic.current = await startMic();
    if (canListen()) {
      stopListen.current = startListening((t) => {
        if (t.trim()) setText((prev) => (prev ? `${prev} ${t.trim()}` : t.trim()));
      }, true);
    }
  }

  async function end() {
    stopListen.current?.();
    stopListen.current = null;
    const audio = await mic.current?.stop();
    mic.current = null;
    setOn(false);
    const session = logLine({
      withId: person.id,
      kind: "voice",
      startedAt: started.current,
      transcript: text,
      audio,
    });
    toast(session ? "Voice recorded and transcribed. On the card." : "Voice note saved.");
  }

  return (
    <Button size="sm" variant="outline" onClick={() => void (on ? end() : begin())}>
      {on ? "Stop · transcribe" : "Voice note"}
    </Button>
  );
}
