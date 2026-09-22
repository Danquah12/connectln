import { useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { BoardFilters } from "@/components/board-filters";
import { CallCard } from "@/components/call-card";
import { CrewWatch } from "@/components/crew-watch";
import { ShiftBoard, SosDesk } from "@/components/sos-desk";
import { ShopLock, useShopSeat } from "@/components/shop-lock";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { boardSearchOf, boardState, matchesBoard, parseBoardSearch } from "@/lib/board";
import { groupOf, hallLabel } from "@/lib/scope";
import { hallCalls } from "@/lib/example";
import { fitScore } from "@/lib/fit";
import { HOUSE_BILL, TAKE } from "@/lib/money";
import { personById, useForge } from "@/lib/store";
import type { CrewCall, FieldGroup, Person, Trade } from "@/lib/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/calls")({
  validateSearch: parseBoardSearch,
  component: CallsPage,
});

type Lane = "qualify" | "sos" | "shifts" | "apprentice" | "board";

function CallsPage() {
  const calls = useForge((s) => s.calls);
  const people = useForge((s) => s.people);
  const vouches = useForge((s) => s.vouches);
  const you = personById(people, useForge((s) => s.youId));
  const postCall = useForge((s) => s.postCall);
  const shop = useShopSeat();
  const [posting, setPosting] = useState(false);
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
  const fromUrl = boardState(search, you?.trade);
  const [picked, setPicked] = useState<{ group: "all" | FieldGroup; trade: Trade | "all" } | null>(null);
  const group = picked?.group ?? (you ? groupOf(you.trade) : fromUrl.group);
  const trade = picked?.trade ?? (you ? you.trade : fromUrl.trade);
  const [lane, setLane] = useState<Lane>("qualify");

  function setBoard(nextGroup: "all" | FieldGroup, nextTrade: Trade | "all") {
    setPicked({ group: nextGroup, trade: nextTrade });
    const next = boardSearchOf(nextGroup, nextTrade);
    void navigate({ search: { trade: next.trade, group: next.group } });
  }

  const board = useMemo(() => hallCalls(calls).filter((c) => matchesBoard(c.trade, group, trade)), [calls, group, trade]);

  const ranked = useMemo(() => {
    return board
      .map((c) => ({
        call: c,
        fit: you ? fitScore(you, c, vouches) : null,
        hands: (callHands[c.id] ?? []).length,
        hired: (callHires[c.id] ?? []).length,
        mine: c.postedBy === you?.id,
      }))
      .sort((a, b) => {
        if (a.mine !== b.mine) return a.mine ? -1 : 1;
        if (Boolean(a.call.urgent) !== Boolean(b.call.urgent)) return a.call.urgent ? -1 : 1;
        return (b.fit?.score ?? 0) - (a.fit?.score ?? 0);
      });
  }, [board, you, vouches, callHands, callHires]);

  const visible = ranked.filter((row) => {
    if (lane === "sos") return Boolean(row.call.urgent);
    if (lane === "shifts") return Boolean(row.call.shift);
    if (lane === "apprentice") return Boolean(row.call.apprentice) || /apprentice/i.test(row.call.title);
    if (lane === "qualify") {
      if (shop && row.mine) return true;
      if (!row.fit) return true;
      return row.fit.tradeMatch;
    }
    return true;
  });

  const qualifyN = ranked.filter((r) => r.fit?.tradeMatch && !r.fit.blocked).length;
  const closeN = ranked.filter((r) => r.fit?.tradeMatch).length;
  const sosN = ranked.filter((r) => r.call.urgent).length;
  const appN = ranked.filter((r) => r.call.apprentice || /apprentice/i.test(r.call.title)).length;
  const mineN = ranked.filter((r) => r.mine).length;
  const handsN = ranked.reduce((n, r) => n + (r.mine ? r.hands : 0), 0);

  return (
    <div className="flex flex-col gap-4">
      <header>
        <p className="text-[11px] font-medium tracking-[0.16em] text-muted-foreground uppercase">Hiring desk</p>
        <h1 className="font-display text-4xl tracking-wide">Calls</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {shop
            ? "Post a seat. Rank hands by tickets. Hire writes a fill receipt."
            : "You qualify — or you see exactly what's missing. Raise a hand free."}
          {you ? ` ${hallLabel(you.trade)} first.` : ""}
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

      <BoardFilters
        quiet
        group={group}
        trade={trade}
        onGroup={(g) => setBoard(g, "all")}
        onTrade={(t) => setBoard(group, t)}
      />

      <div className="flex flex-wrap gap-1.5">
        {(
          [
            ["qualify", shop ? `My board · ${mineN}` : `You qualify · ${qualifyN}`],
            ["sos", `SOS · ${sosN}`],
            ["shifts", "Shifts"],
            ["apprentice", `Apprentice · ${appN}`],
            ["board", "Whole board"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setLane(id)}
            className={cn(
              "h-9 rounded-full px-3 text-sm font-medium",
              lane === id ? "bg-ink text-cream" : "bg-cream text-muted-foreground",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-4">
        {visible.map((row) => (
          <CallCard key={row.call.id} call={row.call} />
        ))}
        {visible.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">
            {lane === "qualify"
              ? "No calls in your trade yet. Open the whole board or Care / Classroom."
              : "No calls in this lane."}
          </p>
        ) : null}
      </div>

      {shop ? <CrewWatch /> : null}
      <SosDesk />
      <ShiftBoard />
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
