import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronDown, ChevronUp } from "lucide-react";
import { ReelCompose } from "@/components/reel-compose";
import { YoutubeClip } from "@/components/youtube-clip";
import { FilmChrome } from "@/components/film-chrome";
import { Button } from "@/components/ui/button";
import { seedReels } from "@/lib/reel-seed";
import { isLectureReel } from "@/lib/clip-ingest";
import { personById, useForge } from "@/lib/store";
import { talkAudio, talkScript } from "@/lib/talk-scripts";
import { playHallVoice, stopHallVoice } from "@/lib/voice-bus";
import type { Reel } from "@/lib/types";

export const Route = createFileRoute("/reels")({
  validateSearch: (raw: Record<string, unknown>): { id?: string; post?: boolean } => {
    const id = typeof raw.id === "string" ? raw.id : undefined;
    const post = raw.post === "1" || raw.post === true ? true : undefined;
    return { ...(id ? { id } : {}), ...(post ? { post: true } : {}) };
  },
  component: ReelsPage,
});

function ReelsPage() {
  const { id: startId, post } = Route.useSearch();
  const extra = useForge((s) => s.extraReels);
  const catalog = useMemo(
    () => [...extra, ...seedReels].filter((r) => !isLectureReel(r)),
    [extra],
  );
  const start = Math.max(0, catalog.findIndex((r) => r.id === startId));
  const [idx, setIdx] = useState(start >= 0 ? start : 0);
  const [compose, setCompose] = useState(Boolean(post));
  const reel = catalog[idx];

  useEffect(() => {
    if (start >= 0) setIdx(start);
  }, [start]);

  return (
    <div className="flex flex-col gap-4">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl tracking-wide sm:text-4xl">Reels</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Not a story. A plate of the work — recorded, stamped, and on the hall.
          </p>
        </div>
        <Button variant="ink" onClick={() => setCompose((v) => !v)}>
          {compose ? "Close" : "Make a reel"}
        </Button>
      </header>
      {compose ? <ReelCompose onDone={() => setCompose(false)} /> : null}
      {reel ? (
        <ReelPlayer
          reel={reel}
          hasPrev={idx > 0}
          hasNext={idx < catalog.length - 1}
          onPrev={() => setIdx((i) => Math.max(0, i - 1))}
          onNext={() => setIdx((i) => Math.min(catalog.length - 1, i + 1))}
        />
      ) : (
        <p className="py-16 text-center text-sm text-muted-foreground">No reels yet. Post the first one.</p>
      )}
    </div>
  );
}

function ReelPlayer({
  reel,
  hasPrev,
  hasNext,
  onPrev,
  onNext,
}: {
  reel: Reel;
  hasPrev: boolean;
  hasNext: boolean;
  onPrev: () => void;
  onNext: () => void;
}) {
  const people = useForge((s) => s.people);
  const likedReelIds = useForge((s) => s.likedReelIds);
  const toggleReelLike = useForge((s) => s.toggleReelLike);
  const author = personById(people, reel.personId);
  const liked = likedReelIds.includes(reel.id);
  const likesShown = reel.likes + (liked ? 1 : 0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const wantSound = useRef(false);
  const [muted, setMuted] = useState(true);
  const [finished, setFinished] = useState(false);
  const voice = author ? talkAudio(author.id) : "";
  const words = reel.script || (author ? talkScript(author.id) : "");

  function hear() {
    wantSound.current = true;
    setMuted(false);
    setFinished(false);
    const el = videoRef.current;
    if (el) {
      el.volume = 1;
      el.loop = false;
      el.muted = false;
      void el.play().catch(() => undefined);
    }
    const silent = !reel.video && !reel.youtube;
    if (silent && voice) {
      playHallVoice(voice, () => setFinished(true));
    } else if (silent && words && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(new SpeechSynthesisUtterance(words));
    }
  }

  function silence() {
    wantSound.current = false;
    setMuted(true);
    stopHallVoice();
    window.speechSynthesis?.cancel();
    if (videoRef.current) videoRef.current.muted = true;
  }

  function toggleMute() {
    if (muted) hear();
    else silence();
  }

  useEffect(() => {
    setFinished(false);
    const el = videoRef.current;
    if (el) {
      el.volume = 1;
      el.currentTime = 0;
      void el.play().catch(() => undefined);
    }
    if (wantSound.current) hear();
    else {
      setMuted(true);
      if (el) el.muted = true;
      stopHallVoice();
    }
    return () => {
      stopHallVoice();
      window.speechSynthesis?.cancel();
    };
    // hear is bound to this reel
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reel.id]);

  const split = Boolean(words) && !reel.video && !reel.youtube;

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="relative mx-auto w-full max-w-md overflow-hidden bg-black text-white">
        {reel.youtube ? (
          <YoutubeClip
            id={reel.youtube}
            headline={reel.title}
            title={reel.title}
            portrait
            auto
            bare
            social
            showRail={false}
            className="w-full"
            rail={{
              person: author,
              likes: likesShown,
              liked,
              onLike: () => toggleReelLike(reel.id),
              meaning: reel.caption || reel.title,
            }}
          />
        ) : (
          <>
            {reel.video ? (
              <video
                ref={videoRef}
                key={reel.id}
                src={reel.video}
                poster={reel.still}
                className="size-full object-cover bg-black"
                autoPlay
                muted={muted}
                playsInline
                onClick={toggleMute}
                onEnded={() => setFinished(true)}
              />
            ) : split && author ? (
              <button type="button" className="flex size-full" onClick={toggleMute}>
                <img src={author.photo || reel.still} alt="" className="h-full w-[52%] object-cover object-top" />
                <span className="flex h-full w-[48%] flex-col bg-cream p-3 text-left text-ink">
                  <span className="text-xs font-medium">{author.name}</span>
                  <span className="mt-2 text-sm leading-relaxed">{words}</span>
                </span>
              </button>
            ) : (
              <img src={reel.still} alt="" className="size-full object-cover bg-black" />
            )}
            <FilmChrome
              person={author}
              caption={reel.caption || reel.title}
              likes={likesShown}
              liked={liked}
              onLike={() => toggleReelLike(reel.id)}
              clipId={reel.id}
            />
          </>
        )}
        {finished && author && !reel.youtube ? (
          <Link
            to="/p/$id"
            params={{ id: author.id }}
            className="absolute inset-0 z-[3] grid place-items-center bg-black/55"
          >
            <span className="bg-cream px-4 py-2 text-sm font-medium text-ink">
              Open {author.name.split(" ")[0]}'s card
            </span>
          </Link>
        ) : null}
      </div>
      <div className="mt-3 flex items-center justify-between gap-2">
        <button
          type="button"
          disabled={!hasPrev}
          onClick={onPrev}
          className="flex h-11 flex-1 items-center justify-center gap-1 bg-cream text-sm font-medium text-ink shadow-[var(--shadow-border)] disabled:opacity-30"
          aria-label="Previous reel"
        >
          <ChevronUp className="size-4" />
          Previous
        </button>
        <button
          type="button"
          disabled={!hasNext}
          onClick={onNext}
          className="flex h-11 flex-1 items-center justify-center gap-1 bg-ink text-sm font-medium text-cream disabled:opacity-30"
          aria-label="Next reel"
        >
          Next
          <ChevronDown className="size-4" />
        </button>
      </div>
    </div>
  );
}
