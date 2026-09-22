import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, Pause, Play, Volume2, VolumeX, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { seedReels } from "@/lib/reel-seed";
import { hallContact } from "@/lib/contact";
import { TicketMark } from "@/components/ticket-plate";
import { MailCompose } from "@/components/mail-compose";
import { VoiceNote } from "@/components/voice-note";
import { isExample, hallRoster } from "@/lib/example";
import { hallClipLive, isLecturePost, isLectureReel } from "@/lib/clip-ingest";
import { hallEnglish } from "@/lib/hall-lang";
import { rankLabel } from "@/lib/format";
import { TRADE_GROUPS } from "@/lib/seed";
import { youtubeCommand, youtubeEmbed, youtubeListen, youtubeSeek, youtubeThumb, youtubeTimeFromMessage } from "@/lib/youtube";
import { armHallSound } from "@/lib/clip-focus";
import { personById, useForge } from "@/lib/store";
import { hallVoice, talkScript } from "@/lib/talk-scripts";
import { pauseAllHallClips } from "@/lib/clip-focus";
import { HOUSE_NAME, stripHouse, workSerial } from "@/components/work-frame";
import { YoutubeStage } from "@/components/youtube-stage";
import {
  armHallScroll,
  leavePictureInPicture,
  markProgrammaticScroll,
  playHallVoice,
  silenceHall,
  stopHallVoice,
} from "@/lib/voice-bus";
import { cn } from "@/lib/utils";
import type { Person, Trade } from "@/lib/types";

type WheelItem = {
  id: string;
  person: Person;
  title: string;
  still: string;
  video?: string;
  youtube?: string;
  script: string;
  audio: string;
};

const TRADE_ORDER: Trade[] = TRADE_GROUPS.flatMap((g) => g.trades);

