import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { Portrait } from "@/components/portrait";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { hallCalls } from "@/lib/example";
import { fitScore } from "@/lib/fit";
import { triageSos } from "@/lib/sos";
import { personById, useForge } from "@/lib/store";
import { useShopSeat } from "@/components/shop-lock";

export function SosDesk() {
  const people = useForge((s) => s.people);
  const vouches = useForge((s) => s.vouches);
  const calls = useForge((s) => s.calls);
  const hires = useForge((s) => s.callHires);
  const youId = useForge((s) => s.youId);
  const you = personById(people, youId);
  const shop = useShopSeat();
  const pingSos = useForge((s) => s.pingSos);
  const applyToCall = useForge((s) => s.applyToCall);
  const applied = useForge((s) => s.appliedCallIds);
  const sos = hallCalls(calls).filter((c) => c.urgent && c.filled < c.spots);
  if (!you || !sos.length) return null;

  return (
    <section className="rounded-xl bg-brick px-5 py-4 text-cream">
      <p className="text-[11px] tracking-wide text-cream/70 uppercase">SOS triage</p>
      <p className="mt-1 font-display text-2xl tracking-wide">
        {sos.length} urgent {sos.length === 1 ? "call" : "calls"}
      </p>
      <p className="mt-1 text-sm text-cream/80">
        GO = open, in range, tickets hold. Standby = close but not clean. Don't ping a fail.
      </p>
      <ul className="mt-3 space-y-3">
        {sos.map((call) => {
          const rows = triageSos(call, people, vouches, hires[call.id] ?? []);
          const go = rows.filter((r) => r.tier === "go").slice(0, 5);
          const mine = fitScore(you, call, vouches);
          const iGo = !shop && mine.tradeMatch && !mine.blocked && mine.missing.length === 0 && you.availability === "open";
          return (
            <li key={call.id} className="rounded-lg bg-ink/25 p-3">
              <Link to="/calls" hash={call.id} className="font-medium hover:underline">
                {call.title}
              </Link>
              <p className="text-xs text-cream/70">
                {call.city} · {call.start} · {call.rate} · {go.length} GO
              </p>
              {shop ? (
                <ul className="mt-2 space-y-1.5">
                  {go.map((row) => (
                    <li key={row.person.id} className="flex items-center justify-between gap-2">
                      <span className="flex min-w-0 items-center gap-2">
                        <Portrait person={row.person} size="sm" link={false} />
                        <span className="min-w-0 text-sm">
                          <span className="truncate font-medium">{row.person.name}</span>
                          <span className="block truncate text-[11px] text-cream/65">{row.why}</span>
                        </span>
                      </span>
                      <Button
                        size="sm"
                        variant="cream"
                        onClick={() => {
                          pingSos(call.id, row.person.id);
                          toast(`Pinged ${row.person.name}. SOS is in their inbox.`);
                        }}
                      >
                        Ping
                      </Button>
                    </li>
                  ))}
                  {go.length === 0 ? (
                    <p className="text-xs text-cream/70">Nobody is GO. Open Find crew or wait a hand.</p>
                  ) : null}
                </ul>
              ) : iGo ? (
                <Button
                  className="mt-2"
                  size="sm"
                  variant="cream"
                  disabled={applied.includes(call.id)}
                  onClick={() => {
                    applyToCall(call.id);
                    toast("Hand raised on SOS. Shop sees tickets.");
                  }}
                >
                  {applied.includes(call.id) ? "Hand raised" : "I'm GO — take SOS"}
                </Button>
              ) : (
                <p className="mt-2 text-xs text-cream/70">
                  {mine.reason ?? "Not GO on this one."}{" "}
                  <Link to="/wallet" className="underline">
                    Tickets
                  </Link>
                </p>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export function ShiftBoard() {
  const people = useForge((s) => s.people);
  const youId = useForge((s) => s.youId);
  const you = personById(people, youId);
  const calls = useForge((s) => s.calls);
  const hires = useForge((s) => s.callHires);
  const offers = useForge((s) => s.shiftOffers);
  const offerShift = useForge((s) => s.offerShift);
  const takeShift = useForge((s) => s.takeShift);
  const vouches = useForge((s) => s.vouches);
  if (!you) return null;
  const shifts = hallCalls(calls).filter((c) => c.shift);
  const mine = shifts.filter((c) => (hires[c.id] ?? []).includes(you.id));
  const openOffers = offers.filter((o) => !o.takenBy && o.fromId !== you.id);
  if (!shifts.length) return null;

  return (
    <section className="rounded-xl bg-cream p-4 shadow-[var(--shadow-border)]">
      <p className="text-[11px] font-medium tracking-[0.16em] text-muted-foreground uppercase">Shift rules</p>
      <h2 className="mt-1 font-display text-2xl tracking-wide">Swaps</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Same calling. Both tickets hold. You offer a seat you already have. Someone GO takes it. No overlapping two hires.
      </p>
      {mine.length ? (
        <ul className="mt-3 space-y-2">
          {mine.map((c) => {
            const offered = offers.some((o) => o.callId === c.id && o.fromId === you.id && !o.takenBy);
            return (
              <li key={c.id} className="flex items-center justify-between gap-2 rounded-lg bg-canvas px-3 py-2">
                <span className="min-w-0 text-sm">
                  <span className="font-medium">{c.title}</span>
                  <span className="block text-xs text-muted-foreground">
                    {c.start} · {c.city}
                  </span>
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={offered}
                  onClick={() => {
                    offerShift(c.id);
                    toast("Shift is on the swap board.");
                  }}
                >
                  {offered ? "Offered" : "Offer this shift"}
                </Button>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-muted-foreground">Claim a shift first, then you can offer it.</p>
      )}
      {openOffers.length ? (
        <ul className="mt-3 space-y-2">
          {openOffers.map((o) => {
            const call = calls.find((c) => c.id === o.callId);
            const from = people.find((p) => p.id === o.fromId);
            if (!call || !from) return null;
            const fit = fitScore(you, call, vouches);
            const ok = !fit.blocked && fit.tradeMatch;
            return (
              <li key={o.id} className="flex items-center justify-between gap-2 rounded-lg bg-canvas px-3 py-2">
                <span className="min-w-0 text-sm">
                  <span className="font-medium">{call.title}</span>
                  <span className="block text-xs text-muted-foreground">
                    {from.name} offering · {call.start}
                  </span>
                </span>
                <span className="flex items-center gap-2">
                  <Badge variant={ok ? "ok" : "muted"}>{ok ? "You qualify" : "Tickets fail"}</Badge>
                  <Button
                    size="sm"
                    disabled={!ok}
                    onClick={() => {
                      takeShift(o.id);
                      toast(ok ? "You have the shift." : "Tickets fail.");
                    }}
                  >
                    Take it
                  </Button>
                </span>
              </li>
            );
          })}
        </ul>
      ) : null}
    </section>
  );
}
