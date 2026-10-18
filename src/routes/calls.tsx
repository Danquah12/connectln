import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { CallCard } from "@/components/call-card";
import { CrewWatch } from "@/components/crew-watch";
import { ShopLock, useShopSeat } from "@/components/shop-lock";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { seatOf } from "@/lib/calling";
import { boardSearchOf, parseBoardSearch } from "@/lib/board";
import { isExampleCall } from "@/lib/example";
import { groupOf } from "@/lib/scope";
import { pullOpenings } from "@/lib/job-wire";
import { fitScore } from "@/lib/fit";
import { HOUSE_BILL, TAKE } from "@/lib/money";
import { personById, useForge } from "@/lib/store";
import { TRADE_GROUPS } from "@/lib/seed";
import { TRUEPLACE, trueHomes } from "@/lib/trueplace-homes";
import { MONEY_GROUPS, moneyClips, type MoneyClip, type MoneyGroup } from "@/lib/money-hall";
import { YoutubeClip } from "@/components/youtube-clip";
import type { CrewCall, FieldGroup, Person, Trade } from "@/lib/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/calls")({
  validateSearch: parseBoardSearch,
  component: CallsPage,
});

function ProgramCard({
  lead,
  image,
  kicker,
  title,
  points,
  foot,
  href,
}: {
  lead: string;
  image: string;
  kicker: string;
  title: string;
  points: string[];
  foot: string;
  href: string;
}) {
  return (
    <article className="overflow-hidden rounded-xl bg-cream shadow-[var(--shadow-border)]">
      <p className="px-4 pt-4 text-sm leading-relaxed text-ink">{lead}</p>
      <a href={href} target="_blank" rel="noreferrer" className="relative mt-3 block">
        <img src={image} alt="" className="aspect-[5/3] w-full object-cover" />
        <span className="absolute inset-0 bg-ink/60" />
        <span className="absolute inset-0 flex flex-col justify-end p-5 text-cream">
          <span className="text-xs font-medium tracking-[0.16em] uppercase">{kicker}</span>
          <span className="mt-1 font-display text-4xl leading-none tracking-wide">{title}</span>
          <ul className="mt-3 space-y-1 text-sm">
            {points.map((point) => (
              <li key={point}>· {point}</li>
            ))}
          </ul>
        </span>
      </a>
      <p className="px-4 pt-3 text-sm text-ink">{foot}</p>
      <a href={href} target="_blank" rel="noreferrer" className="block py-3 text-center text-sm font-medium text-ink">
        Learn more
      </a>
    </article>
  );
}

function MoneyBrief({ clip, mode }: { clip: MoneyClip; mode: "lead" | "split" | "talk" | "news" }) {
  const [more, setMore] = useState(false);
  const cut = clip.blurb.indexOf(". ");
  const top = cut > 0 ? clip.blurb.slice(0, cut + 1) : clip.blurb;
  const rest = cut > 0 ? clip.blurb.slice(cut + 2) : "";
  return (
    <article data-feed-post="" className="overflow-hidden rounded-xl bg-cream shadow-[var(--shadow-border)]">
      <div className="px-4 pt-4">
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          {clip.group} · {clip.source}
        </p>
        {mode === "lead" ? (
          <>
            <p className="mt-2 text-sm leading-relaxed text-ink/80">{clip.title}</p>
            <p className="mt-3 font-display text-3xl leading-[1.05] tracking-wide text-ink">{clip.blurb}</p>
          </>
        ) : (
          <p className="mt-2 text-sm leading-relaxed text-ink">
            {clip.title}. {more || !rest ? clip.blurb : top}{" "}
            {rest && !more ? (
              <button type="button" className="font-medium" onClick={() => setMore(true)}>
                more
              </button>
            ) : null}
          </p>
        )}
      </div>
      <div className={cn("mt-4", mode === "talk" && "mx-auto max-w-sm")}>
        <YoutubeClip
          id={clip.youtube}
          title={clip.title}
          bare
          soundOnView
          portrait={mode === "talk"}
          spoken={mode === "talk" ? clip.blurb : undefined}
          plate={mode === "talk" ? clip.source : undefined}
          banner={mode === "news" ? { mark: clip.source, title: clip.title, line: clip.group } : undefined}
          className="w-full"
        />
      </div>
      {mode === "split" && rest ? (
        <p className="bg-ink px-4 py-5 font-display text-3xl leading-[1.02] tracking-wide text-cream">{rest}</p>
      ) : null}
      <a href={clip.page} target="_blank" rel="noreferrer" className="block px-4 py-3 text-sm font-medium hover:bg-canvas">
        Open the {clip.source} record
      </a>
    </article>
  );
}

