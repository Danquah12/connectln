import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { Portrait } from "@/components/portrait";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CrewWatch } from "@/components/crew-watch";
import { ShopLock, useShopSeat } from "@/components/shop-lock";
import { hallRoster } from "@/lib/example";
import { rankHands, type TicketHit } from "@/lib/fit";
import { TRADE_NEED } from "@/lib/need";
import { TRADE_GROUPS, TRADES } from "@/lib/seed";
import { personById, useForge } from "@/lib/store";
import type { CrewCall, FieldGroup, Trade } from "@/lib/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/find")({ component: FindPage });

function hitTone(status: TicketHit) {
  if (status === "have") return "text-ok";
  if (status === "soon") return "text-warn";
  return "text-brick";
}

function hitWord(status: TicketHit) {
  if (status === "have") return "ok";
  if (status === "soon") return "60-day";
  if (status === "lapsed") return "lapsed";
  if (status === "unverified") return "unverified";
  return "missing";
}

function FindPage() {
  const people = useForge((s) => s.people);
  const calls = useForge((s) => s.calls);
  const vouches = useForge((s) => s.vouches);
  const youId = useForge((s) => s.youId);
  const you = personById(people, youId);
  const hireOnCall = useForge((s) => s.hireOnCall);
  const coverTicket = useForge((s) => s.coverTicket);
  const shop = useShopSeat();
  const hiredMap = useForge((s) => s.callHires);
  const posted = calls.filter((c) => c.postedBy === youId && c.filled < c.spots);
  const [callId, setCallId] = useState(posted[0]?.id ?? "");
  const selected = posted.find((c) => c.id === callId);
  const [group, setGroup] = useState<"all" | FieldGroup>("all");
  const [trade, setTrade] = useState<Trade>(selected?.trade ?? you?.trade ?? "Electrician");
  const [need, setNeed] = useState<string[]>(selected?.tickets ?? TRADE_NEED[trade] ?? []);
  const [openOnly, setOpenOnly] = useState(false);
  const [vouchedOnly, setVouchedOnly] = useState(false);
  const [cityOnly, setCityOnly] = useState(false);
  const [showFail, setShowFail] = useState(true);

  const spec: CrewCall = useMemo(
    () =>
      selected ?? {
        id: "find",
        title: "Shop find",
        trade,
        shop: you?.name ?? "Shop",
        city: you?.city ?? "",
        state: you?.state ?? "",
        rate: "Shop scale",
        duration: "As posted",
        start: "This week",
        tickets: need,
        union: false,
        travel: true,
        spots: 8,
        filled: 0,
        description: "Staff from the hall.",
        postedBy: youId,
      },
    [selected, trade, need, you, youId],
  );

  const tradesInGroup = group === "all" ? TRADES : (TRADE_GROUPS.find((g) => g.id === group)?.trades ?? TRADES);

  const ranked = useMemo(() => {
    const hall = hallRoster(people).filter((p) => p.id !== youId && p.trade === spec.trade);
    return rankHands(
      hall.map((p) => p.id),
      people,
      spec,
      vouches,
    ).filter(({ person, fit }) => {
      if (openOnly && person.availability !== "open" && person.availability !== "on-job") return false;
      if (vouchedOnly && fit.vouches < 1) return false;
      if (cityOnly && spec.city && person.city !== spec.city && spec.state && person.state !== spec.state) {
        return false;
      }
      if (!showFail && fit.failed.length > 0) return false;
      return true;
    });
  }, [people, youId, spec, vouches, openOnly, vouchedOnly, cityOnly, showFail]);

  if (!you) return null;

  return (
    <div className="flex flex-col gap-4">
      <header>
        <h1 className="font-display text-4xl tracking-wide">Find crew</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Pick the calling. The hall lists them. City, open, and tickets are gates you turn on — not the
          default.
        </p>
      </header>

      <CrewWatch />

      {!shop ? <ShopLock action="Hire is a shop seat" /> : null}

      {posted.length ? (
        <div className="flex flex-wrap gap-1.5">
          {posted.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => {
                setCallId(c.id);
                setTrade(c.trade);
                setNeed(c.tickets);
                const g = TRADE_GROUPS.find((x) => x.trades.includes(c.trade));
                setGroup(g?.id ?? "all");
              }}
              className={cn(
                "h-9 rounded-full px-3 text-sm",
                callId === c.id ? "bg-ink text-cream" : "bg-cream text-muted-foreground",
              )}
            >
              {c.title}
            </button>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          No open call of yours. Filter the hall anyway, or{" "}
          <Link to="/calls" className="text-brick hover:underline">
            post a call
          </Link>
          .
        </p>
      )}

      <div className="flex flex-wrap gap-1.5">
        <button
          type="button"
          onClick={() => setGroup("all")}
          className={cn(
            "h-9 rounded-full px-3 text-sm",
            group === "all" ? "bg-ink text-cream" : "bg-cream text-muted-foreground",
          )}
        >
          All halls
        </button>
        {TRADE_GROUPS.map((g) => (
          <button
            key={g.id}
            type="button"
            onClick={() => {
              setGroup(g.id);
              const next = g.trades.includes(trade) ? trade : g.trades[0]!;
              setTrade(next);
              setNeed(TRADE_NEED[next] ?? []);
              if (selected && selected.trade !== next) setCallId("");
            }}
            className={cn(
              "h-9 rounded-full px-3 text-sm",
              group === g.id ? "bg-ink text-cream" : "bg-cream text-muted-foreground",
            )}
          >
            {g.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {tradesInGroup.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => {
              setTrade(t);
              setNeed(TRADE_NEED[t] ?? []);
              if (selected && selected.trade !== t) setCallId("");
            }}
            className={cn(
              "h-9 rounded-full px-3 text-sm",
              trade === t ? "bg-ink text-cream" : "bg-cream text-muted-foreground",
            )}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {(TRADE_NEED[trade] ?? need).map((t) => {
          const on = need.includes(t);
          return (
            <button
              key={t}
              type="button"
              onClick={() => setNeed(on ? need.filter((x) => x !== t) : [...need, t])}
              className={cn(
                "h-9 rounded-full px-3 text-sm",
                on ? "bg-brick text-cream" : "bg-cream text-muted-foreground",
              )}
            >
              {t}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {(
          [
            ["open", openOnly, () => setOpenOnly((v) => !v), "Open / on-job"],
            [
              "city",
              cityOnly,
              () => setCityOnly((v) => !v),
              spec.city ? spec.city : "This city (add yours on the card)",
            ],
            ["vouch", vouchedOnly, () => setVouchedOnly((v) => !v), "Has a vouch"],
            ["fail", !showFail, () => setShowFail((v) => !v), "Hide ticket fails"],
          ] as const
        ).map(([id, on, fn, label]) => (
          <button
            key={id}
            type="button"
            onClick={fn}
            className={cn(
              "h-9 rounded-full px-3 text-sm",
              on ? "bg-ink text-cream" : "bg-cream text-muted-foreground",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <p className="text-xs text-muted-foreground">
        {ranked.length} {spec.trade.toLowerCase()}
        {need.length ? ` · tickets: ${need.join(" · ")}` : ""}
        {cityOnly && spec.city ? ` · ${spec.city}` : ""}
      </p>

      <ul className="flex flex-col gap-2">
        {ranked.map(({ person, fit }, i) => {
          const onCrew = selected ? (hiredMap[selected.id] ?? []).includes(person.id) : false;
          return (
            <li key={person.id} className="rounded-xl bg-cream p-3 shadow-[var(--shadow-border)]">
              <div className="flex items-start gap-3">
                <Portrait person={person} size="lg" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">
                    {i + 1}.{" "}
                    <Link to="/p/$id" params={{ id: person.id }} className="hover:underline">
                      {person.name}
                    </Link>
                    <span className="text-xs font-normal text-muted-foreground">
                      {" "}
                      · {fit.score}% · {person.rate ?? "scale"}
                    </span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {person.level} {person.trade} · {person.city}
                    {person.state ? `, ${person.state}` : ""} · {person.availability}
                    {fit.vouches ? ` · ${fit.vouches} vouch${fit.vouches === 1 ? "" : "es"}` : ""}
                  </p>
                  <div className="mt-1 flex flex-wrap gap-x-2">
                    {fit.rows.map((row) => (
                      <span key={row.required} className={cn("text-[11px]", hitTone(row.status))}>
                        {row.required} {hitWord(row.status)}
                      </span>
                    ))}
                  </div>
                  {selected && !onCrew && fit.hireBlocked && fit.unverified.length && !fit.blocked && shop ? (
                    <Button
                      className="mt-2"
                      size="sm"
                      onClick={() => {
                        coverTicket(person.id);
                        toast(`Ticket check covered. ${person.name} can be hired.`);
                      }}
                    >
                      Cover ticket check · $12
                    </Button>
                  ) : selected && !onCrew ? (
                    <Button
                      className="mt-2"
                      size="sm"
                      disabled={fit.hireBlocked || !shop}
                      onClick={() => {
                        hireOnCall(selected.id, person.id);
                        toast(`On ${selected.title}. Passport updated.`);
                      }}
                    >
                      {!shop ? "Shop board to hire" : fit.hireBlocked ? "Cannot hire" : `Hire onto ${selected.title}`}
                    </Button>
                  ) : null}
                  {onCrew ? (
                    <Badge className="mt-2" variant="ok">
                      Hired · on their passport
                    </Badge>
                  ) : null}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
      {ranked.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          Nobody in {spec.trade.toLowerCase()} with those gates on. Turn off city or open, or show ticket
          fails.
        </p>
      ) : null}
    </div>
  );
}