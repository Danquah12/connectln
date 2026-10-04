import { useEffect, useRef, useState, type Ref } from "react";
import { cn } from "@/lib/utils";
import { Mark } from "@/components/mark";
import { FilmChrome } from "@/components/film-chrome";
import { seedReels } from "@/lib/reel-seed";
import { personById, useForge } from "@/lib/store";
import { youtubeCommand, youtubeEmbed, youtubeHideCaptions, youtubeListen, youtubeSeek, youtubeThumb } from "@/lib/youtube";

/** Poster + embed. Crop is light so the picture stays visible. */
export function YoutubeStage({
  id,
  title = "Work",
  autoplay,
  mute = true,
  start,
  still,
  className,
  frameRef,
  onLoad,
  chrome = false,
  large = false,
}: {
  id: string;
  title?: string;
  autoplay?: boolean;
  mute?: boolean;
  start?: number;
  still?: string;
  className?: string;
  frameRef?: Ref<HTMLIFrameElement>;
  onLoad?: () => void;
  chrome?: boolean;
  large?: boolean;
}) {
  const posts = useForge((s) => s.posts);
  const extraReels = useForge((s) => s.extraReels);
  const people = useForge((s) => s.people);
  const likedIds = useForge((s) => s.likedPostIds);
  const toggleLike = useForge((s) => s.toggleLike);
  const addComment = useForge((s) => s.addComment);
  const boostPost = useForge((s) => s.boostPost);
  const post = posts.find((p) => p.youtube === id);
  const reel = [...extraReels, ...seedReels].find((r) => r.youtube === id);
  const person = personById(people, post?.authorId || reel?.personId || "");
  const inner = useRef<HTMLIFrameElement | null>(null);
  const [ended, setEnded] = useState(false);
  const poster = still || youtubeThumb(id);

  function bind(el: HTMLIFrameElement | null) {
    inner.current = el;
    if (typeof frameRef === "function") frameRef(el);
    else if (frameRef && "current" in frameRef) (frameRef as { current: HTMLIFrameElement | null }).current = el;
  }

  function boot() {
    const f = inner.current;
    if (!f) return;
    youtubeListen(f);
    youtubeHideCaptions(f);
    youtubeCommand(f, "addEventListener", ["onStateChange"]);
    youtubeCommand(f, "playVideo");
    if (mute) youtubeCommand(f, "mute");
    else youtubeCommand(f, "unMute");
    if (start && start >= 1) youtubeSeek(f, start);
    onLoad?.();
  }

  useEffect(() => {
    setEnded(false);
  }, [id]);

  useEffect(() => {
    function onMsg(e: MessageEvent) {
      const frame = inner.current;
      if (!frame || e.source !== frame.contentWindow) return;
      let data: { event?: string; info?: number } = {};
      if (typeof e.data === "string") {
        try {
          data = JSON.parse(e.data) as typeof data;
        } catch {
          return;
        }
      } else if (e.data && typeof e.data === "object") {
        data = e.data as typeof data;
      }
      if (data.event === "onStateChange" && data.info === 0) setEnded(true);
      if (data.event === "onStateChange" && data.info === 1) setEnded(false);
    }
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, [id]);

  useEffect(() => {
    const t = window.setTimeout(boot, 240);
    const u = window.setTimeout(boot, 900);
    return () => {
      window.clearTimeout(t);
      window.clearTimeout(u);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, mute, start]);

  return (
    <div className={cn("absolute inset-0 overflow-hidden bg-ink", className)}>
      <img src={poster} alt="" className="absolute inset-0 z-0 size-full object-contain object-center" />
      <iframe
        ref={bind}
        src={youtubeEmbed(id, { autoplay: autoplay ?? true, mute: true, start, controls: false })}
        title={filmTitle(title)}
        className={cn(large ? "clip-fill-frame" : "clip-crop-frame", ended && "invisible")}
        allow="autoplay; encrypted-media"
        tabIndex={-1}
        onLoad={boot}
      />
      {chrome ? (
        <FilmChrome
          person={person}
          caption={post?.body || post?.headline || reel?.caption || title}
          likes={post?.likes ?? reel?.likes}
          comments={post?.comments.length}
          liked={post ? likedIds.includes(post.id) : undefined}
          onLike={post ? () => toggleLike(post.id) : undefined}
          onWrite={post ? (body) => addComment(post.id, body) : undefined}
          onRepost={post ? () => boostPost(post.id) : undefined}
          clipId={id}
        />
      ) : (
        <YoutubeMasks />
      )}
    </div>
  );
}

export function filmTitle(title?: string) {
  const clean = (title ?? "").replace(/\byoutube\b/gi, "").replace(/\s{2,}/g, " ").trim();
  if (!clean || /^[A-Za-z0-9_-]{11}$/.test(clean)) return "ConnectLn";
  return clean;
}

export function YoutubeMasks() {
  return (
    <>
      <span className="pointer-events-none absolute top-2 right-2 z-[5] flex items-center gap-1.5 rounded-sm bg-ink/75 py-1 pr-2 pl-1 text-cream">
        <Mark className="size-5" />
        <span className="font-display text-lg leading-none tracking-[0.06em]">ConnectLn</span>
      </span>
    </>
  );
}
