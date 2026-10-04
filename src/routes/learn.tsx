import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { WorkFrame, workSerial, HOUSE_NAME, stripHouse } from "@/components/work-frame";
import { YoutubeClip } from "@/components/youtube-clip";
import { lessons, trainings } from "@/lib/board-seed";
import { hallClipLive, isLecturePost } from "@/lib/clip-ingest";
import { sitStreak } from "@/lib/return";
import { personById, useForge } from "@/lib/store";
import { tradeFilms, tradeRank } from "@/lib/trade-shuffle";
import { LEARN_PATHS } from "@/lib/learn-paths";
import { seedReels } from "@/lib/reel-seed";
import { BRIEFS } from "@/lib/briefs";
import { LIBRARIES } from "@/lib/libraries";
import { hallCopy } from "@/lib/lang";
import { TRADE_GROUPS } from "@/lib/seed";
import { groupOf } from "@/lib/scope";
import { cn } from "@/lib/utils";
import type { FieldGroup, Trade } from "@/lib/types";

const TRACKS: { id: "all" | "care" | "tools" | "build" | "civic" | "lab"; label: string; trades?: Trade[] }[] = [
  { id: "all", label: "All houses" },
  { id: "care", label: "Care", trades: ["Nurse", "Physician", "Pharmacist", "Therapist", "Dentist", "Paramedic", "Dental hygienist", "Veterinarian", "Midwife", "Respiratory therapist", "Firefighter"] },
  { id: "tools", label: "On the tools", trades: ["Electrician", "Plumber", "HVAC", "Welder", "Carpenter", "Ironworker", "Millwright", "Solar", "Equipment", "Elevator", "Lineman", "Pipefitter", "Sheet metal", "Mason", "Roofer", "Sprinkler fitter", "Machinist", "Diesel technician", "Chef", "Truck driver", "Barber"] },
  { id: "build", label: "Build", trades: ["Developer", "Faculty"] },
  { id: "civic", label: "Civic", trades: ["Advisor", "Bookkeeper", "Realtor", "Agent", "Inspector", "Appraiser"] },
  { id: "lab", label: "Labs", trades: ["Faculty"] },
];

const CHIP_FILM: Record<
  string,
  { youtube?: string; title: string; line: string; points?: string[]; lessonId?: string; trainingId?: string; trade?: Trade }
> = {
  Motors: {
    lessonId: "l1",
    title: "Motor wiring logic",
    line: "The diagram in the peckerhead is the law. A remembered chart is not.",
    points: [
      "Read the nameplate before a lead moves. Voltage, FLA, horsepower, and the connection diagram on the motor decide the hookup.",
      "A dual-voltage motor is the same windings joined two ways. Low voltage lands them in parallel. High voltage lands them in series. The diagram says which leads share a lug.",
      "Line is T1, T2, and T3 through the contactor. Size the overload to the nameplate FLA of the voltage you actually landed, not the other one.",
      "The coil is a different circuit from the motor leads. Do not land a control wire on a power lug.",
      "To reverse rotation, swap any two line leads on the load side of the contactor. Do not rewire the motor to chase rotation.",
      "Lock out, prove it dead, then open the peckerhead. A spinning motor is not a wiring lesson.",
    ],
  },
  OSHA: {
    youtube: "s12SO9YUitc",
    title: "OSHA safety standards",
    line: "OSHA 30 is the card shops ask to see. It is not a license, and it does not replace an electrically safe work condition.",
    trainingId: "tr1",
    points: [
      "OSHA 10 and OSHA 30 are outreach cards. They prove you sat the class. They do not let you pull a permit.",
      "Construction electrical work is 29 CFR 1926 Subpart K. General industry is 1910 Subpart S. Use the part that matches the job.",
      "De-energize first. Energized work is the exception the employer has to justify, not the habit of the crew (1926.416 and 1910.333).",
      "On a construction site, lockout is 1926.417: open the disconnect, tag it, and keep it from being closed. General-industry lockout is 1910.147.",
      "Prove the meter on a known live source, test the circuit, then prove the meter again. A dark light is not a test.",
      "NFPA 70E is how a shop defines an electrically safe work condition. OSHA does not publish 70E. A shock or an arc is still an OSHA case.",
    ],
  },
  Panels: {
    youtube: "cNezGvaC5R0",
    title: "Lock the whole panel",
    line: "One cable, one lock. Then prove it's dead before the cover comes off.",
    points: [
      "Find every source that can feed the panel, including a generator or a second feed.",
      "Open the disconnect. Your lock goes on. The tag names you.",
      "Prove the meter on a live source, test the panel, then prove the meter again.",
      "The cover comes off only after that test.",
    ],
  },
  Handoff: {
    lessonId: "l2",
    title: "Night-shift handoff that survives audit",
    line: "The handoff is the work. Twelve minutes, then you sit it.",
  },
  "Night shift": {
    lessonId: "l2",
    title: "Night-shift handoff that survives audit",
    line: "Nights. The note has to survive the morning audit.",
  },
  Classroom: {
    youtube: "FOJjjEBbzcg",
    title: "From the service to a classroom",
    line: "A state-approved program, the content exams, then the certificate.",
    trade: "Teacher",
  },
  Campus: {
    youtube: "vPh8w0zOLu4",
    title: "The campus",
    line: "The college hires. A state board does not license the lecture.",
    trade: "Faculty",
  },
};

