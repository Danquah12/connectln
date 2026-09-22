import { Bookmark, MapPin } from "lucide-react";
import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { Portrait } from "@/components/portrait";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExampleMark } from "@/components/example-mark";
import { fitScore, rankHands, type TicketHit } from "@/lib/fit";
import { isExampleCall } from "@/lib/example";
import { shortDate } from "@/lib/format";
import { VOUCH_KINDS } from "@/lib/vouch";
import { HOUSE_BILL, TAKE } from "@/lib/money";
import { personById, useForge } from "@/lib/store";
import { useShopSeat } from "@/components/shop-lock";
import { cn } from "@/lib/utils";
import type { CrewCall } from "@/lib/types";

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

export function CallCard({ call }: { call: CrewCall }) {
  const applyToCall = useForge((s) => s.applyToCall);
  const referOnCall = useForge((s) => s.referOnCall);
  const [referOpen, setReferOpen] = useState(false);
  const hireOnCall = useForge((s) => s.hireOnCall);
  const coverTicket = useForge((s) => s.coverTicket);
  const addVouch = useForge((s) => s.addVouch);
  const toggleSaveCall = useForge((s) => s.toggleSaveCall);
  const applied = useForge((s) => s.appliedCallIds.includes(call.id));
  const saved = useForge((s) => s.savedCallIds.includes(call.id));
  const people = useForge((s) => s.people);
  const vouches = useForge((s) => s.vouches);
  const youId = useForge((s) => s.youId);
  const you = personById(people, youId);
  const shop = useShopSeat();
  const hands = useForge((s) => s.callHands[call.id]) ?? [];
  const hired = useForge((s) => s.callHires[call.id]) ?? [];
  const mine = call.postedBy === youId;
  const open = Math.max(0, call.spots - hired.length);
  const fit = you && !mine ? fitScore(you, call, vouches) : null;
  const ranked = mine ? rankHands(hands, people, call, vouches) : [];

  return (
    <article
      id={call.id}
      className="scroll-mt-20 overflow-hidden rounded-xl bg-cream shadow-[var(--shadow-border)]"
    >
      {call.photo ? (
        <img
          src={call.photo}
          alt=""
          className="aspect-[5/2] w-full object-cover"
          crossOrigin="anonymous"
        />
      ) : null}
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              {call.trade} · {call.shop}
              {call.urgent ? " · SOS" : ""}
              {call.shift ? " · Shift" : ""}
              {call.apprentice ? " · Apprentice" : ""}
              {isExampleCall(call) ? <ExampleMark className="ml-2 align-middle" /> : null}
            </p>
            <h3 className="mt-0.5 font-display text-2xl tracking-wide text-ink">{call.title}</h3>
          </div>
          <div className="flex flex-col items-end gap-1">
            {call.urgent ? <Badge variant="brick">Urgent</Badge> : null}
            {call.apprentice ? <Badge variant="ok">Apprentice</Badge> : null}
            <Badge variant={call.union ? "default" : "outline"}>
              {call.union ? "Union" : "Non-union"}
            </Badge>
          </div>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-ink/90">{call.description}</p>
        {fit ? (
          <div className="mt-3 rounded-lg bg-canvas p-3 text-sm">
            <p className="font-medium">
              {fit.blocked ? "Tickets fail" : fit.unverified.length ? "Hand possible" : "You qualify"} · {fit.score}%
            </p>
            {fit.rows.map((row) => (
              <p key={row.required} className={cn("mt-0.5 text-xs", hitTone(row.status))}>
                {row.required} · {hitWord(row.status)}
              </p>
            ))}
            {fit.reason ? <p className="mt-1 text-xs text-muted-foreground">{fit.reason}</p> : null}
          </div>
        ) : null}
        <dl className="mt-3 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
          <div>
            <dt className="text-[11px] text-muted-foreground">Where</dt>
            <dd className="flex items-center gap-1 font-medium">
              <MapPin className="size-3.5 text-muted-foreground" />
              {call.city}, {call.state}
            </dd>
          </div>
          <div>
            <dt className="text-[11px] text-muted-foreground">Rate</dt>
            <dd className="font-medium tabular-nums">{call.rate}</dd>
          </div>
          <div>
            <dt className="text-[11px] text-muted-foreground">Start</dt>
            <dd className="font-medium">{shortDate(call.start)}</dd>
          </div>
          <div>
            <dt className="text-[11px] text-muted-foreground">Length</dt>
            <dd className="font-medium">{call.duration}</dd>
          </div>
        </dl>
        {call.perDiem || call.travel ? (
          <p className="mt-2 text-xs text-muted-foreground">
            {call.perDiem ? `Per diem ${call.perDiem}` : null}
            {call.perDiem && call.travel ? " · " : null}
            {call.travel ? "Travel / lodging on the shop" : null}
          </p>
        ) : null}
        <div className="mt-3 flex flex-wrap gap-1.5">
          {call.tickets.map((t) => (
            <Badge key={t} variant="muted">
              {t}
            </Badge>
          ))}
        </div>
        {!mine ? (
          <div className="mt-4 flex items-center gap-2">
            <Button
              disabled={applied || open === 0 || Boolean(fit?.blocked)}
              onClick={() => {
                applyToCall(call.id);
                toast("Hand raised. Shop sees tickets, not a résumé.");
              }}
            >
              {applied
                ? "Hand raised"
                : open === 0
                  ? "Crew full"
                  : fit?.blocked
                    ? "Tickets fail"
                    : call.shift
                      ? "Claim shift"
                      : "You qualify — raise hand"}
            </Button>
            {fit?.blocked ? (
              <Button variant="outline" asChild>
                <Link to="/wallet">Fix tickets</Link>
              </Button>
            ) : null}
            <Button variant="outline" onClick={() => setReferOpen((v) => !v)}>
              Refer
            </Button>
            <Button
              variant="outline"
              size="icon"
              aria-label={saved ? "Unsave call" : "Save call"}
              onClick={() => toggleSaveCall(call.id)}
            >
              <Bookmark className={cn("size-4", saved && "fill-ink")} />
            </Button>
            <span className="ml-auto text-xs text-muted-foreground tabular-nums">
              {open} of {call.spots} open
            </span>
          </div>
        ) : (
          <p className="mt-4 text-xs text-muted-foreground tabular-nums">
            Your call · {open} of {call.spots} open · {hands.length} hands
          </p>
        )}
        {!mine && referOpen ? (
          <ul className="mt-3 space-y-2 rounded-lg bg-canvas p-3">
            <li className="text-xs text-muted-foreground">Same trade. Tickets hold. Not you.</li>
            {people
              .filter((p) => p.id !== youId && p.availability === "open")
              .map((p) => ({ p, f: fitScore(p, call, vouches) }))
              .filter((x) => x.f.tradeMatch && !x.f.blocked)
              .sort((a, b) => b.f.score - a.f.score)
              .slice(0, 3)
              .map(({ p }) => (
                <li key={p.id} className="flex items-center justify-between gap-2">
                  <Link to="/p/$id" params={{ id: p.id }} className="flex min-w-0 items-center gap-2">
                    <Portrait person={p} size="sm" link={false} />
                    <span className="truncate text-sm">{p.name}</span>
                  </Link>
                  <Button
                    size="sm"
                    onClick={() => {
                      referOnCall(call.id, p.id);
                      toast(`Referred ${p.name.split(" ")[0]}. It's in both inboxes.`);
                      setReferOpen(false);
                    }}
                  >
                    Send
                  </Button>
                </li>
              ))}
          </ul>
        ) : null}
        {mine ? (
          <div className="mt-4 border-t border-ink/10 pt-3">
            <p className="text-[11px] tracking-wide text-muted-foreground uppercase">
              Ranked by tickets, vouches, city
            </p>
            {ranked.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">No hands yet.</p>
            ) : (
              <ul className="mt-2 flex flex-col gap-3">
                {ranked.map(({ person, fit: row }, i) => {
                  const onCrew = hired.includes(person.id);
                  const vouched = vouches.some((v) => v.fromId === youId && v.toId === person.id);
                  return (
                    <li key={person.id} className="rounded-lg bg-canvas p-3">
                      <div className="flex items-start gap-2">
                        <Portrait person={person} size="sm" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium">
                            {i + 1}.{" "}
                            <Link to="/p/$id" params={{ id: person.id }} className="hover:underline">
                              {person.name}
                            </Link>
                            <span className="text-xs font-normal text-muted-foreground">
                              {" "}
                              · {row.score}% · {person.rate ?? "scale"} · {person.travelMiles} mi
                            </span>
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {person.level} {person.trade} · {person.city}
                            {row.vouches ? ` · ${row.vouches} vouch${row.vouches === 1 ? "" : "es"}` : ""}
                          </p>
                          <div className="mt-1 flex flex-wrap gap-x-2 gap-y-0.5">
                            {row.rows.map((t) => (
                              <span key={t.required} className={cn("text-[11px]", hitTone(t.status))}>
                                {t.required} {hitWord(t.status)}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {onCrew ? (
                          <Badge variant="ok">Hired</Badge>
                        ) : row.hireBlocked && row.unverified.length && !row.blocked && shop ? (
                          <Button
                            size="sm"
                            onClick={() => {
                              coverTicket(person.id);
                              toast(`Ticket check covered. ${person.name} can be hired.`);
                            }}
                          >
                            Cover ticket check · $12
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            disabled={row.hireBlocked || open === 0 || !shop}
                            onClick={() => {
                              hireOnCall(call.id, person.id);
                              toast(`On the crew. Fill receipt $${TAKE.fill} · ${HOUSE_BILL}.`);
                            }}
                          >
                            {!shop ? "Shop board to hire" : row.hireBlocked ? "Cannot hire" : "Hire"}
                          </Button>
                        )}
                        {onCrew && !vouched
                          ? VOUCH_KINDS.slice(0, 4).map((k) => (
                              <Button
                                key={k.id}
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  addVouch(
                                    person.id,
                                    `${k.label} on ${call.title}. We worked it.`,
                                    call.title,
                                    [k.id],
                                  );
                                  toast(`Vouched ${person.name} · ${k.label}`);
                                }}
                              >
                                Vouch · {k.label}
                              </Button>
                            ))
                          : null}
                        {vouched ? <Badge variant="muted">Vouched</Badge> : null}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        ) : null}
      </div>
    </article>
  );
}
