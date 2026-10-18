import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ImageIcon, Video, X } from "lucide-react";
import { FirstLoop } from "@/components/first-loop";
import { ForYou } from "@/components/for-you";
import { QualifyStrip } from "@/components/qualify-strip";
import { ShopsHiring } from "@/components/shops-hiring";
import { IdentityBench } from "@/components/identity-bench";
import { LineTrigger } from "@/components/line-compose";
import { LiveTalk } from "@/components/live-talk";
import { Dictate } from "@/components/dictate";
import { Portrait } from "@/components/portrait";
import { PostCard } from "@/components/post-card";
import { TradeDesk } from "@/components/trade-desk";
import { WorkWheel } from "@/components/work-wheel";
import { QuietBound } from "@/lib/error-component";
import { YourMorning } from "@/components/your-morning";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { hallRoster } from "@/lib/example";
import { dnaAdjacent, talkRank } from "@/lib/intel";
import { hallClipLive, isLecturePost, isLectureReel, isSyncedTalk } from "@/lib/clip-ingest";
import { tradeRank } from "@/lib/trade-shuffle";
import { hallEnglish } from "@/lib/hall-lang";
import { boardState, matchesBoard, parseBoardSearch } from "@/lib/board";
import { groupOf, hallLabel } from "@/lib/scope";
import { personById, useForge } from "@/lib/store";
import type { PostKind } from "@/lib/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  validateSearch: parseBoardSearch,
  component: ShopTalk,
});

const FILTERS: { id: "yours" | "all"; label: string }[] = [
  { id: "yours", label: "Your hall" },
  { id: "all", label: "Look around" },
];

const STILLS = [
  { src: "/sites/panel.jpg", label: "Panel" },
  { src: "/sites/hospital.jpg", label: "Floor" },
  { src: "/sites/weld.jpg", label: "Weld" },
  { src: "/sites/hvac.jpg", label: "HVAC" },
  { src: "/sites/classroom.jpg", label: "Classroom" },
];