function CallsPage() {
  const calls = useForge((s) => s.calls);
  const people = useForge((s) => s.people);
  const vouches = useForge((s) => s.vouches);
  const you = personById(people, useForge((s) => s.youId));
  const postCall = useForge((s) => s.postCall);
  const ingestWire = useForge((s) => s.ingestWire);
  const shop = useShopSeat();
  const [posting, setPosting] = useState(false);
  const [moneyPick, setMoneyPick] = useState<MoneyGroup | "all">("all");
  const [title, setTitle] = useState("");
  const [rate, setRate] = useState(you?.rate ?? "");
  const [start, setStart] = useState("This week");
  const [spots, setSpots] = useState("2");
  const [blurb, setBlurb] = useState("");
  const [urgent, setUrgent] = useState(false);
  const [apprentice, setApprentice] = useState(false);
  const savedCallIds = useForge((s) => s.savedCallIds);
  const appliedCallIds = useForge((s) => s.appliedCallIds);
  const callHands = useForge((s) => s.callHands);
  const callHires = useForge((s) => s.callHires);
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/calls" });
  const [picked, setPicked] = useState<{ group: FieldGroup; trade: Trade | "all" } | null>(null);
  const hallId: FieldGroup =
    picked?.group ??
    (search.group ? search.group : you ? groupOf(you.trade) : "trades");
  const hall = TRADE_GROUPS.find((g) => g.id === hallId) ?? TRADE_GROUPS[0];
  const calling: Trade | "all" =
    picked?.trade ?? (search.trade && groupOf(search.trade) === hall.id ? search.trade : "all");

  useEffect(() => {
    let alive = true;
    void pullOpenings()
      .then((rows) => {
        if (alive && rows.length) ingestWire(rows);
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [ingestWire]);

  function setBoard(nextGroup: FieldGroup, nextTrade: Trade | "all") {
    setPicked({ group: nextGroup, trade: nextTrade });
    const next = boardSearchOf(nextGroup, nextTrade);
    void navigate({ search: { trade: next.trade, group: next.group } });
  }

  const hallSeats = useMemo(() => {
    return calls.flatMap((c) => {
      if (isExampleCall(c) || !(c.wire || c.postedBy)) return [];
      const seat = seatOf(c);
      if (!seat || groupOf(seat) !== hall.id) return [];
      return [{ call: { ...c, trade: seat }, seat }];
    });
  }, [calls, hall.id]);

  const seated = useMemo(
    () => (calling === "all" ? hallSeats : hallSeats.filter((row) => row.seat === calling)),
    [hallSeats, calling],
  );

  const ranked = useMemo(() => {
    return seated
      .map(({ call, seat }) => ({
        call,
        seat,
        fit: you ? fitScore(you, call, vouches) : null,
        hands: (callHands[call.id] ?? []).length,
        hired: (callHires[call.id] ?? []).length,
        mine: call.postedBy === you?.id,
      }))
      .sort((a, b) => {
        if (a.mine !== b.mine) return a.mine ? -1 : 1;
        if (Boolean(a.call.urgent) !== Boolean(b.call.urgent)) return a.call.urgent ? -1 : 1;
        return (b.fit?.score ?? 0) - (a.fit?.score ?? 0);
      });
  }, [seated, you, vouches, callHands, callHires]);

  const qualifyN = ranked.filter((r) => r.seat === you?.trade && r.fit && !r.fit.blocked).length;
  const closeN = ranked.filter((r) => r.seat === you?.trade).length;
  const sosN = ranked.filter((r) => r.call.urgent).length;
  const appN = ranked.filter((r) => r.call.apprentice || /apprentice/i.test(r.call.title)).length;
  const mineN = ranked.filter((r) => r.mine).length;
  const handsN = ranked.reduce((n, r) => n + (r.mine ? r.hands : 0), 0);
  const sections = (calling === "all" ? hall.trades : [calling]).filter((seat) => ranked.some((r) => r.seat === seat));

  return (
    <div className="flex flex-col gap-4">
      <header>
        <p className="text-[11px] font-medium tracking-[0.16em] text-muted-foreground uppercase">Hiring desk</p>
        <h1 className="font-display text-4xl tracking-wide">Calls</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {shop
            ? "Post a seat. Rank hands by tickets. Hire writes a fill receipt."
            : "One hall at a time. A listing stays only when the job title is that calling."}
        </p>
        {you ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {shop ? (
              <Button variant="ink" onClick={() => setPosting((v) => !v)}>
                {posting ? "Close" : "Post a call"}
              </Button>
            ) : (
              <Button variant="ink" asChild>
                <Link to="/packages">Shop board to post</Link>
              </Button>
            )}
            <Button variant="outline" asChild>
              <Link to="/find">Find crew</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/hands">Hands</Link>
            </Button>
          </div>
        ) : null}
      </header>

      <CallBrief
        shop={shop}
        you={you}
        qualify={qualifyN}
        close={closeN}
        sos={sosN}
        mine={mineN}
        hands={handsN}
        applied={appliedCallIds.length}
      />

      {posting && you && shop ? (
        <form
          className="flex flex-col gap-3 rounded-xl bg-cream p-4 shadow-[var(--shadow-border)]"
          onSubmit={(e) => {
            e.preventDefault();
            if (!title.trim()) return;
            postCall({
              title: title.trim(),
              rate: rate.trim() || "Shop scale",
              start: start.trim() || "This week",
              duration: "As posted",
              description: blurb.trim() || title.trim(),
              spots: Number(spots) || 2,
              tickets: you.tickets.slice(0, 3).map((t) => t.name),
              urgent,
              apprentice,
            });
            setTitle("");
            setBlurb("");
            setUrgent(false);
            setApprentice(false);
            setPosting(false);
            toast(`Call is up. ${HOUSE_BILL} billed $${urgent ? TAKE.urgent : TAKE.listing} for the seat.`);
          }}
        >
          <p className="text-sm text-muted-foreground">
            Seat ${TAKE.listing} · SOS ${TAKE.urgent} · fill ${TAKE.fill} when you hire. {HOUSE_BILL}.
          </p>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Need two on the hospital panel" required />
          <div className="grid grid-cols-3 gap-2">
            <Input value={rate} onChange={(e) => setRate(e.target.value)} placeholder="$52/hr" />
            <Input value={start} onChange={(e) => setStart(e.target.value)} placeholder="Monday" />
            <Input value={spots} onChange={(e) => setSpots(e.target.value)} placeholder="Spots" />
          </div>
          <Textarea value={blurb} onChange={(e) => setBlurb(e.target.value)} placeholder="Shift, tickets, who to ask for." rows={3} />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={urgent} onChange={(e) => setUrgent(e.target.checked)} />
            SOS — bills ${TAKE.urgent}
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={apprentice} onChange={(e) => setApprentice(e.target.checked)} />
            Apprentice seat — paid indenture, not a résumé
          </label>
          <Button type="submit" variant="ink" disabled={!title.trim()}>
            Put it on the board · ${urgent ? TAKE.urgent : TAKE.listing}
          </Button>
        </form>
      ) : null}

      <section className="rounded-xl bg-cream p-3 shadow-[var(--shadow-border)] sm:p-4">
        <div className="flex flex-wrap gap-1.5">
          {TRADE_GROUPS.map((h) => (
            <button
              key={h.id}
              type="button"
              onClick={() => setBoard(h.id, "all")}
              className={cn(
                "h-9 rounded-full px-3 text-sm font-medium",
                hall.id === h.id ? "bg-ink text-cream" : "bg-canvas text-muted-foreground",
              )}
            >
              {h.label}
            </button>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {hall.id === "money" ? (
            <>
              <button
                type="button"
                onClick={() => setMoneyPick("all")}
                className={cn(
                  "h-9 rounded-full px-3 text-sm",
                  moneyPick === "all" ? "bg-ink text-cream" : "bg-canvas text-muted-foreground",
                )}
              >
                All in Money
              </button>
              {MONEY_GROUPS.map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setMoneyPick(g)}
                  className={cn(
                    "h-9 rounded-full px-3 text-sm",
                    moneyPick === g ? "bg-ink text-cream" : "bg-canvas text-muted-foreground",
                  )}
                >
                  {g}
                  <span className="ml-1 text-xs opacity-70">{moneyClips.filter((c) => c.group === g).length}</span>
                </button>
              ))}
            </>
          ) : (
            <>
          <button
            type="button"
            onClick={() => setBoard(hall.id, "all")}
            className={cn(
              "h-9 rounded-full px-3 text-sm",
              calling === "all" ? "bg-ink text-cream" : "bg-canvas text-muted-foreground",
            )}
          >
            All in {hall.label}
          </button>
          {hall.trades.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setBoard(hall.id, t)}
              className={cn(
                "h-9 rounded-full px-3 text-sm",
                calling === t ? "bg-ink text-cream" : "bg-canvas text-muted-foreground",
              )}
            >
              {t}
              <span className="ml-1 text-xs opacity-70">{hallSeats.filter((r) => r.seat === t).length}</span>
            </button>
          ))}
            </>
          )}
        </div>
      </section>

      {hall.id === "classroom" ? (
        <div className="flex flex-col gap-3">
          <ProgramCard
            lead="The campus is not a job listing. Courses, dining, and the board live on Digital Campus."
            image="/sites/classroom.jpg"
            kicker="University of Maryland"
            title="Digital Campus"
            points={["Courses on the schedule", "Dining and shuttles", "The campus board"]}
            foot="Teachers and faculty stay on this hall."
            href="https://portal.expediteconsults.com/umd"
          />
          <article className="overflow-hidden rounded-xl bg-cream shadow-[var(--shadow-border)]">
            <p className="px-4 pt-4 text-sm leading-relaxed text-ink">
              These are people on the University of Maryland campus board. The courses, dining, and shuttles are on Digital Campus.{" "}
              <a href="https://portal.expediteconsults.com/umd" target="_blank" rel="noreferrer" className="font-medium">
                more
              </a>
            </p>
            <div className="mt-3 grid grid-cols-3">
              {[
                ["Alex Ramos", "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&h=750&q=80"],
                ["Priya Sharma", "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=600&h=750&q=80"],
                ["Ethan Reed", "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&h=750&q=80"],
              ].map(([name, photo]) => (
                <img key={name} src={photo} alt={name} className="aspect-[3/4] w-full object-cover object-[center_18%]" />
              ))}
            </div>
            <p className="bg-ink px-4 py-5 font-display text-3xl leading-[1.02] tracking-wide text-cream">
              The campus board is the people. The campus itself opens on Digital Campus.
            </p>
            <p className="px-4 pt-3 text-sm text-ink">Amara Diallo and Elena Vasquez are on the board with them.</p>
            <a
              href="https://portal.expediteconsults.com/umd"
              target="_blank"
              rel="noreferrer"
              className="block py-3 text-center text-sm font-medium"
            >
              Learn more
            </a>
          </article>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
            {[
              ["Alex Ramos", "Computer Engineering '26", "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&h=750&q=80"],
              ["Priya Sharma", "Bioengineering '27", "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=600&h=750&q=80"],
              ["Ethan Reed", "Finance '26", "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&h=750&q=80"],
              ["Amara Diallo", "Campus board", "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&h=750&q=80"],
              ["Elena Vasquez", "Campus board", "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=600&h=750&q=80"],
            ].map(([name, line, photo]) => (
              <a
                key={name}
                href="https://portal.expediteconsults.com/umd"
                target="_blank"
                rel="noreferrer"
                className="overflow-hidden rounded-lg bg-canvas"
              >
                <img src={photo} alt="" className="aspect-[4/5] w-full object-cover object-[center_18%]" />
                <span className="block px-2 py-2">
                  <span className="block truncate text-sm font-medium">{name}</span>
                  <span className="block truncate text-xs text-muted-foreground">{line}</span>
                </span>
              </a>
            ))}
          </div>
        </div>
      ) : null}

      {hall.id === "money" ? (
        <section className="flex flex-col gap-3">
          <div>
            <p className="text-[11px] font-medium tracking-[0.16em] text-muted-foreground uppercase">Money</p>
            <h2 className="font-display text-2xl tracking-wide">
              {moneyPick === "all" ? "Advisor, banking, lending, insurance, tax" : moneyPick}
            </h2>
          </div>
          <p className="text-sm text-muted-foreground">
            These are the official clips. They are on the wheel. The link opens the SEC, FINRA, FDIC, NAIC, or IRS record.
          </p>
          <ProgramCard
            lead="A title on a card is not a license. The record says who may give advice."
            image="/reels/talk-grace.jpg"
            kicker="Money"
            title="Check the record"
            points={["SEC investment adviser", "FINRA broker", "FDIC bank"]}
            foot="The clips below say what each one does."
            href="https://www.investor.gov/"
          />
          <div className="flex flex-col gap-3">
            {moneyClips
              .filter((clip) => moneyPick === "all" || clip.group === moneyPick)
              .map((clip, i) => (
                <MoneyBrief key={clip.id} clip={clip} mode={(["lead", "split", "talk", "news"] as const)[i % 4]!} />
              ))}
          </div>
        </section>
      ) : hall.id === "homes" ? (
        <section className="flex flex-col gap-3">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-[11px] font-medium tracking-[0.16em] text-muted-foreground uppercase">TruePlace</p>
              <h2 className="font-display text-2xl tracking-wide">Homes</h2>
            </div>
            <a href={TRUEPLACE} target="_blank" rel="noreferrer" className="text-sm font-medium text-ink underline">
              Open TruePlace
            </a>
          </div>
          <p className="text-sm text-muted-foreground">
            These houses are on TruePlace. Open one there for the record, the cost, and what is in the house.
          </p>
          <div className="flex flex-col gap-3">
            {trueHomes.map((home) => (
              <a
                key={home.id}
                href={TRUEPLACE}
                target="_blank"
                rel="noreferrer"
                className="overflow-hidden rounded-xl bg-cream shadow-[var(--shadow-border)] hover:shadow-[var(--shadow-border-hover)]"
              >
                <img src={home.photo} alt="" className="aspect-[5/2] w-full object-cover" />
                <div className="p-4">
                  <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                    {home.city}, {home.state} {home.zip}
                  </p>
                  <h3 className="mt-0.5 font-display text-2xl tracking-wide">{home.title}</h3>
                  <p className="mt-1 text-sm text-ink">
                    {home.address} · ${home.price.toLocaleString()} · {home.beds} bd · {home.baths} ba · {home.sqft.toLocaleString()} sqft
                  </p>
                  <p className="mt-2 text-sm font-medium">Use this house on TruePlace</p>
                </div>
              </a>
            ))}
          </div>
        </section>
      ) : sections.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          No {calling === "all" ? hall.label.toLowerCase() : calling.toLowerCase()} listings on the public boards right now.
        </p>
      ) : (
        sections.map((seat) => (
          <section key={seat} className="flex flex-col gap-3">
            <h2 className="font-display text-2xl tracking-wide">{seat}</h2>
            {ranked
              .filter((row) => row.seat === seat)
              .map((row) => (
                <CallCard key={row.call.id} call={row.call} />
              ))}
          </section>
        ))
      )}

      {shop ? <CrewWatch /> : null}
      {!shop && you ? <ShopLock action="Post a call" /> : null}
    </div>
  );
}

