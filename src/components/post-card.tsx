import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Heart, MessageCircle, Quote, Repeat2, Bookmark, Volume2, VolumeX } from "lucide-react";
import { LineCompose } from "@/components/line-compose";
import { ExampleMark } from "@/components/example-mark";
import { ReportControl } from "@/components/report-control";
import { Portrait } from "@/components/portrait";
import { YoutubeClip } from "@/components/youtube-clip";
import { WorkFrame, workSerial } from "@/components/work-frame";
import { QuietBound } from "@/lib/error-component";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { personById, useForge } from "@/lib/store";
import { relTime, rolePlate } from "@/lib/format";
import { isExample } from "@/lib/example";
import { onHallSilence } from "@/lib/voice-bus";
import { playNextHallClip, registerHallClip } from "@/lib/clip-focus";
import { cn } from "@/lib/utils";
import type { Post } from "@/lib/types";

const KIND: Record<Post["kind"], string> = {
  talk: "Shop talk",
  call: "Looking",
  safety: "Safety",
  work: "On the tools",
  ask: "Ask",
  brief: "Brief",
};

function shopLines(headline?: string, body?: string) {
  const a = (headline ?? "").replace(/\s+/g, " ").trim();
  const b = (body ?? "").replace(/\s+/g, " ").trim();
  const key = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  if (a && b && key(a) === key(b)) return { line: b || a };
  if (a && b) return { kicker: a, line: b };
  return { line: b || a || undefined };
}

export function PostCard({ post }: { post: Post }) {
  const people = useForge((s) => s.people);
  const likedPostIds = useForge((s) => s.likedPostIds);
  const boostedPostIds = useForge((s) => s.boostedPostIds);
  const savedPostIds = useForge((s) => s.savedPostIds);
  const toggleLike = useForge((s) => s.toggleLike);
  const boostPost = useForge((s) => s.boostPost);
  const toggleSavePost = useForge((s) => s.toggleSavePost);
  const addComment = useForge((s) => s.addComment);
  const author = personById(people, post.authorId);
  const [draft, setDraft] = useState("");
  const [open, setOpen] = useState(false);
  const [quote, setQuote] = useState(false);
  if (!author) return null;
  const liked = likedPostIds.includes(post.id);
  const boosted = boostedPostIds.includes(post.id);
  const saved = savedPostIds.includes(post.id);
  const copy = shopLines(post.headline, post.body);

  return (
    <article id={post.id} className="overflow-hidden rounded-xl bg-cream shadow-[var(--shadow-border)]" data-feed-post="1">
      <header className="flex items-start gap-3 px-4 pt-4">
        <Portrait person={author} />
        <div className="min-w-0 flex-1">
          <Link
            to="/p/$id"
            params={{ id: author.id }}
            className="font-medium hover:underline"
          >
            {author.name}
          </Link>
          {isExample(author) ? <ExampleMark className="ml-1.5 align-middle" /> : null}
          <p className="text-[11px] font-medium tracking-[0.12em] text-muted-foreground">
            {rolePlate(author)}
          </p>
          <p className="text-xs text-muted-foreground">
            {post.youtube || post.video ? "Posted this work · " : ""}
            {author.city}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <Badge variant={post.kind === "safety" ? "warn" : post.kind === "call" ? "brick" : "muted"}>
            {KIND[post.kind]}
          </Badge>
          <time className="text-[11px] text-muted-foreground" dateTime={post.createdAt}>
            {relTime(post.createdAt)}
          </time>
        </div>
      </header>
      {post.youtube ? (
        <div className="mt-3 px-3">
          <QuietBound>
            <WorkFrame serial={workSerial(post.id)} stamp="Expedite Consults LLC">
              <YoutubeClip id={post.youtube} title={post.headline || post.body} bare />
            </WorkFrame>
          </QuietBound>
        </div>
      ) : null}
      {copy.kicker ? (
        <p className="px-4 pt-3 text-xs font-medium uppercase tracking-wide text-ink">{copy.kicker}</p>
      ) : null}
      {copy.line ? (
        <p className={cn("px-4 pb-3 text-[15px] leading-relaxed", copy.kicker ? "pt-1" : "pt-3")}>{copy.line}</p>
      ) : null}
      {!post.youtube && post.video ? (
        <FeedVideo src={post.video} poster={post.photo} personId={author.id} />
      ) : !post.youtube && post.photo ? (
        <div className="px-3 pb-3">
          <WorkFrame serial={workSerial(post.id)} stamp="Still" wellClassName="aspect-auto">
            <img
              src={post.photo}
              alt=""
              className="max-h-[min(70vh,36rem)] w-full bg-ink object-contain"
              crossOrigin="anonymous"
            />
          </WorkFrame>
        </div>
      ) : null}
      {post.sitTo ? (
        <div className="px-4 pb-3">
          <Link
            to="/learn"
            className="flex h-11 items-center justify-center rounded-full bg-brick text-sm font-medium text-cream"
          >
            Sit this
          </Link>
        </div>
      ) : null}
      <div className="flex items-center gap-1 px-2 py-1.5">
        <button
          type="button"
          onClick={() => toggleLike(post.id)}
          className={cn(
            "flex h-11 items-center gap-1.5 rounded-md px-3 text-sm transition-colors duration-150",
            liked ? "text-brick" : "text-muted-foreground hover:text-ink",
          )}
        >
          <Heart className={cn("size-4", liked && "fill-brick")} strokeWidth={1.75} />
          <span className="tabular-nums">{post.likes}</span>
        </button>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex h-11 items-center gap-1.5 rounded-md px-3 text-sm text-muted-foreground hover:text-ink"
        >
          <MessageCircle className="size-4" strokeWidth={1.75} />
          <span className="tabular-nums">{post.comments.length}</span>
        </button>
        <button
          type="button"
          onClick={() => boostPost(post.id)}
          className={cn(
            "flex h-11 items-center gap-1.5 rounded-md px-3 text-sm",
            boosted ? "text-ok" : "text-muted-foreground hover:text-ink",
          )}
        >
          <Repeat2 className="size-4" strokeWidth={1.75} />
          <span className="tabular-nums">{post.boosts ?? 0}</span>
        </button>
        <button
          type="button"
          onClick={() => setQuote(true)}
          className="flex h-11 items-center gap-1.5 rounded-md px-3 text-sm text-muted-foreground hover:text-ink"
        >
          <Quote className="size-4" strokeWidth={1.75} />
        </button>
        <button
          type="button"
          onClick={() => toggleSavePost(post.id)}
          className={cn(
            "flex h-11 items-center rounded-md px-3 text-sm",
            saved ? "text-ink" : "text-muted-foreground hover:text-ink",
          )}
          aria-label={saved ? "Unsave" : "Save"}
        >
          <Bookmark className={cn("size-4", saved && "fill-ink")} strokeWidth={1.75} />
        </button>
        <ReportControl kind="line" targetId={post.id} target={post.body.slice(0, 80)} />
      </div>
      <LineCompose open={quote} onOpenChange={setQuote} quote={post} />
      {(open || post.comments.length > 0) && (
        <div className="border-t border-border px-4 py-3">
          <ul className="flex flex-col gap-2.5">
            {post.comments.map((c) => {
              const who = personById(people, c.authorId);
              if (!who) return null;
              return (
                <li key={c.id} className="flex gap-2.5">
                  <Portrait person={who} size="sm" />
                  <div className="min-w-0 rounded-lg bg-canvas px-3 py-2">
                    <Link
                      to="/p/$id"
                      params={{ id: who.id }}
                      className="text-xs font-medium"
                    >
                      {who.name}
                    </Link>
                    <p className="text-sm leading-snug">{c.body}</p>
                  </div>
                </li>
              );
            })}
          </ul>
          <form
            className="mt-3 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              addComment(post.id, draft);
              setDraft("");
              setOpen(true);
            }}
          >
            <Input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Add a note"
              className="h-10 bg-canvas"
            />
            <Button type="submit" size="sm" disabled={!draft.trim()}>
              Reply
            </Button>
          </form>
        </div>
      )}
    </article>
  );
}

