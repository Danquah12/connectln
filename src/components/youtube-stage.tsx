import { useEffect, useRef, type Ref } from "react";
import { cn } from "@/lib/utils";
import { youtubeCommand, youtubeEmbed, youtubeListen, youtubeSeek, youtubeThumb } from "@/lib/youtube";

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
}) {
  const inner = useRef<HTMLIFrameElement | null>(null);
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
    youtubeCommand(f, "playVideo");
    if (mute) youtubeCommand(f, "mute");
    else youtubeCommand(f, "unMute");
    if (start && start >= 1) youtubeSeek(f, start);
    onLoad?.();
  }

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
      <img src={poster} alt="" className="absolute inset-0 z-0 size-full object-cover object-[center_22%]" />
      <iframe
        ref={bind}
        src={youtubeEmbed(id, { autoplay: autoplay ?? true, mute: true, start, controls: false })}
        title={title}
        className="pointer-events-none absolute inset-0 z-[1] size-full"
        allow="autoplay; encrypted-media"
        tabIndex={-1}
        onLoad={boot}
      />
      <span className="pointer-events-none absolute inset-x-0 top-0 z-[2] h-8 bg-gradient-to-b from-ink/80 to-transparent" aria-hidden />
      <span className="pointer-events-none absolute right-0 bottom-0 z-[2] h-10 w-24 bg-gradient-to-l from-ink to-transparent" aria-hidden />
    </div>
  );
}

export function YoutubeMasks() {
  return (
    <>
      <span className="pointer-events-none absolute inset-x-0 top-0 z-[2] h-8 bg-gradient-to-b from-ink/80 to-transparent" aria-hidden />
      <span className="pointer-events-none absolute right-0 bottom-0 z-[2] h-10 w-24 bg-gradient-to-l from-ink to-transparent" aria-hidden />
    </>
  );
}
