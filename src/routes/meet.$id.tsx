import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { LoopStrip } from "@/components/loop-strip";
import { Portrait } from "@/components/portrait";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cameraErrorMessage, openCamera } from "@/lib/camera";
import { canListen, startListening } from "@/lib/listen";
import type { LineSession } from "@/lib/crm";
import { personById, useForge } from "@/lib/store";

export const Route = createFileRoute("/meet/$id")({ component: MeetPage });

function MeetPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const people = useForge((s) => s.people);
  const youId = useForge((s) => s.youId);
  const you = personById(people, youId);
  const them = personById(people, id);
  const logLine = useForge((s) => s.logLine);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const stopListen = useRef<(() => void) | null>(null);
  const started = useRef(new Date().toISOString());
  const [notes, setNotes] = useState("");
  const [transcript, setTranscript] = useState("");
  const [done, setDone] = useState<LineSession | null>(null);
  const [camOn, setCamOn] = useState(false);
  const [camErr, setCamErr] = useState<string>();

  useEffect(() => {
    started.current = new Date().toISOString();
    if (canListen()) {
      stopListen.current = startListening((t) => {
        if (t.trim()) setTranscript((p) => (p ? `${p} ${t.trim()}` : t.trim()));
      }, true);
    }
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      stopListen.current?.();
    };
  }, [id]);

  if (!you || !them) {
    return (
      <p className="text-sm text-muted-foreground">
        No card.{" "}
        <Link to="/people" search={{ q: undefined }} className="text-brick hover:underline">
          People
        </Link>
      </p>
    );
  }

  async function startCam() {
    try {
      const stream = await openCamera("video");
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        void videoRef.current.play();
      }
      setCamOn(true);
      setCamErr(undefined);
    } catch (err) {
      setCamErr(cameraErrorMessage(err));
    }
  }

  function end() {
    if (!them) return;
    stopListen.current?.();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    const session = logLine({
      withId: them.id,
      kind: "meet",
      startedAt: started.current,
      transcript: [transcript, notes].filter(Boolean).join(" "),
    });
    toast(session ? "Room closed. Pick a move on the board." : "Room closed.");
    if (session) setDone(session);
    else void navigate({ to: "/p/$id", params: { id: them.id } });
  }

  return (
    <div className="flex flex-col gap-4">
      <header>
        <p className="text-[11px] tracking-wide text-muted-foreground uppercase">ConnectLn room</p>
        <h1 className="font-display text-4xl tracking-wide">Meet {them.name}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Our room. Not a vendor. Camera stays on this hall. Hang up writes the CRM.
        </p>
      </header>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="overflow-hidden rounded-xl bg-ink">
          <video ref={videoRef} className="aspect-video w-full object-cover" muted playsInline />
          <div className="flex items-center justify-between px-3 py-2">
            <p className="text-xs text-cream/70">You · {you.name}</p>
            {!camOn ? (
              <Button type="button" size="sm" variant="cream" onClick={() => void startCam()}>
                Allow camera
              </Button>
            ) : null}
          </div>
          {camErr ? <p className="px-3 pb-2 text-xs text-cream">{camErr}</p> : null}
        </div>
        <div className="relative overflow-hidden rounded-xl bg-ink">
          {them.photo ? (
            <img src={them.photo} alt="" className="aspect-video w-full object-cover object-top" />
          ) : (
            <div className="grid aspect-video place-items-center">
              <Portrait person={them} size="xl" link={false} />
            </div>
          )}
          <p className="absolute bottom-2 left-3 text-xs text-cream">
            {them.name} · {them.trade}
          </p>
        </div>
      </div>
      <Textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={4}
        placeholder="Notes in the room — they go into the summary"
      />
      {transcript ? <p className="text-sm text-muted-foreground">{transcript}</p> : null}
      {done ? (
        <>
          <p className="text-sm">{done.summary}</p>
          <LoopStrip person={them} session={done} />
          <Button variant="ink" asChild>
            <Link to="/p/$id" params={{ id: them.id }}>
              Card
            </Link>
          </Button>
        </>
      ) : (
      <div className="flex flex-wrap gap-2">
        <Button variant="ink" className="bg-brick" onClick={end}>
          End room
        </Button>
        <Button variant="outline" asChild>
          <Link to="/p/$id" params={{ id: them.id }}>
            Card
          </Link>
        </Button>
      </div>
      )}
    </div>
  );
}