function FeedVideo({
  src,
  poster,
  personId,
}: {
  src: string;
  poster?: string;
  personId: string;
}) {
  const box = useRef<HTMLDivElement>(null);
  const ref = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);
  const want = useRef(false);

  function hush() {
    want.current = false;
    setMuted(true);
    const el = ref.current;
    if (!el) return;
    el.muted = true;
    el.pause();
  }

  function hear() {
    want.current = true;
    setMuted(false);
    const el = ref.current;
    if (el) {
      el.muted = false;
      el.volume = 1;
      void el.play().catch(() => undefined);
    }
  }

  useEffect(() => {
    const root = box.current;
    const el = ref.current;
    if (!root || !el) return;
    const off = registerHallClip(root, {
      play: () => {
        el.muted = !want.current;
        el.playsInline = true;
        void el.play().catch(() => undefined);
      },
      pause: () => {
        el.pause();
        el.currentTime = 0;
      },
    });
    const offHall = onHallSilence(() => {
      if (!want.current) return;
      hush();
    });
    return () => {
      off();
      offHall();
    };
  }, [src, personId]);

  return (
    <div ref={box} data-hall-clip="1" className="px-3 pb-3">
      <WorkFrame serial={workSerial(personId)} stamp="Expedite Consults LLC" wellClassName="aspect-auto">
        <div className="relative bg-ink">
          <video
            ref={ref}
            src={src}
            poster={poster}
            className="max-h-[min(70vh,36rem)] w-full bg-ink object-contain"
            muted
            playsInline
            preload="metadata"
            onEnded={() => playNextHallClip(box.current)}
            onClick={() => (muted ? hear() : hush())}
          />
          <button
            type="button"
            onClick={() => (muted ? hear() : hush())}
            className="absolute right-3 bottom-3 grid size-11 place-items-center rounded-sm bg-ink/75 text-cream"
            aria-label={muted ? "Hear this" : "Quiet"}
          >
            {muted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
          </button>
        </div>
      </WorkFrame>
    </div>
  );
}
