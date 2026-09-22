import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { LoopStrip } from "@/components/loop-strip";
import { Portrait } from "@/components/portrait";
import { Button } from "@/components/ui/button";
import type { LineSession } from "@/lib/crm";
import { canListen, startListening } from "@/lib/listen";
import { startMic } from "@/lib/record";
import { personById, useForge } from "@/lib/store";

export function LineStage() {
  const live = useForge((s) => s.liveLine);
  const people = useForge((s) => s.people);
  const closeLine = useForge((s) => s.closeLine);
  const logLine = useForge((s) => s.logLine);
  const person = live ? personById(people, live.personId) : null;
  const [seconds, setSeconds] = useState(0);
  const [transcript, setTranscript] = useState("");
  const [recording, setRecording] = useState(true);
  const [done, setDone] = useState<LineSession | null>(null);
  const started = useRef(new Date().toISOString());
  const stopListen = useRef<(() => void) | null>(null);
  const mic = useRef<Awaited<ReturnType<typeof startMic>>>(null);

  useEffect(() => {
    if (!live || live.kind !== "call") return;
    started.current = new Date().toISOString();
    setSeconds(0);
    setTranscript("");
    setDone(null);
    const tick = window.setInterval(() => setSeconds((n) => n + 1), 1000);
    if (canListen()) {
      stopListen.current = startListening((text) => {
        if (text.trim()) setTranscript((t) => `${t} ${text.trim()}`.trim());
      }, true);
    }
    void startMic().then((m) => {
      mic.current = m;
    });
    setRecording(true);
    return () => {
      window.clearInterval(tick);
      stopListen.current?.();
      stopListen.current = null;
      void mic.current?.stop();
      mic.current = null;
    };
  }, [live?.personId, live?.kind]);

  if (!live || live.kind !== "call" || !person) return null;
  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");

  async function hang() {
    if (!person) return;
    const withId = person.id;
    stopListen.current?.();
    const audio = await mic.current?.stop();
    mic.current = null;
    const session = logLine({
      withId,
      kind: "call",
      startedAt: started.current,
      transcript,
      audio,
    });
    if (session) setDone(session);
    else closeLine();
    toast(session ? "Line closed. Pick a move on the board." : "Line closed.");
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-end bg-ink/70 p-3 sm:place-items-center sm:p-4" style={{ paddingBottom: "max(1rem, var(--hall-safe-b))" }}>
      <div className="w-full max-w-md rounded-2xl bg-ink px-5 py-6 text-cream shadow-[var(--shadow-border)]">
        <p className="text-[11px] tracking-wide text-cream/50 uppercase">ConnectLn line</p>
        <div className="mt-4 flex flex-col items-center gap-3">
          <Portrait person={person} size="xl" link={false} className="ring-4 ring-brick" />
          <p className="font-display text-3xl tracking-wide">{person.name}</p>
          <p className="text-sm text-cream/70">
            {person.trade} · {person.city}
          </p>
          <p className="font-display text-4xl tabular-nums tracking-wide">
            {mm}:{ss}
          </p>
          <p className="text-xs text-cream/55">
            Recording the line. Transcribing when the hall can hear you.
          </p>
        </div>
        {done ? (
          <>
            <p className="mt-4 text-sm text-cream/80">{done.summary}</p>
            <LoopStrip person={person} session={done} />
            <div className="mt-4 flex justify-center">
              <Button variant="cream" onClick={closeLine}>
                Done
              </Button>
            </div>
          </>
        ) : (
          <>
        {transcript ? (
          <p className="mt-4 max-h-24 overflow-auto text-sm text-cream/80">{transcript}</p>
        ) : null}
        <div className="mt-6 flex justify-center gap-2">
          <Button
            variant="cream"
            onClick={() => {
              if (recording) {
                stopListen.current?.();
                stopListen.current = null;
                setRecording(false);
              } else if (canListen()) {
                stopListen.current = startListening((text) => {
                  if (text.trim()) setTranscript((t) => `${t} ${text.trim()}`.trim());
                }, true);
                setRecording(true);
              }
            }}
          >
            {recording ? "Pause transcript" : "Resume transcript"}
          </Button>
          <Button variant="ink" className="bg-brick" onClick={() => void hang()}>
            Hang up
          </Button>
          <Button variant="ghost" className="text-cream" onClick={closeLine}>
            Cancel
          </Button>
        </div>
          </>
        )}
      </div>
    </div>
  );
}
