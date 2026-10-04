import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Portrait } from "@/components/portrait";
import { YoutubeMasks, filmTitle } from "@/components/youtube-stage";
import { pinHallClip, registerHallClip } from "@/lib/clip-focus";
import { relatedItems, type RelatedItem } from "@/lib/related";
import { personById, useForge } from "@/lib/store";
import { youtubeCommand, youtubeEmbed, youtubeThumb } from "@/lib/youtube";
import { cn } from "@/lib/utils";
import type { Person } from "@/lib/types";

function RelatedPlayer({ id, title, onClose }: { id: string; title: string; onClose: () => void }) {
  const frame = useRef<HTMLIFrameElement>(null);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    function boot() {
      const iframe = frame.current;
      if (!iframe?.contentWindow) return;
      iframe.contentWindow.postMessage(JSON.stringify({ event: "listening", id: "1" }), "*");
      youtubeCommand(iframe, "addEventListener", ["onStateChange"]);
      youtubeCommand(iframe, "playVideo");
      youtubeCommand(iframe, "unMute");
    }
    const off = registerHallClip(el, {
      play: () => window.setTimeout(boot, 60),
      pause: () => youtubeCommand(frame.current, "pauseVideo"),
    });
    pinHallClip(el, 900);
    el.scrollIntoView({ behavior: "smooth", block: "nearest" });
    return off;
  }, [id]);

  return (
    <div className="px-3 pb-3">
      <div ref={root} data-hall-clip="1" className="relative aspect-video overflow-hidden bg-ink">
        <iframe
          ref={frame}
          src={youtubeEmbed(id, { autoplay: true, mute: false })}
          title={filmTitle(title)}
          className="clip-crop-frame"
          allow="autoplay; encrypted-media"
          onLoad={() => {
            youtubeCommand(frame.current, "playVideo");
            youtubeCommand(frame.current, "unMute");
          }}
        />
        <YoutubeMasks />
      </div>
      <button type="button" className="mt-2 h-9 text-xs text-cream/70" onClick={onClose}>
        Close
      </button>
    </div>
  );
}

function CardFace({ item, people }: { item: RelatedItem; people: Person[] }) {
  const person = item.personId ? personById(people, item.personId) : undefined;
  if (item.youtube) {
    return (
      <span className="relative block aspect-video overflow-hidden bg-ink">
        <img src={youtubeThumb(item.youtube)} alt="" className="size-full object-cover" />
      </span>
    );
  }
  if (person) {
    return (
      <span className="flex aspect-video items-center gap-2 bg-cream/10 p-2">
        <Portrait person={person} size="sm" link={false} presence={false} />
        <span className="line-clamp-3 text-xs leading-snug text-cream">{item.line}</span>
      </span>
    );
  }
  return (
    <span className="flex aspect-video items-end bg-cream/10 p-2">
      <span className="line-clamp-4 text-xs leading-snug text-cream">{item.line}</span>
    </span>
  );
}

function CardCopy({ item }: { item: RelatedItem }) {
  return (
    <>
      <span className="text-xs tracking-wide text-cream/70 uppercase">{item.kind}</span>
      <span className="text-pretty text-sm leading-snug break-words text-cream">{item.title}</span>
      {item.youtube ? <span className="text-pretty text-sm leading-snug break-words text-cream/80">{item.line}</span> : null}
    </>
  );
}

export function RelatedStrip({
  meaning,
  clipId,
  speakerId,
}: {
  meaning?: string;
  clipId?: string;
  speakerId?: string;
}) {
  const people = useForge((s) => s.people);
  const posts = useForge((s) => s.posts);
  const vouches = useForge((s) => s.vouches);
  const youId = useForge((s) => s.youId);
  const you = personById(people, youId);
  const items = useMemo(
    () =>
      relatedItems({
        clipId,
        meaning,
        youTrade: you?.trade,
        youId,
        speakerId,
        people,
        posts,
        vouches,
      }),
    [clipId, meaning, you?.trade, youId, speakerId, people, posts, vouches],
  );
  const [open, setOpen] = useState<string | null>(null);
  const playing = items.find((item) => item.youtube === open);

  useEffect(() => {
    if (open && !items.some((item) => item.youtube === open)) setOpen(null);
  }, [open, items]);

  return (
    <section className="min-w-0 max-w-full" aria-label="Related">
      <p className="px-3 pt-1 text-xs tracking-wide text-cream/50 uppercase">Related</p>
      <div className="flex max-w-full gap-2 overflow-x-auto px-3 pt-2 pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {items.map((item) => {
          const face = (
            <>
              <CardFace item={item} people={people} />
              <CardCopy item={item} />
            </>
          );
          const box = cn(
            "flex w-44 max-w-[70%] shrink-0 flex-col gap-1.5 text-left",
            open && item.youtube === open && "outline outline-1 outline-cream/40",
          );
          if (item.youtube) {
            return (
              <button key={item.key} type="button" className={box} onClick={() => setOpen(item.youtube ?? null)}>
                {face}
              </button>
            );
          }
          if (item.personId) {
            return (
              <Link key={item.key} to="/p/$id" params={{ id: item.personId }} className={box}>
                {face}
              </Link>
            );
          }
          if (item.href) {
            return (
              <a key={item.key} href={item.href} target="_blank" rel="noreferrer" className={box}>
                {face}
              </a>
            );
          }
          return (
            <Link key={item.key} to="/learn" className={box}>
              {face}
            </Link>
          );
        })}
      </div>
      {playing?.youtube ? (
        <RelatedPlayer key={playing.youtube} id={playing.youtube} title={playing.title} onClose={() => setOpen(null)} />
      ) : null}
    </section>
  );
}
