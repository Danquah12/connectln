import { useEffect, useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import {
  armHallSound,
  hallSoundOn,
  playNextHallClip,
  registerHallClip,
} from "@/lib/clip-focus";
import { onHallSilence, stopHallVoice } from "@/lib/voice-bus";
import { youtubeCommand, youtubeEmbed, youtubeThumb } from "@/lib/youtube";
import { cn } from "@/lib/utils";

import { YoutubeMasks } from "@/components/youtube-stage";

function bootPlayer(iframe: HTMLIFrameElement | null, withSound: boolean) {
  if (!iframe?.contentWindow) return;
  iframe.contentWindow.postMessage(JSON.stringify({ event: "listening", id: "1" }), "*");
  youtubeCommand(iframe, "addEventListener", ["onStateChange"]);
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
  className,
}: {
  id: string;
  title?: string;
  headline?: string;
  portrait?: boolean;
  auto?: boolean;
  bare?: boolean;
  className?: string;
}) {
  const root = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLIFrameElement>(null);
  const live = useRef(false);
  const wantSound = useRef(false);
  const [mounted, setMounted] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [sound, setSound] = useState(false);
  const [thumb, setThumb] = useState(youtubeThumb(id));

  useEffect(() => {
    setThumb(youtubeThumb(id));
    setMounted(false);
    setPlaying(false);
    live.current = false;
  }, [id]);

  function startClip() {
    live.current = true;
    const hear = hallSoundOn() || wantSound.current;
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
      if (live.current) setPlaying(true);
    }, 700);
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
        setPlaying(true);
        if (wantSound.current) youtubeCommand(iframe, "unMute");
        else youtubeCommand(iframe, "mute");
      }
      if (data.info === 2) setPlaying(false);
      if (data.info === 0) {
        live.current = false;
        setPlaying(false);
        playNextHallClip(root.current);
      }
    }
    window.addEventListener("message", onMsg);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("message", onMsg);
    };
  }, [mounted, id]);

  return (
    <div ref={root} data-hall-clip="1" className={cn("overflow-hidden bg-ink", className)}>
      <div className={cn("clip-crop bg-ink", portrait ? "aspect-[9/16]" : "aspect-video")}>
        <img
          src={thumb}
          alt=""
          className="absolute inset-0 size-full object-cover"
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
            title={title || headline || "Work video"}
            className={cn("clip-crop-frame", playing ? "opacity-100" : "opacity-0")}
            allow="autoplay; encrypted-media"
            tabIndex={-1}
            onLoad={() => bootPlayer(frame.current, wantSound.current)}
          />
        ) : null}
        <span className="clip-crop-corner" aria-hidden />
        <YoutubeMasks />
        <button
          type="button"
          className="absolute inset-0 z-[2]"
          aria-label={playing ? "Pause" : "Play"}
          onClick={() => {
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
      </div>
    </div>
  );
}