export function WorkWheel() {
  const extraReels = useForge((s) => s.extraReels);
  const people = useForge((s) => s.people);
  const posts = useForge((s) => s.posts);
  const clipStatus = useForge((s) => s.clipStatus);
  const startThread = useForge((s) => s.startThread);
  const setWheelResume = useForge((s) => s.setWheelResume);
  const savedResume = useForge((s) => s.wheelResume);
  const [spinning, setSpinning] = useState(true);
  const [heard, setHeard] = useState<string | null>(null);
  const [tour, setTour] = useState(false);
  const [full, setFull] = useState(false);
  const [open, setOpen] = useState<WheelItem | null>(null);
  const [openAt, setOpenAt] = useState(0);
  const videos = useRef<Record<string, HTMLVideoElement | null>>({});
  const tubes = useRef<Record<string, HTMLIFrameElement | null>>({});
  const cards = useRef<Record<string, HTMLElement | null>>({});
  const stripRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const rootRef = useRef<HTMLElement>(null);
  const itemsRef = useRef<WheelItem[]>([]);
  const indexRef = useRef(0);
  const liveRef = useRef(true);
  const tourRef = useRef(false);
  const tickRef = useRef(0);
  const genRef = useRef(0);
  const fullRef = useRef(false);
  const resumeRef = useRef(0);
  const markRef = useRef(0);
  const startRef = useRef(0);
  const tubeEndedRef = useRef<() => void>(() => undefined);

  const PLATE_MS = 300_000;

  const items = useMemo(() => {
    const reels = [...extraReels, ...seedReels];
    const roster = hallRoster(people)
      .filter((p) => p.photo)
      .slice()
      .sort((a, b) => {
        const ex = Number(isExample(a)) - Number(isExample(b));
        if (ex) return ex;
        const ia = TRADE_ORDER.indexOf(a.trade);
        const ib = TRADE_ORDER.indexOf(b.trade);
        return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
      });

    const synced: WheelItem[] = [];
    const seenYt = new Set<string>();
    const seenTitle = new Set<string>();
    const seenTrade = new Set<string>();

    function titleKey(title: string) {
      return stripHouse(title).toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
    }

    function addPlate(row: {
      id: string;
      person: Person;
      title: string;
      still: string;
      youtube: string;
      script?: string;
    }) {
      if (!row.youtube || seenYt.has(row.youtube)) return;
      if (!hallClipLive(row.youtube, clipStatus, row.id)) return;
      if (!hallEnglish(row.title, row.script, row.person.name)) return;
      const key = titleKey(row.title);
      if (key && seenTitle.has(key)) return;
      seenYt.add(row.youtube);
      if (key) seenTitle.add(key);
      synced.push({
        id: row.id,
        person: row.person,
        title: row.title,
        still: row.still,
        youtube: row.youtube,
        script: row.script || "",
        audio: "",
      });
    }

    for (const r of extraReels) {
      if (!r.youtube) continue;
      if (isLectureReel(r)) continue;
      const person = personById(people, r.personId);
      if (!person) continue;
      addPlate({
        id: r.id,
        person,
        title: r.title || rankLabel(person.level, person.trade),
        still: r.still || youtubeThumb(r.youtube),
        youtube: r.youtube,
        script: r.caption,
      });
    }
    for (const p of posts) {
      if (!p.youtube) continue;
      if (isLecturePost(p)) continue;
      const person = personById(people, p.authorId);
      if (!person) continue;
      addPlate({
        id: p.id,
        person,
        title: p.headline || rankLabel(person.level, person.trade),
        still: p.photo || youtubeThumb(p.youtube),
        youtube: p.youtube,
        script: p.body,
      });
    }

    const first: WheelItem[] = [];
    const rest: WheelItem[] = [];
    for (const it of synced) {
      if (!seenTrade.has(it.person.trade)) {
        seenTrade.add(it.person.trade);
        first.push(it);
      } else rest.push(it);
    }
    const plates = [...first, ...rest].slice(0, Math.max(24, first.length));
    const onPlate = new Set(plates.map((x) => x.person.id));

    const faces = roster
      .filter((person) => !onPlate.has(person.id))
      .map((person): WheelItem => {
        const reel = reels.find((r) => r.personId === person.id && (r.youtube || r.video));
        return {
          id: person.id,
          person,
          title: rankLabel(person.level, person.trade),
          still: person.photo,
          video: reel?.video,
          youtube: reel?.youtube,
          script: talkScript(person.id) || reel?.caption || "",
          audio: hallVoice(person.id, person.trade),
        };
      })
      .filter((it) => {
        if (it.youtube) {
          if (seenYt.has(it.youtube) || !hallClipLive(it.youtube, clipStatus, it.id)) return false;
          const key = titleKey(it.title);
          if (key && seenTitle.has(key)) return false;
          seenYt.add(it.youtube);
          if (key) seenTitle.add(key);
          return true;
        }
        return Boolean(it.video);
      });

    return [...plates, ...faces];
  }, [people, extraReels, posts, clipStatus]);

  itemsRef.current = items;
  const shown = tour ? items : [...items, ...items];
  const speaker = items.find((x) => x.id === heard);

  function slideTo(i: number) {
    const list = itemsRef.current;
    const it = list[((i % list.length) + list.length) % list.length];
    const strip = stripRef.current;
    const card = it ? cards.current[it.id] : null;
    if (!strip || !card) return;
    markProgrammaticScroll();
    const left = card.offsetLeft - (strip.clientWidth - card.offsetWidth) / 2;
    strip.scrollTo({ left: Math.max(0, left), behavior: "smooth" });
  }

  function clearTick() {
    window.clearTimeout(tickRef.current);
  }

  function resetCard(id: string) {
    const v = videos.current[id];
    if (!v) return;
    v.onended = null;
    v.muted = true;
    v.loop = true;
    void v.play().catch(() => undefined);
    youtubeCommand(tubes.current[id], "mute");
    youtubeCommand(tubes.current[id], "pauseVideo");
  }

  function halt(keepSpin = false) {
    genRef.current += 1;
    clearTick();
    liveRef.current = false;
    tourRef.current = false;
    setTour(false);
    stopHallVoice();
    window.speechSynthesis?.cancel();
    void leavePictureInPicture();
    for (const id of Object.keys(videos.current)) resetCard(id);
    for (const id of Object.keys(tubes.current)) {
      youtubeCommand(tubes.current[id], "mute");
      youtubeCommand(tubes.current[id], "pauseVideo");
    }
    setHeard(null);
    setSpinning(keepSpin);
    setFull(false);
    fullRef.current = false;
  }

  function playIndex(i: number, startAt = 0) {
    const list = itemsRef.current;
    if (!list.length || !liveRef.current) return;
    const it = list[((i % list.length) + list.length) % list.length];
    indexRef.current = list.indexOf(it);
    const token = ++genRef.current;
    clearTick();
    stopHallVoice();
    window.speechSynthesis?.cancel();
    pauseAllHallClips();
    for (const id of Object.keys(tubes.current)) {
      if (id === it.id) continue;
      youtubeCommand(tubes.current[id], "mute");
      youtubeCommand(tubes.current[id], "pauseVideo");
    }
    setHeard(it.id);
    setSpinning(false);
    setTour(true);
    tourRef.current = true;
    markRef.current = startAt;
    startRef.current = startAt;
    const used = startAt * 1000;
    const remain = Math.max(8000, PLATE_MS - used);
    fullRef.current = false;
    setFull(false);
    setWheelResume({ itemId: it.id, seconds: startAt, youtube: it.youtube });
    window.requestAnimationFrame(() => slideTo(indexRef.current));

    const done = () => {
      if (token !== genRef.current) return;
      void finished(it);
    };
    tubeEndedRef.current = done;

    const video = videos.current[it.id];
    if (video) {
      video.muted = true;
      video.defaultMuted = true;
      video.volume = 0;
      video.loop = false;
      if (startAt > 0) video.currentTime = startAt;
      else video.currentTime = 0;
      void video.play().catch(() => undefined);
    }

    if (it.youtube) {
      armHallSound(true);
      const boot = () => {
        if (token !== genRef.current) return;
        const frame = tubes.current[it.id];
        youtubeListen(frame);
        youtubeCommand(frame, "playVideo");
        youtubeCommand(frame, "unMute");
        if (startAt >= 1) youtubeSeek(frame, startAt);
      };
      boot();
      window.setTimeout(boot, 280);
      window.setTimeout(boot, 900);
      if (!fullRef.current) tickRef.current = window.setTimeout(done, remain);
      return;
    }

    const src = it.audio || hallVoice(it.person.id, it.person.trade);
    const loopVoice = () => {
      if (token !== genRef.current) return;
      playHallVoice(src, loopVoice);
    };
    loopVoice();
    if (!fullRef.current) tickRef.current = window.setTimeout(done, remain);
  }

  async function finished(it: WheelItem) {
    clearTick();
    await leavePictureInPicture();
    resetCard(it.id);
    if (!liveRef.current || !tourRef.current) {
      setHeard(null);
      return;
    }
    const next = (indexRef.current + 1) % itemsRef.current.length;
    indexRef.current = next;
    playIndex(next);
  }

  function skip(dir: 1 | -1) {
    const list = itemsRef.current;
    if (!list.length) return;
    liveRef.current = true;
    tourRef.current = true;
    armHallSound(true);
    const next = (indexRef.current + dir + list.length) % list.length;
    playIndex(next, 0);
  }

  function startTour(from = 0, startAt = 0) {
    liveRef.current = true;
    tourRef.current = true;
    armHallSound(true);
    armHallScroll();
    silenceHall();
    pauseAllHallClips();
    setTour(true);
    setSpinning(false);
    playIndex(from, startAt);
  }

  function openStage(it: WheelItem) {
    const at = itemsRef.current.findIndex((x) => x.id === it.id);
    resumeRef.current = at >= 0 ? at : Math.max(0, indexRef.current);
    const seconds = heard === it.id ? markRef.current : 0;
    setOpenAt(seconds);
    setWheelResume({ itemId: it.id, seconds, youtube: it.youtube });
    halt(false);
    armHallSound(true);
    setOpen(it);
  }

  function closeStage(seconds?: number) {
    const at = resumeRef.current;
    const t = Math.max(0, seconds ?? markRef.current);
    const it = itemsRef.current[at];
    setOpen(null);
    if (it) setWheelResume({ itemId: it.id, seconds: t, youtube: it.youtube });
    startTour(at, t);
  }

  function leaveStage() {
    setOpen(null);
  }

  function openCard(id: string) {
    halt(false);
    navigate({ to: "/p/$id", params: { id } });
  }

  useEffect(() => {
    function onMsg(e: MessageEvent) {
      let data: unknown = e.data;
      if (typeof e.data === "string") {
        try {
          data = JSON.parse(e.data);
        } catch {
          return;
        }
      }
      const t = youtubeTimeFromMessage(data);
      if (t != null) markRef.current = t;
    }
    window.addEventListener("message", onMsg);
    const tick = window.setInterval(() => {
      if (!tourRef.current || !heard) return;
      const f = tubes.current[heard];
      youtubeListen(f);
      youtubeCommand(f, "getCurrentTime");
    }, 900);
    return () => {
      window.removeEventListener("message", onMsg);
      window.clearInterval(tick);
    };
  }, [heard, tour]);

  useEffect(() => {
    if (!savedResume?.itemId || items.length === 0) return;
    const i = items.findIndex((x) => x.id === savedResume.itemId);
    if (i < 0) return;
    resumeRef.current = i;
    markRef.current = savedResume.seconds;
    const id = window.requestAnimationFrame(() => slideTo(i));
    return () => window.cancelAnimationFrame(id);
  }, [savedResume?.itemId, items.length]);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.intersectionRatio >= 0.25) return;
        if (tourRef.current) halt(false);
      },
      { threshold: [0, 0.25] },
    );
    io.observe(el);
    return () => {
      io.disconnect();
    };
  }, []);

  if (items.length === 0) return null;

  return (
    <section
      ref={rootRef}
      className="overflow-hidden rounded-xl bg-ink text-cream shadow-[var(--shadow-border)]"
    >
      <div className="flex flex-col gap-3 px-3 pt-4 sm:flex-row sm:items-end sm:justify-between sm:px-4">
        <div className="min-w-0 pr-2">
          <h2 className="font-display text-2xl tracking-wide">The wheel</h2>
          <p className="text-xs text-cream/55">
            Next plate anytime. Tap a plate for the whole clip. Each plate plays up to 5 minutes.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => skip(-1)}
            className="grid size-11 place-items-center rounded-full bg-cream/10"
            aria-label="Previous plate"
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => skip(1)}
            className="grid size-11 place-items-center rounded-full bg-cream text-ink"
            aria-label="Next plate"
          >
            <ChevronRight className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => (tour ? halt(false) : setSpinning((x) => !x))}
            className="grid size-11 place-items-center rounded-full bg-cream/10"
            aria-label={tour || spinning ? "Pause wheel" : "Play wheel"}
          >
            {tour || spinning ? <Pause className="size-4" /> : <Play className="size-4" />}
          </button>
          <Link to="/present" className="text-xs text-cream/70 hover:text-cream">
            5-min talks
          </Link>
        </div>
      </div>

      <div
        ref={stripRef}
        className="relative mt-3 overflow-x-auto px-3 pb-3 [scrollbar-width:none] touch-pan-x [-webkit-overflow-scrolling:touch] sm:px-4 sm:pb-2 [&::-webkit-scrollbar]:hidden"
      >
        <div
          className={cn("flex w-max snap-x snap-mandatory gap-3", spinning && !tour && "wheel-track")}
          style={{ animationDuration: "480s" }}
        >
          {shown.map((it, i) => {
            const key = tour ? it.id : `${it.id}-${i}`;
            const firstCopy = tour || i < items.length;
            const speaking = firstCopy && heard === it.id;
            const onDeck = speaking;
            const hear = Boolean(speaking);
            const label = stripHouse(it.title) || it.person.trade;
            return (
              <article
                key={key}
                ref={(el) => {
                  if (tour || i < items.length) cards.current[it.id] = el;
                }}
                className={cn(
                  "work-frame work-frame-wheel relative h-[22rem] w-[13.5rem] shrink-0 snap-center sm:h-[28rem] sm:w-[16rem] lg:h-[32rem] lg:w-[18.5rem]",
                  !tour && "wheel-card",
                  speaking && "z-[2] wheel-speaking",
                  tour && !speaking && "opacity-40",
                )}
                style={!tour ? { ["--tilt" as string]: `${[-18, -8, 0, 8, 18][i % 5]}deg` } : undefined}
              >
                <span aria-hidden className="work-tick work-tick-tl" />
                <span aria-hidden className="work-tick work-tick-tr" />
                <span aria-hidden className="work-tick work-tick-bl" />
                <span aria-hidden className="work-tick work-tick-br" />
                <div className="absolute inset-[8px] bottom-7 z-[1] overflow-hidden bg-ink">
                  <img
                    src={it.still}
                    alt=""
                    className="pointer-events-none absolute inset-0 size-full object-cover object-[center_18%] wheel-still"
                  />
                  {it.youtube && onDeck ? (
                    <WheelTube
                      id={it.youtube}
                      still={it.still}
                      play
                      hear={hear}
                      start={speaking ? startRef.current : 0}
                      onEnded={() => {
                        if (speaking) tubeEndedRef.current();
                      }}
                      capture={(el) => {
                        tubes.current[it.id] = el;
                      }}
                    />
                  ) : it.video && onDeck ? (
                    <WheelVid
                      src={it.video}
                      still={it.still}
                      play
                      solo
                      capture={(el) => {
                        videos.current[it.id] = el;
                      }}
                    />
                  ) : null}
                  <span
                    className={cn(
                      "pointer-events-none absolute top-3 right-3 z-[2] grid size-9 place-items-center bg-ink/70 text-cream",
                      speaking && "bg-brick",
                    )}
                  >
                    {speaking ? <Volume2 className="size-4" /> : <VolumeX className="size-4" />}
                  </span>
                  {speaking ? (
                    <span className="pointer-events-none absolute top-3 left-3 z-[2] bg-brick px-2.5 py-1 text-[10px] font-medium tracking-wide uppercase">
                      {full ? "Playing all" : "5 min"}
                    </span>
                  ) : null}
                  <span className="pointer-events-none absolute inset-x-0 bottom-0 z-[3] bg-gradient-to-t from-ink via-ink/80 to-transparent px-3 pt-16 pb-3 text-left text-cream">
                    <span className="block truncate font-display text-xl tracking-wide sm:text-2xl">
                      {label}
                    </span>
                  </span>
                  <button
                    type="button"
                    className="absolute inset-0 z-10 cursor-pointer"
                    aria-label={`Open ${HOUSE_NAME} video and card`}
                    onClick={() => openStage(it)}
                  />
                </div>
                <span className="work-frame-plate pointer-events-none absolute inset-x-2 bottom-0 z-[2]">
                  <span className="work-frame-serial">{workSerial(it.person.id)}</span>
                  <span className="truncate">{HOUSE_NAME}</span>
                </span>
              </article>
            );
          })}
        </div>
      </div>

      {open ? (
        <WheelStage
          item={open}
          start={openAt}
          onClose={closeStage}
          onOpenCard={() => {
            const id = open.person.id;
            leaveStage();
            openCard(id);
          }}
          onAsk={() => {
            const c = hallContact(open.person);
            startThread(open.person.id, c.ask);
            leaveStage();
            navigate({ to: "/messages" });
          }}
        />
      ) : speaker ? (
        <WheelContact
          person={speaker.person}
          script={speaker.script}
          onOpen={() => openCard(speaker.person.id)}
          onAsk={() => {
            const c = hallContact(speaker.person);
            startThread(speaker.person.id, c.ask);
            halt(false);
            navigate({ to: "/messages" });
          }}
        />
      ) : null}
    </section>
  );
}