function CallBrief({
  shop,
  you,
  qualify,
  close,
  sos,
  mine,
  hands,
  applied,
}: {
  shop: boolean;
  you?: Person;
  qualify: number;
  close: number;
  sos: number;
  mine: number;
  hands: number;
  applied: number;
}) {
  if (!you) return null;
  return (
    <section className="rounded-xl bg-ink px-5 py-4 text-cream">
      {shop ? (
        <>
          <p className="text-[11px] tracking-wide text-cream/55 uppercase">Shop desk</p>
          <p className="mt-1 font-display text-3xl tracking-wide">
            {mine} open {mine === 1 ? "call" : "calls"} · {hands} {hands === 1 ? "hand" : "hands"}
          </p>
          <p className="mt-1 text-sm text-cream/70">
            {sos ? `${sos} SOS on the board. ` : "No SOS. "}
            Rank by tickets. Hire writes a ${TAKE.fill} fill receipt.
          </p>
        </>
      ) : (
        <>
          <p className="text-[11px] tracking-wide text-cream/55 uppercase">Your fit</p>
          <p className="mt-1 font-display text-3xl tracking-wide">
            You qualify for {qualify}
            {close > qualify ? ` · ${close} in your trade` : ""}
          </p>
          <p className="mt-1 text-sm text-cream/70">
            {applied ? `Hand raised on ${applied}. ` : "Raise a hand free. "}
            {close > qualify ? "A missing ticket still shows. Sit it, then the hand opens." : "Shops pay. Your passport stays free."}
          </p>
        </>
      )}
    </section>
  );
}
