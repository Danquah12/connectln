import { useEffect, useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import {
  armHallSound,
  hallSoundOn,
  playNextHallClip,
  registerHallClip,
  bringHallClipToTop,
} from "@/lib/clip-focus";
import { onHallSilence, stopHallVoice } from "@/lib/voice-bus";
import { youtubeCommand, youtubeEmbed, youtubeHideCaptions, youtubeThumb } from "@/lib/youtube";
import { cn } from "@/lib/utils";

import { YoutubeMasks, filmTitle } from "@/components/youtube-stage";
import { FilmChrome } from "@/components/film-chrome";
import { ClipRail } from "@/components/clip-rail";
import type { Person } from "@/lib/types";

function bootPlayer(iframe: HTMLIFrameElement | null, withSound: boolean) {
  if (!iframe?.contentWindow) return;
  iframe.contentWindow.postMessage(JSON.stringify({ event: "listening", id: "1" }), "*");
  youtubeCommand(iframe, "addEventListener", ["onStateChange"]);
  youtubeHideCaptions(iframe);
  youtubeCommand(iframe, "mute");
  youtubeCommand(iframe, "playVideo");
  if (withSound) youtubeCommand(iframe, "unMute");
}

export function YoutubeClip({
  id,
  title,
  headline,
  portrait = false,
  bare = false,
  soundOnView = false,
  caption,
  spoken,
  plate,
  banner,
  className,
  showRail = true,
  social = false,
  large = false,
  rail,
}: {
  id: string;
  title?: string;
  headline?: string;
  portrait?: boolean;
  auto?: boolean;
  bare?: boolean;
  soundOnView?: boolean;
  caption?: string;
  spoken?: string;
  plate?: string;
  banner?: { mark: string; title: string; line?: string };
  className?: string;
  showRail?: boolean;
  social?: boolean;
  large?: boolean;
  rail?: {
    person?: Person | null;
    likes?: number;
    comments?: number;
    reposts?: number;
    liked?: boolean;
    onLike?: () => void;
    onComment?: () => void;
    onWrite?: (body: string) => void;
    onRepost?: () => void;
    meaning?: string;
  };
}) {
  const root = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLIFrameElement>(null);
  const live = useRef(false);
  const wantSound = useRef(false);
  const [mounted, setMounted] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [sound, setSound] = useState(false);
  const [thumb, setThumb] = useState(youtubeThumb(id));
  const [captionOpen, setCaptionOpen] = useState(false);
  const phrases = (spoken ?? "")
    .split(/\s+/)
    .filter(Boolean)
    .reduce<string[]>((rows, word) => {
      const last = rows[rows.length - 1];
      if (!last || last.split(" ").length >= 3) rows.push(word);
      else rows[rows.length - 1] = `${last} ${word}`;
      return rows;
    }, []);
  const [phrase, setPhrase] = useState(0);

  useEffect(() => {
    if (!playing || phrases.length < 2) return;
    const timer = window.setInterval(() => setPhrase((n) => (n + 1) % phrases.length), 1600);
    return () => window.clearInterval(timer);
  }, [playing, phrases.length]);

  useEffect(() => {
    setThumb(youtubeThumb(id));
    setMounted(false);
    setPlaying(false);
    live.current = false;
  }, [id]);

  function startClip() {
    live.current = true;
    const hear = soundOnView || hallSoundOn() || wantSound.current;
    wantSound.current = hear;
    setSound(hear);
    setMounted(true);
    stopHallVoice();
    window.setTimeout(() => bootPlayer(frame.current, hear), 80);
  }

  function stopClip() {
    live.current = false;
    setPlaying(false);
    youtubeCommand(frame.current, "pauseVideo");
    youtubeCommand(frame.current, "mute");
  }

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const offClip = registerHallClip(el, {
      play: () => startClip(),
      pause: () => stopClip(),
    });
    const offHall = onHallSilence(() => {
      wantSound.current = false;
      setSound(false);
      stopClip();
    });
    return () => {
      offClip();
      offHall();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (!mounted) return;
    const iframe = frame.current;
    const t = window.setTimeout(() => {
      bootPlayer(iframe, wantSound.current);
    }, 700);
    let reveal = 0;
    function onMsg(e: MessageEvent) {
      if (iframe && e.source && e.source !== iframe.contentWindow) return;
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
      if (data.event !== "onStateChange") return;
      if (data.info === 1) {
        window.clearTimeout(reveal);
        reveal = window.setTimeout(() => {
          if (live.current) setPlaying(true);
        }, 240);
        if (wantSound.current) youtubeCommand(iframe, "unMute");
        else youtubeCommand(iframe, "mute");
      }
      if (data.info === 2) setPlaying(false);
      if (data.info === 0) {
        live.current = false;
        setPlaying(false);
        setMounted(false);
        playNextHallClip(root.current);
      }
    }
    window.addEventListener("message", onMsg);
    return () => {
      window.clearTimeout(t);
      window.clearTimeout(reveal);
      window.removeEventListener("message", onMsg);
    };
  }, [mounted, id]);

  return (
    <div className={cn("flex min-w-0 max-w-full flex-col", className)}>
    <div ref={root} data-hall-clip="1" className="min-h-0 w-full flex-1 overflow-hidden bg-ink">
      <div className={cn("clip-crop bg-ink", large ? "aspect-[4/5]" : portrait || social ? "aspect-[9/16]" : "aspect-video")}>
        <img
          src={thumb}
          alt=""
          className={cn("absolute inset-0 size-full object-center", large ? "object-cover" : "object-contain")}
          onError={() => setThumb(youtubeThumb(id, "hq"))}
        />
        {headline && !playing ? (
          <span className="pointer-events-none absolute inset-x-4 top-[28%] z-[1]">
            <span className="block text-center font-display text-3xl leading-[0.95] tracking-wide text-cream drop-shadow sm:text-4xl">
              {headline}
            </span>
          </span>
        ) : null}
        {mounted ? (
          <iframe
            ref={frame}
            src={youtubeEmbed(id, { autoplay: true, mute: true })}
            title={filmTitle(title || headline)}
            className={cn(large ? "clip-fill-frame" : "clip-crop-frame", portrait && !large && "clip-crop-talk", !playing && "invisible")}
            allow="autoplay; encrypted-media"
            tabIndex={-1}
            onLoad={() => bootPlayer(frame.current, wantSound.current)}
          />
        ) : null}
        {social ? null : <YoutubeMasks />}
        {social ? (
          <FilmChrome
            person={rail?.person}
            caption={rail?.meaning || headline || title}
            likes={rail?.likes}
            comments={rail?.comments}
            liked={rail?.liked}
            onLike={rail?.onLike}
            onWrite={rail?.onWrite}
            onRepost={rail?.onRepost}
            clipId={id}
          />
        ) : null}
        <button
          type="button"
          className="absolute inset-0 z-[2]"
          aria-label={playing ? "Pause" : "Play"}
          onClick={() => {
            bringHallClipToTop(root.current);
            if (!live.current) {
              startClip();
              return;
            }
            if (playing) {
              youtubeCommand(frame.current, "pauseVideo");
              setPlaying(false);
            } else {
              youtubeCommand(frame.current, "playVideo");
              if (wantSound.current) youtubeCommand(frame.current, "unMute");
              setPlaying(true);
            }
          }}
        />
        {social ? null : (
        <button
          type="button"
          className="absolute left-3 top-3 z-[3] grid size-11 place-items-center rounded-sm bg-ink/80 text-cream"
          aria-label={sound ? "Quiet" : "Hear this"}
          onClick={(e) => {
            e.stopPropagation();
            const next = !sound;
            wantSound.current = next;
            armHallSound(next);
            setSound(next);
            if (!live.current) startClip();
            if (next) {
              youtubeCommand(frame.current, "unMute");
              youtubeCommand(frame.current, "playVideo");
            } else youtubeCommand(frame.current, "mute");
          }}
        >
          {sound ? <Volume2 className="size-4" strokeWidth={1.75} /> : <VolumeX className="size-4" strokeWidth={1.75} />}
        </button>
        )}
        {spoken && phrases[phrase] ? (
          <span className="pointer-events-none absolute inset-x-4 bottom-[18%] z-[4] text-center text-lg font-medium text-cream drop-shadow">
            {phrases[phrase]}
          </span>
        ) : null}
        {plate ? (
          <span className="pointer-events-none absolute bottom-3 left-3 z-[4] bg-ink px-2 py-1 text-sm font-medium text-cream">
            {plate}
          </span>
        ) : null}
        {banner ? (
          <span className="pointer-events-none absolute inset-x-0 bottom-0 z-[4]">
            <span className="ml-3 inline-block bg-ink px-2 py-0.5 text-[10px] font-medium tracking-wide text-cream uppercase">
              {banner.mark}
            </span>
            <span className="block bg-brick px-3 py-2">
              <span className="block font-display text-xl leading-tight tracking-wide text-cream">{banner.title}</span>
              {banner.line ? <span className="mt-0.5 block text-[11px] text-cream/80">{banner.line}</span> : null}
            </span>
          </span>
        ) : null}
        {caption ? (
          <div className="absolute inset-x-0 bottom-0 z-[4] bg-gradient-to-t from-ink via-ink/80 to-transparent px-4 pt-14 pb-3">
            <p
              className={cn(
                "font-display text-xl leading-tight tracking-wide text-cream sm:text-2xl",
                captionOpen ? "" : "line-clamp-3",
              )}
            >
              {caption}
            </p>
            <button
              type="button"
              className="mt-2 rounded-sm bg-brick px-2.5 py-1 text-xs font-medium text-cream"
              onClick={(e) => {
                e.stopPropagation();
                setCaptionOpen((v) => !v);
              }}
            >
              {captionOpen ? "Hide caption" : "Read caption"}
            </button>
          </div>
        ) : null}
      </div>
    </div>
    {showRail ? (
    <ClipRail
      person={rail?.person}
      likes={rail?.likes}
      comments={rail?.comments}
      reposts={rail?.reposts}
      liked={rail?.liked}
      onLike={rail?.onLike}
      onComment={rail?.onComment}
      onWrite={rail?.onWrite}
      onRepost={rail?.onRepost}
      meaning={rail?.meaning || title || headline}
      clipId={id}
    />
    ) : null}
    </div>
  );
}