function WheelTube({
  id,
  still,
  play,
  hear,
  start = 0,
  onEnded,
  capture,
}: {
  id: string;
  still: string;
  play: boolean;
  hear: boolean;
  start?: number;
  onEnded?: () => void;
  capture: (el: HTMLIFrameElement | null) => void;
}) {
  const root = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLIFrameElement | null>(null);
  const live = play;

  function bind(el: HTMLIFrameElement | null) {
    frame.current = el;
    capture(el);
  }

  function boot() {
    const f = frame.current;
    if (!f) return;
    f.contentWindow?.postMessage(JSON.stringify({ event: "listening", id: "1" }), "*");
    youtubeCommand(f, "addEventListener", ["onStateChange"]);
    youtubeCommand(f, "playVideo");
    if (hear) youtubeCommand(f, "unMute");
    else youtubeCommand(f, "mute");
    if (start >= 1) youtubeSeek(f, start);
  }

  useEffect(() => {
    if (!live) {
      youtubeCommand(frame.current, "pauseVideo");
      youtubeCommand(frame.current, "mute");
      return;
    }
    const t = window.setTimeout(boot, 120);
    const u = window.setTimeout(boot, 600);
    function onMsg(e: MessageEvent) {
      const f = frame.current;
      if (f && e.source && e.source !== f.contentWindow) return;
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
      if (data.event === "onStateChange" && data.info === 0) onEnded?.();
    }
    window.addEventListener("message", onMsg);
    return () => {
      window.clearTimeout(t);
      window.clearTimeout(u);
      window.removeEventListener("message", onMsg);
      youtubeCommand(frame.current, "pauseVideo");
      youtubeCommand(frame.current, "mute");
      capture(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [live, hear, id]);

  if (!live) return null;

  return (
    <YoutubeStage
      id={id}
      title="Work"
      autoplay
      mute={!hear}
      start={start}
      still={still}
      frameRef={bind}
      onLoad={boot}
    />
  );
}

function WheelVid({
  src,
  still,
  play,
  capture,
}: {
  src: string;
  still: string;
  play: boolean;
  solo: boolean;
  capture: (el: HTMLVideoElement | null) => void;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    capture(el);
    el.muted = true;
    el.defaultMuted = true;
    el.volume = 0;
    const keepQuiet = () => {
      if (!el.muted) el.muted = true;
      if (el.volume !== 0) el.volume = 0;
    };
    el.addEventListener("volumechange", keepQuiet);
    const io = new IntersectionObserver(
      ([hit]) => setInView(Boolean(hit?.isIntersecting)),
      { rootMargin: "80px", threshold: [0, 0.2, 1] },
    );
    io.observe(el);
    return () => {
      el.removeEventListener("volumechange", keepQuiet);
      io.disconnect();
      capture(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.muted = true;
    el.defaultMuted = true;
    el.volume = 0;
    if (play && inView) void el.play().catch(() => undefined);
    else el.pause();
  }, [play, inView, src]);

  return (
    <video
      ref={ref}
      src={src}
      poster={still}
      className="pointer-events-none absolute inset-0 size-full object-cover object-[center_18%]"
      muted
      loop
      playsInline
      disablePictureInPicture
      preload="metadata"
    />
  );
}

function WheelStage({
  item,
  start = 0,
  onClose,
  onOpenCard,
  onAsk,
}: {
  item: WheelItem;
  start?: number;
  onClose: (seconds?: number) => void;
  onOpenCard: () => void;
  onAsk: () => void;
}) {
  const frame = useRef<HTMLIFrameElement>(null);
  const at = useRef(start);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    at.current = start;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeRef.current(at.current);
    };
    function onMsg(e: MessageEvent) {
      let data: unknown = e.data;
      if (typeof e.data === "string") {
        try {
          data = JSON.parse(e.data);
        } catch {
          return;
        }
      }
      const t = youtubeTimeFromMessage(data);
      if (t != null) at.current = t;
    }
    window.addEventListener("keydown", onKey);
    window.addEventListener("message", onMsg);
    const poll = window.setInterval(() => {
      youtubeListen(frame.current);
      youtubeCommand(frame.current, "getCurrentTime");
    }, 700);
    const t = window.setTimeout(() => {
      const f = frame.current;
      if (!f) return;
      youtubeListen(f);
      youtubeCommand(f, "playVideo");
      youtubeCommand(f, "unMute");
      if (start >= 1) youtubeSeek(f, start);
    }, 200);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("message", onMsg);
      window.clearInterval(poll);
      window.clearTimeout(t);
      youtubeCommand(frame.current, "pauseVideo");
      youtubeCommand(frame.current, "mute");
    };
  }, [item.id, start]);

  function cancel() {
    onClose(at.current);
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-ink/80 p-3 sm:items-center sm:p-6">
      <button type="button" className="absolute inset-0 cursor-default" aria-label="Back to the wheel" onClick={cancel} />
      <div className="relative z-[1] flex max-h-[92dvh] w-full max-w-3xl flex-col overflow-hidden rounded-xl bg-ink shadow-[var(--shadow-border)]">
        <div className="flex items-center justify-between gap-3 px-4 py-3 text-cream">
          <div className="min-w-0">
            <p className="truncate font-display text-2xl tracking-wide">{item.title}</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={cancel}
              className="h-11 rounded-full bg-cream px-4 text-sm font-medium text-ink"
            >
              Back to the wheel
            </button>
            <button
              type="button"
              onClick={cancel}
              className="grid size-11 place-items-center rounded-full bg-cream/10"
              aria-label="Cancel"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>
        <div className="relative aspect-video w-full overflow-hidden bg-ink">
          {item.youtube ? (
            <YoutubeStage
              id={item.youtube}
              title={stripHouse(item.title) || "Work"}
              autoplay
              mute={false}
              start={start}
              still={item.still}
              frameRef={frame}
            />
          ) : item.video ? (
            <video
              src={item.video}
              poster={item.still}
              className="absolute inset-0 size-full object-cover"
              controls
              autoPlay
              playsInline
              onTimeUpdate={(e) => {
                at.current = e.currentTarget.currentTime;
              }}
              ref={(el) => {
                if (el && start >= 1) el.currentTime = start;
              }}
            />
          ) : (
            <img src={item.still} alt="" className="absolute inset-0 size-full object-cover object-[center_18%]" />
          )}
        </div>
        <div className="max-h-[40dvh] overflow-y-auto bg-canvas">
          <WheelContact
            person={item.person}
            script={item.script}
            onOpen={onOpenCard}
            onAsk={onAsk}
          />
        </div>
      </div>
    </div>
  );
}

