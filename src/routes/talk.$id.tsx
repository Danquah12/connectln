import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Pause, Play, SkipBack, SkipForward } from "lucide-react";
import { Portrait } from "@/components/portrait";
import { Button } from "@/components/ui/button";
import { formatTalkTime, lectureById, seedLectures } from "@/lib/lecture-seed";
import { personById, useForge } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/talk/$id")({ component: TalkPage });

function TalkPage() {
  const { id } = Route.useParams();
  const people = useForge((s) => s.people);
  const talk = lectureById(id) ?? seedLectures[0];
  const who = personById(people, talk.personId);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const elapsedRef = useRef(0);

  const chapter = useMemo(() => {
    let cur = talk.chapters[0];
    for (const c of talk.chapters) if (c.t <= elapsed) cur = c;
    return cur;
  }, [talk, elapsed]);
  const chapterIdx = talk.chapters.indexOf(chapter);

  useEffect(() => {
    if (!playing) {
      window.speechSynthesis?.cancel();
      return;
    }
    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      elapsedRef.current = Math.min(talk.duration, elapsedRef.current + dt);
      setElapsed(elapsedRef.current);
      if (elapsedRef.current >= talk.duration) {
        setPlaying(false);
        return;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [playing, talk.duration]);

  useEffect(() => {
    if (!playing) return;
    const synth = window.speechSynthesis;
    if (!synth) return;
    synth.cancel();
    const u = new SpeechSynthesisUtterance(`${chapter.title}. ${chapter.body}`);
    u.rate = 0.95;
    synth.speak(u);
    return () => synth.cancel();
  }, [playing, chapter.title, chapter.body]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (playing) void v.play().catch(() => undefined);
    else v.pause();
  }, [playing]);

  function seek(t: number) {
    elapsedRef.current = Math.max(0, Math.min(talk.duration, t));
    setElapsed(elapsedRef.current);
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs text-muted-foreground">
        <Link to="/present" className="hover:underline">
          Presentations
        </Link>
        {" · "}
        5:00 talk · complete person in frame
      </p>
      <div className="overflow-hidden rounded-xl bg-ink text-cream shadow-[var(--shadow-border)]">
        <div className="relative bg-ink">
          <video
            ref={videoRef}
            src={talk.video}
            poster={talk.still}
            className="mx-auto max-h-[min(70vh,36rem)] w-full object-contain"
            loop
            muted
            playsInline
          />
        </div>
        <div className="p-4">
          <div className="flex items-start gap-3">
            {who ? <Portrait person={who} link={false} /> : null}
            <div className="min-w-0">
              <h1 className="font-display text-3xl tracking-wide">{talk.title}</h1>
              <p className="text-sm text-cream/70">
                {who?.name} · {who?.trade} · {formatTalkTime(talk.duration)}
              </p>
            </div>
          </div>
          <p className="mt-4 font-display text-xl tracking-wide">{chapter.title}</p>
          <p className="mt-2 text-sm leading-relaxed text-cream/85">{chapter.body}</p>
          <div className="mt-4">
            <input
              type="range"
              min={0}
              max={talk.duration}
              value={elapsed}
              onChange={(e) => seek(Number(e.target.value))}
              className="w-full accent-brick"
              aria-label="Talk position"
            />
            <div className="mt-1 flex justify-between text-[11px] tabular-nums text-cream/55">
              <span>{formatTalkTime(elapsed)}</span>
              <span>{formatTalkTime(talk.duration)}</span>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-center gap-2">
            <Button
              variant="outline"
              className="border-cream/20 bg-transparent text-cream"
              onClick={() => seek(elapsed - 15)}
            >
              <SkipBack className="size-4" />
              15s
            </Button>
            <Button variant="cream" onClick={() => setPlaying((p) => !p)}>
              {playing ? <Pause className="size-4" /> : <Play className="size-4" />}
              {playing ? "Pause" : "Play talk"}
            </Button>
            <Button
              variant="outline"
              className="border-cream/20 bg-transparent text-cream"
              onClick={() => seek(elapsed + 15)}
            >
              15s
              <SkipForward className="size-4" />
            </Button>
          </div>
        </div>
      </div>
      <ol className="flex flex-col gap-1">
        {talk.chapters.map((c, i) => (
          <li key={c.t}>
            <button
              type="button"
              onClick={() => {
                seek(c.t);
                setPlaying(true);
              }}
              className={cn(
                "flex w-full items-start gap-3 rounded-xl bg-cream px-4 py-3 text-left shadow-[var(--shadow-border)]",
                i === chapterIdx && "ring-1 ring-brick",
              )}
            >
              <span className="font-mono text-xs text-muted-foreground tabular-nums">
                {formatTalkTime(c.t)}
              </span>
              <span>
                <span className="block text-sm font-medium">{c.title}</span>
                <span className="block text-xs text-muted-foreground">
                  {c.body.slice(0, 90)}…
                </span>
              </span>
            </button>
          </li>
        ))}
      </ol>
    </div>
  );
}