function ShopTalk() {
  const posts = useForge((s) => s.posts);
  const people = useForge((s) => s.people);
  const youId = useForge((s) => s.youId);
  const you = personById(people, youId);
  const createPost = useForge((s) => s.createPost);
  const setAvailability = useForge((s) => s.setAvailability);
  const introDismissed = useForge((s) => s.introDismissed);
  const dismissIntro = useForge((s) => s.dismissIntro);
  const invites = useForge((s) => s.invites);
  const inviteStatus = useForge((s) => s.inviteStatus);
  const answerInvite = useForge((s) => s.answerInvite);
  const startThread = useForge((s) => s.startThread);
  const pendingInvites = invites.filter((i) => (inviteStatus[i.id] ?? "pending") === "pending");
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["id"]>("yours");
  const [draft, setDraft] = useState("");
  const [kind, setKind] = useState<PostKind>("talk");
  const [still, setStill] = useState<string | undefined>();
  const [pickStill, setPickStill] = useState(false);
  const [live, setLive] = useState(false);
  const board = boardState(Route.useSearch());
  const ticketLocked = board.trade !== "all" || board.group !== "all";
  const pulledPostIds = useForge((s) => s.pulledPostIds);
  const boardStatus = useForge((s) => s.boardStatus);
  const extraReels = useForge((s) => s.extraReels);
  const clipStatus = useForge((s) => s.clipStatus);

  useEffect(() => {
    const hash = window.location.hash.replace(/^#/, "");
    if (!hash) return;
    setFilter("all");
    const t = window.setTimeout(() => {
      document.getElementById(hash)?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 80);
    return () => window.clearTimeout(t);
  }, []);

  const visible = useMemo(() => {
    const live = new Set(hallRoster(people).map((p) => p.id));
    const haveYt = new Set(posts.map((p) => p.youtube).filter(Boolean));
    const fromWheel = extraReels
      .filter(
        (r) =>
          r.youtube &&
          !haveYt.has(r.youtube) &&
          !isLectureReel(r) &&
          hallClipLive(r.youtube, clipStatus, r.id),
      )
      .map(
        (r) =>
          ({
            id: `in-${r.youtube}`,
            authorId: r.personId,
            kind: r.kind === "safety" ? "safety" : "work",
            headline: r.title,
            body: r.caption,
            youtube: r.youtube,
            photo: r.still,
            createdAt: r.createdAt,
            likes: r.likes,
            comments: [],
          }) as (typeof posts)[number],
      );
    const list = [...fromWheel, ...posts].filter((p) => {
      const author = personById(people, p.authorId);
      const synced = isSyncedTalk(p) || Boolean(p.youtube && String(p.id).startsWith("in-"));
      if (pulledPostIds.includes(p.id)) return false;
      if (isLecturePost(p)) return false;
      if (!hallClipLive(p.youtube, clipStatus, p.id)) return false;
      if (author && boardStatus[author.id] === "suspended") return false;
      if (!hallEnglish(p.body, p.headline, author?.name)) return false;
      if (!synced && author && !live.has(author.id)) return false;
      if (author?.trade && !matchesBoard(author.trade, board.group, board.trade)) return false;
      if (!author && !synced) return false;
      if (filter === "yours") {
        if (!you) return false;
        if (author && (author.trade === you.trade || dnaAdjacent(you, author))) return true;
        return Boolean(synced && author && groupOf(author.trade) === groupOf(you.trade));
      }
      return true;
    });
    return [...list].sort((a, b) => {
      const aa = personById(people, a.authorId);
      const ba = personById(people, b.authorId);
      if (filter === "yours" && you) {
        const d = talkRank(b, you, ba) - talkRank(a, you, aa);
        if (Math.abs(d) > 8) return d;
      }
      const as = isSyncedTalk(a) ? 1 : 0;
      const bs = isSyncedTalk(b) ? 1 : 0;
      if (as !== bs) return bs - as;
      return tradeRank(aa?.trade || "hall", a.id) - tradeRank(ba?.trade || "hall", b.id);
    });
  }, [
    posts,
    extraReels,
    filter,
    people,
    you,
    pulledPostIds,
    boardStatus,
    board.group,
    board.trade,
    ticketLocked,
    clipStatus,
  ]);

  return (
    <div className="flex flex-col gap-4">
      <div className="lg:hidden">
        <IdentityBench compact />
      </div>

      {!introDismissed ? (
        <section className="relative overflow-hidden rounded-2xl bg-ink px-5 py-5 text-cream rise-in">
          <button
            type="button"
            onClick={dismissIntro}
            className="absolute top-2 right-2 rounded-md p-2 text-cream/60 hover:bg-cream/10 hover:text-cream"
            aria-label="Dismiss"
          >
            <X className="size-4" />
          </button>
          <p className="font-display text-2xl tracking-wide sm:text-3xl">Prove what you can do.</p>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-cream/75">
            Certified to do. Actually done. Who will vouch. Available when. The card for trades, care, classrooms, and those who served.
          </p>
          <p className="mt-3 text-xs tracking-wide text-cream/50">
            {you
              ? `You are ${you.name}${you.trade ? `, ${you.trade.toLowerCase()}` : ""}${you.city ? `, ${you.city}` : ""}.`
              : "Sign in so the card is yours — not a placeholder."}
          </p>
        </section>
      ) : null}

      <QuietBound>
        <WorkWheel />
      </QuietBound>

      <div className="chip-row -mx-3 px-3 sm:mx-0 sm:px-0">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id)}
            className={cn(
              "h-9 shrink-0 rounded-full px-3.5 text-sm font-medium transition-colors duration-150",
              filter === f.id
                ? "bg-ink text-cream"
                : "bg-cream text-muted-foreground hover:text-ink",
            )}
          >
            {f.id === "yours" && you ? hallLabel(you.trade) : f.label}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-4">
        {visible.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
        {visible.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">Nothing in this lane yet.</p>
        ) : null}
      </div>

      {pendingInvites.length ? (
        <section className="rounded-xl bg-cream p-4 shadow-[var(--shadow-border)]">
          <div className="flex items-baseline justify-between gap-2">
            <h2 className="font-display text-2xl tracking-wide">Wants on your hall</h2>
            <Link to="/hall" className="text-xs text-brick hover:underline">
              All
            </Link>
          </div>
          <ul className="mt-3 flex flex-col gap-3">
            {pendingInvites
              .filter((inv, i, all) => all.findIndex((x) => x.fromId === inv.fromId) === i)
              .slice(0, 3)
              .map((inv) => {
              const who = personById(people, inv.fromId);
              if (!who) return null;
              return (
                <li key={inv.id} className="flex items-start gap-3">
                  <Portrait person={who} size="lg" link={false} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{who.name}</p>
                    <p className="text-xs text-muted-foreground">{inv.why}</p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        answerInvite(inv.id, "passed");
                      }}
                    >
                      Pass
                    </Button>
                    <Button
                      size="sm"
                      variant="ink"
                      onClick={() => {
                        answerInvite(inv.id, "accepted");
                        if (inv.kind === "intro" || inv.kind === "crew") startThread(who.id, "");
                      }}
                    >
                      Take
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      <YourMorning />

      {ticketLocked ? <TradeDesk group={board.group} trade={board.trade} /> : <TradeDesk group={board.group} trade={board.trade} compact />}

      <p className="px-1 text-xs text-muted-foreground">
        University and research lectures sit on{" "}
        <Link to="/learn" className="text-brick hover:underline">
          Learn
        </Link>
        — not in this feed.
      </p>

      <QualifyStrip />

      <ShopsHiring />

      <FirstLoop />

      <ForYou />

      {live ? <LiveTalk onDone={() => setLive(false)} /> : null}

      <form
        className="rounded-2xl bg-white p-5 shadow-[0_1px_2px_rgba(26,24,20,0.04),0_0_0_1px_rgba(26,24,20,0.06)] rise-in rise-in-2"
        onSubmit={(e) => {
          e.preventDefault();
          createPost(draft, kind, still);
          setDraft("");
          setStill(undefined);
          setPickStill(false);
          setKind("talk");
        }}
      >
        <div className="flex items-start gap-3">
          {you ? <Portrait person={you} size="sm" link={false} /> : null}
          <div className="min-w-0 flex-1">
            <label htmlFor="compose" className="sr-only">
              What's happening on the job
            </label>
            <Textarea
              id="compose"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={
                kind === "brief"
                  ? "A briefing: NEC change, unit protocol, what the crew needs to know."
                  : "A call, a warning, a finished panel, a night shift — keep it real."
              }
              className={kind === "brief" ? "min-h-28 bg-canvas" : "min-h-16 bg-canvas"}
            />
          </div>
        </div>
        {still ? (
          <div className="relative mt-3 overflow-hidden rounded-lg">
            <img src={still} alt="" className="aspect-[5/2] w-full object-cover" />
            <button
              type="button"
              className="absolute top-2 right-2 rounded-md bg-ink/70 p-1 text-cream"
              onClick={() => setStill(undefined)}
              aria-label="Remove still"
            >
              <X className="size-4" />
            </button>
          </div>
        ) : null}
        {pickStill ? (
          <div className="mt-3 flex gap-2 overflow-x-auto">
            {STILLS.map((s) => (
              <button
                key={s.src}
                type="button"
                onClick={() => {
                  setStill(s.src);
                  setPickStill(false);
                  if (kind === "talk") setKind("work");
                }}
                className="shrink-0"
              >
                <img src={s.src} alt={s.label} className="h-16 w-24 rounded-md object-cover" />
              </button>
            ))}
          </div>
        ) : null}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setPickStill((v) => !v)}
            className={cn(
              "inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-sm",
              pickStill || still ? "bg-ink text-cream" : "bg-canvas text-muted-foreground",
            )}
          >
            <ImageIcon className="size-3.5" />
            Still
          </button>
          <Dictate onText={(t) => setDraft((d) => (d ? `${d} ${t}` : t))} />
          <button
            type="button"
            onClick={() => setLive((v) => !v)}
            className={cn(
              "inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-sm",
              live ? "bg-ink text-cream" : "bg-canvas text-muted-foreground",
            )}
          >
            <Video className="size-3.5" />
            {live ? "Close live" : "Go live"}
          </button>
          <LineTrigger variant="bar" />
          {you ? (
            <button
              type="button"
              onClick={() => {
                const open = you.availability === "open";
                setAvailability(open ? "on-job" : "open");
              }}
              className={cn(
                "inline-flex h-9 items-center rounded-full px-3 text-sm",
                you.availability === "open" ? "bg-ok/15 text-ok" : "bg-canvas text-muted-foreground",
              )}
            >
              {you.availability === "open" ? "Open to calls" : "I'm available"}
            </button>
          ) : null}
          <Button variant="outline" className="h-9 rounded-full px-3" asChild>
            <Link to="/reels" search={{ post: true }}>
              Reel
            </Link>
          </Button>
          {(
            [
              ["talk", "Talk"],
              ["brief", "Brief"],
              ["work", "On the tools"],
              ["safety", "Safety"],
              ["call", "Looking"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setKind(id)}
              className={cn(
                "h-9 rounded-full px-3 text-sm",
                kind === id ? "bg-ink text-cream" : "bg-canvas text-muted-foreground",
              )}
            >
              {label}
            </button>
          ))}
          <Button className="w-full sm:ml-auto sm:w-auto" type="submit" disabled={!draft.trim()}>
            Post
          </Button>
        </div>
      </form>
    </div>
  );
}