function pathFilm(trade: Trade) {
  const path = LEARN_PATHS.find((p) => p.trade === trade && p.youtube);
  if (!path?.youtube) return null;
  return {
    youtube: path.youtube,
    title: path.clip || path.trade,
    line: path.steps,
    trade,
  };
}

function matchesTopic(c: { title: string; topic: string }, topic: string, yours: string) {
  if (topic === yours) return true;
  const title = c.title.toLowerCase();
  const q = topic.toLowerCase();
  if (title.includes(q) || c.topic.toLowerCase() === q) return true;
  if (q.endsWith("s") && q.length > 3 && title.includes(q.slice(0, -1))) return true;
  return false;
}

type Course = {
  id: string;
  title: string;
  minutes: number;
  by: string;
  topic: string;
  image: string;
  tone: "ink" | "paper";
  youtube: string;
  trades: Trade[];
};

function minutesLabel(n: number) {
  if (n < 60) return `${n}m`;
  const h = Math.floor(n / 60);
  const m = n % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

export const Route = createFileRoute("/learn")({ component: LearnPage });

function LearnPage() {
  const people = useForge((s) => s.people);
  const posts = useForge((s) => s.posts);
  const extraReels = useForge((s) => s.extraReels);
  const clipStatus = useForge((s) => s.clipStatus);
  const satLessonIds = useForge((s) => s.satLessonIds);
  const satDays = useForge((s) => s.satDays);
  const sitLesson = useForge((s) => s.sitLesson);
  const noteWatch = useForge((s) => s.noteWatch);
  const streak = sitStreak(satDays);
  const [openId, setOpenId] = useState<string | null>(null);
  const [track, setTrack] = useState<(typeof TRACKS)[number]["id"]>("all");

  const lectures = useMemo(() => {
    const rows = posts.filter((p) => isLecturePost(p) && p.youtube && hallClipLive(p.youtube, clipStatus, p.id));
    const t = TRACKS.find((x) => x.id === track);
    if (!t?.trades) return rows;
    return rows.filter((p) => {
      const who = personById(people, p.authorId);
      return who ? t.trades!.includes(who.trade) : false;
    });
  }, [posts, clipStatus, track, people]);
  const open = lectures.find((p) => p.id === openId);

  const you = personById(people, useForge((s) => s.youId));
  const copy = hallCopy(useForge((s) => s.hallLang));
  const first = you?.name.split(" ")[0] || "there";
  const topics = [
    copy.yours,
    ...(you?.trade === "Electrician"
      ? ["Motors", "OSHA", "Panels"]
      : you?.trade === "Nurse" || you?.trade === "Physician"
        ? ["Handoff", "Night shift"]
        : you?.trade === "Teacher" || you?.trade === "Faculty"
          ? ["Classroom", "Campus"]
          : you?.trade === "Advisor"
            ? ["The record"]
            : !you
              ? ["The card", "The hall"]
              : groupOf(you.trade) === "care"
                ? ["The license", "The hall"]
                : groupOf(you.trade) === "money"
                  ? ["The books", "The record"]
                  : groupOf(you.trade) === "homes"
                    ? ["The card", "The file"]
                    : ["The card", "The hall"]),
  ];
  const [courseId, setCourseId] = useState<string | null>(null);
  const [pathId, setPathId] = useState<string | null>(null);
  const [pathGroup, setPathGroup] = useState<"all" | FieldGroup>("all");
  const [pathTrade, setPathTrade] = useState<Trade | "all">("all");
  const [jump, setJump] = useState(0);
  const openedYours = useRef(false);
  useEffect(() => {
    if (openedYours.current || !you?.trade) return;
    openedYours.current = true;
    setPathGroup(groupOf(you.trade));
    setPathTrade(you.trade);
    setPathId(you.trade);
  }, [you?.trade]);
  const [topic, setTopic] = useState(copy.yours);
  const [topicJump, setTopicJump] = useState(0);
  useEffect(() => setTopic(copy.yours), [copy.yours]);
  useEffect(() => {
    if (!jump) return;
    const frame = requestAnimationFrame(() => {
      const el = document.getElementById("learn-now-playing") ?? document.getElementById("learn-paths");
      el?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    return () => cancelAnimationFrame(frame);
  }, [jump, pathId]);
  useEffect(() => {
    if (!topicJump) return;
    const frame = requestAnimationFrame(() => {
      document.getElementById("learn-topic")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    return () => cancelAnimationFrame(frame);
  }, [topicJump, topic]);
  useEffect(() => {
    if (!courseId) return;
    const frame = requestAnimationFrame(() => {
      document.getElementById("learn-course-player")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    return () => cancelAnimationFrame(frame);
  }, [courseId]);
  useEffect(() => {
    if (!openId) return;
    const frame = requestAnimationFrame(() => {
      document.getElementById("learn-lecture-player")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    return () => cancelAnimationFrame(frame);
  }, [openId]);
  const [query, setQuery] = useState("");
  const syncedCourses = useMemo(() => {
    const rows: Course[] = [];
    for (const p of posts) {
      if (!p.youtube || !p.sitTo || !hallClipLive(p.youtube, clipStatus, p.id)) continue;
      const who = personById(people, p.authorId);
      rows.push({
        id: p.id,
        title: stripHouse(p.headline) || stripHouse(p.body) || "Work",
        minutes: 0,
        by: who?.name || "Synced",
        topic: who?.trade || "Hall",
        image: p.photo || "",
        tone: "ink",
        youtube: p.youtube,
        trades: who?.trade ? [who.trade] : [],
      });
    }
    return rows;
  }, [posts, clipStatus, people]);
  const mine = syncedCourses.filter((c) => !you?.trade || c.trades.includes(you.trade));
  const hall = syncedCourses.filter((c) => !mine.includes(c));
  const needle = query.trim().toLowerCase();
  function show(row: Course[]) {
    const picked = TRADE_GROUPS.find((g) => g.id === pathGroup)?.trades ?? [];
    const rank = (c: Course) => {
      if (pathTrade !== "all" && c.trades.includes(pathTrade)) return 0;
      if (pathGroup !== "all" && c.trades.some((t) => picked.includes(t))) return 1;
      return 2;
    };
    return row
      .filter((c) => {
        if (!matchesTopic(c, topic, copy.yours)) return false;
        if (!needle) return true;
        return `${c.title} ${c.by} ${c.topic}`.toLowerCase().includes(needle);
      })
      .sort((a, b) => rank(a) - rank(b) || tradeRank(a.topic, a.id) - tradeRank(b.topic, b.id));
  }

  function chooseHall(id: FieldGroup) {
    const trades = TRADE_GROUPS.find((g) => g.id === id)?.trades ?? [];
    const first = LEARN_PATHS.find((p) => trades.includes(p.trade) && p.youtube);
    setPathGroup(id);
    setPathTrade("all");
    setPathId(first?.trade ?? null);
    setJump((n) => n + 1);
  }

  function chooseTrade(trade: Trade) {
    setPathTrade(trade);
    setPathId(trade);
    setJump((n) => n + 1);
  }

  return (
    <div className="flex flex-col gap-4">
      <header>
        <h1 className="font-display text-4xl tracking-wide">{copy.hello} {first},</h1>
        <p className="mt-1 font-display text-2xl leading-tight tracking-wide">
          {copy.sit}{streak ? ` ${streak}.` : ""}
        </p>
      </header>

      <div className="flex flex-wrap gap-1.5">
        {topics.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => {
              setTopic(t);
              noteWatch("study", t);
              if (t === copy.yours && you?.trade) {
                setPathGroup(groupOf(you.trade));
                setPathTrade(you.trade);
                setPathId(you.trade);
                setJump((n) => n + 1);
                return;
              }
              setTopicJump((n) => n + 1);
            }}
            className={cn(
              "h-9 rounded-full px-3 text-sm",
              topic === t ? "bg-ink text-cream" : "bg-cream text-ink shadow-[var(--shadow-border)]",
            )}
          >
            {t}
          </button>
        ))}
      </div>
      <p className="text-sm text-muted-foreground">
        {topic === copy.yours
          ? "Your card opens your own training film, further down this page."
          : `${topic} opens here. The writing is the lesson. The film, if there is one, sits under it.`}
      </p>

      {topic !== copy.yours ? (
        <TopicSit
          topic={topic}
          seat={
            CHIP_FILM[topic] ??
            (topic === "The record"
              ? pathFilm("Advisor")
              : topic === "The books"
                ? pathFilm("Bookkeeper")
                : topic === "The file"
                  ? pathFilm("Inspector") ?? pathFilm("Realtor")
                  : topic === "The card" || topic === "The license"
                    ? you?.trade
                      ? pathFilm(you.trade)
                      : null
                    : topic === "The hall" && you?.trade
                      ? pathFilm(TRADE_GROUPS.find((g) => g.trades.includes(you.trade))?.trades.find((t) => t !== you.trade) ?? you.trade) 
                      : you?.trade
                        ? pathFilm(you.trade)
                        : null)
          }
          sat={satLessonIds.includes(CHIP_FILM[topic]?.lessonId ?? "")}
          onSit={(id, title) => {
            sitLesson(id);
            toast(`Sat ${title}.`);
          }}
        />
      ) : null}

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={copy.search}
        className="h-11 rounded-full border border-ink/15 bg-cream px-4 text-sm outline-none"
      />

      {syncedCourses.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          The houses are still syncing. The paths below are the standing guidance. A synced presentation joins them after it passes vet.
        </p>
      ) : null}

      <section id="learn-paths" className="scroll-mt-24 rounded-xl bg-cream p-3 shadow-[var(--shadow-border)] sm:p-4">
        <h2 className="font-display text-2xl tracking-wide">How you get it</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Every calling has a training film, the directions to the card, and the guidelines for the work.
          {you?.trade ? ` Yours, ${you.trade}, opens first.` : " Open any calling."} Any user can open any other.{" "}
          <Link to="/library" className="font-medium text-ink underline">
            The library
          </Link>
        </p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => {
              setPathGroup("all");
              setPathTrade("all");
              setPathId(null);
            }}
            className={cn(
              "h-9 rounded-full px-3 text-sm font-medium",
              pathGroup === "all" ? "bg-ink text-cream" : "bg-canvas text-muted-foreground",
            )}
          >
            All
          </button>
          {TRADE_GROUPS.map((g) => (
            <button
              key={g.id}
              type="button"
              onClick={() => chooseHall(g.id)}
              className={cn(
                "h-9 rounded-full px-3 text-sm font-medium",
                pathGroup === g.id ? "bg-ink text-cream" : "bg-canvas text-muted-foreground",
              )}
            >
              {g.label}
            </button>
          ))}
        </div>
        {pathGroup !== "all" ? (
          <div className="mt-3">
            <p className="mb-1.5 text-[11px] font-medium tracking-[0.16em] text-muted-foreground uppercase">
              {TRADE_GROUPS.find((g) => g.id === pathGroup)?.label}
            </p>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => chooseHall(pathGroup)}
                className={cn(
                  "h-9 rounded-full px-3 text-sm",
                  pathTrade === "all" ? "bg-ink text-cream" : "bg-canvas text-muted-foreground",
                )}
              >
                All in {TRADE_GROUPS.find((g) => g.id === pathGroup)?.label}
              </button>
              {TRADE_GROUPS.find((g) => g.id === pathGroup)?.trades.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => chooseTrade(t)}
                  className={cn(
                    "h-9 rounded-full px-3 text-sm",
                    pathTrade === t ? "bg-ink text-cream" : "bg-canvas text-muted-foreground",
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        ) : null}
        {(() => {
          if (pathGroup === "all") {
            return (
              <div className="mt-3 flex flex-col gap-4">
                {TRADE_GROUPS.map((g) => (
                  <div key={g.id}>
                    <p className="text-[11px] font-medium tracking-[0.16em] text-muted-foreground uppercase">{g.label}</p>
                    <ul className="mt-1">
                      {g.trades.map((t) => (
                        <li key={t} className="flex items-center justify-between gap-3 border-b border-ink/10 py-2 last:border-0">
                          <div className="min-w-0">
                            <p className="text-sm font-medium">{t}</p>
                            <p className="truncate text-xs text-muted-foreground">{BRIEFS[t].directions[0]}</p>
                          </div>
                          <button
                            type="button"
                            className="shrink-0 text-xs font-medium text-brick"
                            onClick={() => {
                              setPathGroup(g.id);
                              chooseTrade(t);
                            }}
                          >
                            Training
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            );
          }
          const rows = LEARN_PATHS.filter((p) => {
            if (pathTrade !== "all") return p.trade === pathTrade;
            return TRADE_GROUPS.find((g) => g.id === pathGroup)?.trades.includes(p.trade);
          });
          if (!rows.length) {
            return (
              <p className="mt-3 text-sm text-muted-foreground">That hall has no path yet.</p>
            );
          }
          const openPath = pathTrade === "all" ? null : rows[0];
          const shown = (openPath ? [openPath] : rows).slice().sort((a, b) => Number(b.trade === pathId) - Number(a.trade === pathId));
          const playing = shown.find((p) => p.trade === pathId && p.youtube);
          const lead = playing
            ? tradeFilms(playing.trade, posts, [...extraReels, ...seedReels], people, (yt, id) =>
                hallClipLive(yt, clipStatus, id),
              )[0]
            : undefined;
          return (
            <>
              {playing ? (
                <div id="learn-now-playing" className="mt-3 min-w-0 scroll-mt-28">
                  <p className="mb-1.5 text-[11px] font-medium tracking-[0.16em] text-muted-foreground uppercase">Training</p>
                  <LessonFrame
                    youtube={lead?.youtube || playing.youtube!}
                    title={lead?.title || playing.clip || playing.trade}
                    lines={lessonLines(playing)}
                  />
                  <CallingGuide trade={playing.trade} />
                </div>
              ) : null}
              <ul className="mt-3 flex flex-col gap-2">
                {shown.map((p) => (
                  <li key={p.trade} className="rounded-lg border border-ink/10 px-3 py-3">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="font-medium">{p.trade}</p>
                      {p.youtube ? (
                        <button
                          type="button"
                          className="shrink-0 text-xs font-medium text-brick"
                          onClick={() => setPathId(pathId === p.trade ? null : p.trade)}
                        >
                          {pathId === p.trade ? "Close" : "Presentation"}
                        </button>
                      ) : null}
                    </div>
                    <p className="mt-2 text-sm leading-relaxed">{p.steps}</p>
                    {playing?.trade === p.trade || pathTrade === "all" ? null : <CallingGuide trade={p.trade} />}
                    <p className="mt-3 text-[11px] text-muted-foreground">
                      {p.house}
                      {" · "}
                      <a href={p.href} className="underline" target="_blank" rel="noreferrer">
                        Where it is issued
                      </a>
                    </p>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      <a
                        href={LIBRARIES[p.trade].href}
                        className="font-medium text-ink underline"
                        target="_blank"
                        rel="noreferrer"
                        onClick={() => noteWatch("study", p.trade, LIBRARIES[p.trade].href)}
                      >
                        Paid · {LIBRARIES[p.trade].house}
                      </a>
                      {" · "}
                      {LIBRARIES[p.trade].seat}
                    </p>
                  </li>
                ))}
              </ul>
            </>
          );
        })()}
      </section>

      {[
        { title: you?.trade ? `${you.trade}` : copy.yours, rows: show(mine) },
        { title: copy.also, rows: show(hall) },
      ].map((shelf) =>
        shelf.rows.length ? (
          <section key={shelf.title} className="rounded-xl bg-cream p-4 shadow-[var(--shadow-border)]">
            <h2 className="font-display text-2xl tracking-wide">{shelf.title}</h2>
            {(() => {
              const open = shelf.rows.find((c) => c.id === courseId);
              return open ? (
                <div id="learn-course-player" className="mt-3 scroll-mt-24">
                  <YoutubeClip id={open.youtube} title={open.title} bare soundOnView social className="mx-auto w-full max-w-sm" />
                  <p className="mt-2 text-sm font-medium">{open.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {open.by} · vetted
                  </p>
                </div>
              ) : null;
            })()}
            <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {shelf.rows.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => setCourseId(courseId === c.id ? null : c.id)}
                    className={cn(
                      "w-full overflow-hidden rounded-lg bg-cream text-left shadow-[var(--shadow-border)]",
                      courseId === c.id && "ring-2 ring-ink",
                    )}
                  >
                  <div className="relative aspect-[16/10] overflow-hidden bg-canvas">
                    <img src={c.image} alt="" className="size-full object-cover" />
                    <span className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-ink/70 to-transparent" />
                    <span className="pointer-events-none absolute inset-x-3 bottom-2 font-display text-lg leading-none tracking-wide text-cream">
                      {c.topic}
                    </span>
                  </div>
                  <div className="px-2.5 py-2">
                    <p className="truncate text-sm font-medium">{c.title}</p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      {c.by}
                      {c.minutes ? ` · ${minutesLabel(c.minutes)}` : ""}
                    </p>
                  </div>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ) : null,
      )}

      <section className="rounded-xl bg-cream p-4 shadow-[var(--shadow-border)]">
        <h2 className="font-display text-2xl tracking-wide">Sheets</h2>
        <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {[
            {
              id: "g-01",
              title: "Before you open it",
              meta: "Three checks",
              face: (
                <div className="flex h-full flex-col justify-between bg-[#f4efe6] p-3 text-ink">
                  <p className="text-xs font-medium tracking-wide uppercase">List</p>
                  <p className="font-display text-5xl leading-none text-brick">01</p>
                  <p className="text-xs">Lock out. Prove it dead. Then open.</p>
                </div>
              ),
            },
            {
              id: "g-scheme",
              title: "Who can vouch",
              meta: "The scheme",
              face: (
                <div className="flex h-full flex-col justify-end bg-ink p-3 text-cream">
                  <p className="font-display text-3xl leading-none tracking-wide">Scheme</p>
                  <p className="mt-2 text-xs text-cream/70">Worked the job. Then the vouch.</p>
                </div>
              ),
            },
            {
              id: "g-time",
              title: "Apprentice to master",
              meta: "A timeline",
              face: (
                <div className="flex h-full flex-col justify-between bg-[#1c1c1c] p-3 text-cream">
                  <p className="font-display text-3xl leading-none">Timeline</p>
                  <div className="flex items-center gap-2 text-[11px] text-cream/80">
                    <span>Year 1</span>
                    <span className="h-px flex-1 bg-brick" />
                    <span>Card</span>
                  </div>
                </div>
              ),
            },
            {
              id: "g-two",
              title: "Broker or adviser",
              meta: "Two seats",
              face: (
                <div className="grid h-full grid-cols-2">
                  <div className="flex flex-col justify-end bg-[#d8d2c4] p-2 text-xs text-ink">
                    <span className="font-medium">Broker</span>
                    <span>Paid per trade</span>
                  </div>
                  <div className="flex flex-col justify-end bg-brick p-2 text-xs text-cream">
                    <span className="font-medium">Adviser</span>
                    <span>Paid on the account</span>
                  </div>
                </div>
              ),
            },
            {
              id: "g-doc",
              title: "What sits on the card",
              meta: "One page",
              face: (
                <div className="h-full bg-cream p-3 text-[10px] leading-relaxed text-ink">
                  <p className="border-b border-ink/20 pb-1 font-medium">The card</p>
                  <p className="mt-2">License. Hours. Who vouched. What you can sit tomorrow.</p>
                </div>
              ),
            },
          ].map((g) => (
            <li key={g.id} className="overflow-hidden rounded-lg bg-cream shadow-[var(--shadow-border)]">
              <div className="aspect-[16/10]">{g.face}</div>
              <div className="px-2.5 py-2">
                <p className="truncate text-sm font-medium">{g.title}</p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">{g.meta}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-xl bg-cream p-4 shadow-[var(--shadow-border)]">
        <h2 className="font-display text-2xl tracking-wide">Houses</h2>
        <p className="mt-1 text-xs text-muted-foreground">One lecture at a time. Stamped {HOUSE_NAME}. Not on Shop talk.</p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {TRACKS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTrack(t.id)}
              className={cn(
                "h-9 rounded-full px-3 text-sm font-medium",
                track === t.id ? "bg-ink text-cream" : "bg-canvas text-muted-foreground",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
        {open?.youtube ? (
          <div id="learn-lecture-player" className="mt-3 scroll-mt-24">
            <WorkFrame serial={workSerial(open.id)} stamp={HOUSE_NAME} wellClassName="aspect-[9/16]">
              <YoutubeClip id={open.youtube} headline={stripHouse(open.headline)} title={open.headline} bare social />
            </WorkFrame>
            <p className="mt-2 text-sm font-medium">{stripHouse(open.headline)}</p>
            <button type="button" className="mt-1 text-xs text-brick hover:underline" onClick={() => setOpenId(null)}>
              Close lecture
            </button>
          </div>
        ) : null}
        <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {[...lectures]
            .sort((a, b) => {
              const picked = TRADE_GROUPS.find((g) => g.id === pathGroup)?.trades ?? [];
              const score = (id: string) => {
                const trade = personById(people, id)?.trade;
                if (!trade) return 2;
                if (pathTrade !== "all" && trade === pathTrade) return 0;
                if (pathGroup !== "all" && picked.includes(trade)) return 1;
                return 2;
              };
              return score(a.authorId) - score(b.authorId) || tradeRank(personById(people, a.authorId)?.trade || "", a.id) - tradeRank(personById(people, b.authorId)?.trade || "", b.id);
            })
            .slice(0, 12)
            .map((p) => {
            const who = personById(people, p.authorId);
            const on = p.id === openId;
            return (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => setOpenId(on ? null : p.id)}
                  className="w-full overflow-hidden rounded-lg bg-canvas text-left"
                >
                  <img src={p.photo} alt="" className="aspect-video w-full object-cover" />
                  <span className="block truncate px-2 py-1.5 text-xs font-medium">
                    {stripHouse(p.headline) || who?.name}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
        {lectures.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">The desk is pulling houses. Sit a lesson below meanwhile.</p>
        ) : null}
      </section>

      <section className="rounded-xl bg-cream p-4 shadow-[var(--shadow-border)]">
        <h2 className="font-display text-2xl tracking-wide">Teach me</h2>
        <ul className="mt-3 space-y-3">
          {lessons.map((l) => {
            const a = personById(people, l.authorId);
            const sat = satLessonIds.includes(l.id);
            return (
              <li key={l.id} className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">{l.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {a?.name} · {l.minutes} min · {l.topic}
                    {sat ? " · sat" : ""}
                  </p>
                </div>
                <Button
                  variant={sat ? "ink" : "outline"}
                  size="sm"
                  onClick={() => {
                    sitLesson(l.id);
                    toast(`Sat ${l.title}.`);
                  }}
                >
                  {sat ? "Sat" : "Sit it"}
                </Button>
              </li>
            );
          })}
        </ul>
      </section>
      <section className="rounded-xl bg-cream p-4 shadow-[var(--shadow-border)]">
        <h2 className="font-display text-2xl tracking-wide">Training marketplace</h2>
        <ul className="mt-3 space-y-3">
          {trainings.map((t) => (
            <li key={t.id} className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium">{t.title}</p>
                <p className="text-xs text-muted-foreground">
                  {t.place} · {t.when} · {t.tickets.join(", ")}
                </p>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link to="/events">See the calendar</Link>
              </Button>
            </li>
          ))}
        </ul>
      </section>
      <p className="text-xs text-muted-foreground">
        Then{" "}
        <Link to="/challenges" className="text-brick hover:underline">
          prove it
        </Link>
        , claim{" "}
        <Link to="/fund" className="text-brick hover:underline">
          funding
        </Link>
        , or take a call.
      </p>
    </div>
  );
}

function TopicSit({
  topic,
  seat,
  sat,
  onSit,
}: {
  topic: string;
  seat: {
    youtube?: string;
    title: string;
    line: string;
    lessonId?: string;
    trainingId?: string;
    trade?: Trade;
    points?: string[];
  } | null;
  sat: boolean;
  onSit: (id: string, title: string) => void;
}) {
  const training = seat?.trainingId ? trainings.find((t) => t.id === seat.trainingId) : undefined;
  return (
    <section id="learn-topic" className="scroll-mt-24 rounded-xl bg-cream p-3 shadow-[var(--shadow-border)] sm:p-4">
      <p className="text-[11px] font-medium tracking-[0.16em] text-muted-foreground uppercase">{topic}</p>
      <p className="mt-2 font-medium">{seat?.title ?? `Nothing is filed under ${topic} yet.`}</p>
      {seat ? <p className="mt-1 text-sm leading-relaxed">{seat.line}</p> : null}
      {seat?.points?.length ? (
        <ol className="mt-3 list-decimal space-y-1.5 pl-4 text-sm leading-relaxed">
          {seat.points.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ol>
      ) : null}
      {seat?.youtube ? (
        <div className="mt-3">
          <YoutubeClip id={seat.youtube} title={seat.title} bare soundOnView className="w-full" />
        </div>
      ) : null}
      {training ? (
        <p className="mt-2 text-xs text-muted-foreground">
          {training.place} · {training.when}
        </p>
      ) : null}
      {seat?.lessonId ? (
        <Button
          className="mt-3"
          variant={sat ? "ink" : "outline"}
          size="sm"
          onClick={() => onSit(seat.lessonId!, seat.title)}
        >
          {sat ? "Sat" : "Sit it"}
        </Button>
      ) : null}
      {seat?.trade ? <CallingGuide trade={seat.trade} /> : null}
    </section>
  );
}

function lessonLines(path: { trade: Trade; steps: string }) {
  const written = FILM_READ[path.trade];
  if (written) return written;
  return path.steps
    .split(/(?<=\.)\s+/)
    .flatMap((sentence) => {
      const line = sentence.trim();
      if (line.length < 88) return line ? [line] : [];
      return line
        .split(/,\s+(?=then\b)/i)
        .map((part) => part.trim())
        .filter(Boolean);
    });
}

const FILM_READ: Partial<Record<Trade, string[]>> = {
  HVAC: [
    "What it is. A packaged unit on the roof that heats and cools.",
    "Where. A flat roof and a duct run: stores, schools, clinics.",
    "How. It conditions the air. The fan sends that air down the ducts.",
    "Types. Fresh air. Recirculating. Heat wheel.",
    "Inside. Heat exchanger, filters, fans, ducts, grille, hood.",
  ],
};

function LessonFrame({ youtube, title, lines }: { youtube: string; title: string; lines: string[] }) {
  const [film, setFilm] = useState(false);
  return (
    <div className="min-w-0 max-w-full rounded-lg bg-ink text-cream">
      <div className="px-4 py-4 sm:px-5 sm:py-5">
        <h3 className="font-display text-3xl leading-tight tracking-wide text-pretty sm:text-4xl">{title}</h3>
        <ul className="mt-4 space-y-3 text-base leading-relaxed">
          {lines.map((line) => (
            <li key={line} className="border-l-2 border-cream/40 pl-3 text-pretty">
              {line}
            </li>
          ))}
        </ul>
        <button
          type="button"
          className="mt-4 h-10 rounded-full bg-cream px-4 text-sm font-medium text-ink"
          onClick={() => setFilm((v) => !v)}
        >
          {film ? "Hide the film" : "Play the film"}
        </button>
      </div>
      {film ? (
        <div className="min-w-0 max-w-full">
          <YoutubeClip id={youtube} title={title} bare soundOnView className="w-full min-w-0" />
        </div>
      ) : null}
    </div>
  );
}

function CallingGuide({ trade }: { trade: Trade }) {
  const brief = BRIEFS[trade];
  return (
    <div className="mt-4 flex flex-col gap-5">
      <div>
        <p className="text-[11px] font-medium tracking-[0.16em] text-muted-foreground uppercase">Directions</p>
        <ol className="mt-2 list-decimal space-y-2 pl-5 text-base leading-relaxed">
          {brief.directions.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ol>
      </div>
      <div>
        <p className="text-[11px] font-medium tracking-[0.16em] text-muted-foreground uppercase">Guidelines</p>
        <ul className="mt-2 list-disc space-y-2 pl-5 text-base leading-relaxed">
          {brief.guidelines.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
