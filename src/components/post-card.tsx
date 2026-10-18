import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Heart, MessageCircle, Quote, Repeat2, Bookmark } from "lucide-react";
import { LineCompose } from "@/components/line-compose";
import { ExampleMark } from "@/components/example-mark";
import { ReportControl } from "@/components/report-control";
import { Portrait } from "@/components/portrait";
import { YoutubeClip } from "@/components/youtube-clip";
import { ClipRail } from "@/components/clip-rail";
import { FilmNotes } from "@/components/film-notes";
import { YoutubeMasks } from "@/components/youtube-stage";
import { WorkFrame, workSerial } from "@/components/work-frame";
import { QuietBound } from "@/lib/error-component";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { personById, useForge } from "@/lib/store";
import { relTime, rolePlate } from "@/lib/format";
import { isExample } from "@/lib/example";
import { onHallSilence } from "@/lib/voice-bus";
import { playNextHallClip, registerHallClip, bringHallClipToTop } from "@/lib/clip-focus";
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
    <article id={post.id} className="overflow-hidden rounded-2xl bg-white shadow-[0_1px_2px_rgba(26,24,20,0.04),0_0_0_1px_rgba(26,24,20,0.06)]" data-feed-post="1">
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
      {(post.youtube || post.video) ? (
        <div className="mt-3 grid items-start gap-3 px-2 sm:px-3 lg:grid-cols-[minmax(0,1.35fr)_minmax(16rem,20rem)]">
          <div className="min-w-0">
            {post.youtube ? (
              <QuietBound>
                <WorkFrame serial={workSerial(post.id)} stamp="Expedite Consults LLC" wellClassName="aspect-[4/5]">
                  <YoutubeClip
                    id={post.youtube}
                    title={post.headline || post.body}
                    bare
                    rail={{
                      person: author,
                      likes: post.likes,
                      comments: post.comments.length,
                      reposts: post.boosts ?? 0,
                      liked,
                      onLike: () => toggleLike(post.id),
                      onComment: () => setOpen(true),
                      onWrite: (body) => addComment(post.id, body),
                      onRepost: () => boostPost(post.id),
                      meaning: post.body || post.headline,
                    }}
                  />
                </WorkFrame>
              </QuietBound>
            ) : (
              <FeedVideo
                src={post.video!}
                poster={post.photo}
                personId={author.id}
                person={author}
                likes={post.likes}
                comments={post.comments.length}
                reposts={post.boosts ?? 0}
                liked={liked}
                onLike={() => toggleLike(post.id)}
                onComment={() => setOpen(true)}
                onWrite={(body) => addComment(post.id, body)}
                onRepost={() => boostPost(post.id)}
                meaning={post.body || post.headline}
              />
            )}
          </div>
          <FilmNotes
            text={post.body || post.headline}
            title={post.headline}
            speaker={author.name}
            trade={author.trade}
          />
        </div>
      ) : null}
      {copy.kicker ? (
        <p className="px-4 pt-3 text-xs font-medium uppercase tracking-wide text-ink">{copy.kicker}</p>
      ) : null}
      {copy.line ? (
        <p className={cn("px-4 pb-3 text-[15px] leading-relaxed", copy.kicker ? "pt-1" : "pt-3")}>{copy.line}</p>
      ) : null}
      {!post.youtube && post.video ? null : !post.youtube && post.photo ? (
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
      {post.youtube || post.video ? null : (
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
      )}
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
  person,
  likes,
  comments,
  reposts,
  liked,
  onLike,
  onComment,
  onWrite,
  onRepost,
  meaning,
}: {
  src: string;
  poster?: string;
  personId: string;
  person?: import("@/lib/types").Person;
  likes?: number;
  comments?: number;
  reposts?: number;
  liked?: boolean;
  onLike?: () => void;
  onComment?: () => void;
  onWrite?: (body: string) => void;
  onRepost?: () => void;
  meaning?: string;
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
      <WorkFrame serial={workSerial(personId)} stamp="Expedite Consults LLC" wellClassName="aspect-[4/5]">
        <div className="relative size-full bg-ink">
          <video
            ref={ref}
            src={src}
            poster={poster}
            className="size-full bg-ink object-cover object-[center_18%]"
            muted
            playsInline
            preload="metadata"
            onClick={() => {
              bringHallClipToTop(box.current);
              if (muted) hear();
              else hush();
            }}
            onEnded={() => playNextHallClip(box.current)}
          />
          <YoutubeMasks />
        </div>
      </WorkFrame>
      <ClipRail
        person={person}
        likes={likes}
        comments={comments}
        reposts={reposts}
        liked={liked}
        onLike={onLike}
        onComment={onComment}
        onWrite={onWrite}
        onRepost={onRepost}
        meaning={meaning}
        clipId={personId}
      />
    </div>
  );
}