function WheelContact({
  person,
  script,
  onOpen,
  onAsk,
}: {
  person: Person;
  script: string;
  onOpen: () => void;
  onAsk: () => void;
}) {
  const c = hallContact(person);
  const openLine = useForge((s) => s.openLine);
  return (
    <div className="mx-4 mb-4 rounded-lg bg-cream p-4 text-ink">
      <p className="text-[10px] font-medium tracking-[0.18em] text-muted-foreground uppercase">
        {HOUSE_NAME}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        Presented on ConnectLn. Reach the house or this trade.
      </p>
      <div className="mt-1 flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="font-display text-3xl tracking-wide">{person.name}</p>
          <p className="text-sm text-muted-foreground">
            {rankLabel(person.level, person.trade)}
            {person.city ? ` · ${person.city}, ${person.state}` : ""}
          </p>
        </div>
        {person.rate ? (
          <p className="text-sm tabular-nums">{person.rate}</p>
        ) : null}
      </div>
      {script ? (
        <p className="mt-2 text-sm leading-relaxed text-ink/80">“{script}”</p>
      ) : null}
      {person.tickets.length ? (
        <div className="mt-2 flex flex-wrap gap-1">
          {person.tickets.slice(0, 3).map((t) => (
            <TicketMark key={t.id} ticket={t} />
          ))}
        </div>
      ) : null}
      <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-3">
        <div>
          <dt className="text-[11px] tracking-wide text-muted-foreground uppercase">Phone</dt>
          <dd className="font-medium tabular-nums">{c.phone}</dd>
        </div>
        <div className="min-w-0">
          <dt className="text-[11px] tracking-wide text-muted-foreground uppercase">Hall mail</dt>
          <dd className="truncate font-medium">{c.email}</dd>
        </div>
        <div>
          <dt className="text-[11px] tracking-wide text-muted-foreground uppercase">Start</dt>
          <dd>{c.start}</dd>
        </div>
      </dl>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button variant="ink" size="sm" onClick={() => openLine(person.id, "call")}>
          Call on the line
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link to="/meet/$id" params={{ id: person.id }}>
            Meet
          </Link>
        </Button>
        <VoiceNote person={person} />
        <Button variant="outline" size="sm" asChild>
          <a href={`sms:${c.tel}`}>Text</a>
        </Button>
        <MailCompose person={person} compact />
        <Button variant="outline" size="sm" onClick={onAsk}>
          Message for a job
        </Button>
        <Button variant="ghost" size="sm" onClick={onOpen}>
          Full card
        </Button>
      </div>
    </div>
  );
}
