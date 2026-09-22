import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { Portrait } from "@/components/portrait";
import { Button } from "@/components/ui/button";
import { hallCalls } from "@/lib/example";
import { fitScore } from "@/lib/fit";
import { hallLabel } from "@/lib/scope";
import { personById, useForge } from "@/lib/store";

export const Route = createFileRoute("/hands")({ component: HandsPage });

function HandsPage() {
  const people = useForge((s) => s.people);
  const youId = useForge((s) => s.youId);
  const calls = useForge((s) => s.calls);
  const applied = useForge((s) => s.appliedCallIds);
  const saved = useForge((s) => s.savedCallIds);
  const callHands = useForge((s) => s.callHands);
  const callHires = useForge((s) => s.callHires);
  const vouches = useForge((s) => s.vouches);
  const applyToCall = useForge((s) => s.applyToCall);
  const you = personById(people, youId);
  const board = hallCalls(calls);
  const mine = board.filter((c) => c.postedBy === youId);
  const raised = board.filter((c) => applied.includes(c.id));
  const savedOpen = board.filter((c) => saved.includes(c.id) && !applied.includes(c.id));
  const onCrew = board.filter((c) => (callHires[c.id] ?? []).includes(youId));
  const next = you
    ? board
        .filter((c) => c.postedBy !== youId && !applied.includes(c.id) && c.filled < c.spots)
        .map((c) => ({ c, fit: fitScore(you, c, vouches) }))
        .filter((x) => x.fit.tradeMatch)
        .sort((a, b) => Number(a.fit.blocked) - Number(b.fit.blocked) || b.fit.score - a.fit.score)
        .slice(0, 4)
    : [];
  const incoming = mine.flatMap((c) => (callHands[c.id] ?? []).map((id) => ({ c, id })));
  const hired = mine.flatMap((c) => (callHires[c.id] ?? []).map((id) => ({ c, id })));
  const needVouch = hired.filter(
    ({ c, id }) => !vouches.some((v) => v.fromId === youId && v.toId === id && v.site === c.title),
  );

  return (
    <div className="flex flex-col gap-4">
      <header>
        <h1 className="font-display text-4xl tracking-wide">Hand tracker</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Raised → shop looking → hired → vouch. Not an application pile.
          {you ? ` ${hallLabel(you.trade)} first.` : ""}
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          <Link to="/calls" className="text-brick hover:underline">
            Calls
          </Link>
          {" · "}
          <Link to="/wallet" className="text-brick hover:underline">
            Wallet
          </Link>
        </p>
      </header>

      <section className="rounded-xl bg-cream p-4 shadow-[var(--shadow-border)]">
        <h2 className="font-display text-2xl tracking-wide">Hands you raised</h2>
        {raised.length ? (
          <ul className="mt-3 space-y-2">
            {raised.map((c) => (
              <li key={c.id}>
                <Link to="/calls" hash={c.id} className="block rounded-lg bg-canvas px-3 py-2">
                  <p className="text-sm font-medium">{c.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {c.shop} · {c.city} · {c.rate} · in the pile
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">None yet. Raise from the list below.</p>
        )}
      </section>

      {savedOpen.length ? (
        <section className="rounded-xl bg-cream p-4 shadow-[var(--shadow-border)]">
          <h2 className="font-display text-2xl tracking-wide">Saved</h2>
          <ul className="mt-3 space-y-2">
            {savedOpen.map((c) => {
              const fit = you ? fitScore(you, c, vouches) : null;
              return (
                <li key={c.id} className="flex items-center justify-between gap-2 rounded-lg bg-canvas px-3 py-2">
                  <Link to="/calls" hash={c.id} className="min-w-0">
                    <p className="text-sm font-medium">{c.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {c.shop} · {c.city}
                      {fit?.blocked ? ` · ${fit.reason}` : ""}
                    </p>
                  </Link>
                  {fit?.blocked ? (
                    <Button size="sm" variant="outline" asChild>
                      <Link to="/wallet">Sit ticket</Link>
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => {
                        applyToCall(c.id);
                        toast("Hand raised. Shop sees tickets.");
                      }}
                    >
                      Raise
                    </Button>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      <section className="rounded-xl bg-cream p-4 shadow-[var(--shadow-border)]">
        <h2 className="font-display text-2xl tracking-wide">Raise a hand</h2>
        <p className="text-xs text-muted-foreground">Your trade. Paper on the card decides the hand.</p>
        {next.length ? (
          <ul className="mt-3 space-y-2">
            {next.map(({ c, fit }) => (
              <li key={c.id} className="flex items-center justify-between gap-2 rounded-lg bg-canvas px-3 py-2">
                <Link to="/calls" hash={c.id} className="min-w-0">
                  <p className="text-sm font-medium">{c.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {c.shop} · {c.city} · {c.rate}
                    {fit.blocked ? ` · ${fit.reason}` : " · you qualify"}
                  </p>
                </Link>
                {fit.blocked ? (
                  <Button size="sm" variant="outline" asChild>
                    <Link to="/wallet">Sit ticket</Link>
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => {
                      applyToCall(c.id);
                      toast("Hand raised. Shop sees tickets.");
                    }}
                  >
                    Raise
                  </Button>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">
            No open {you ? hallLabel(you.trade).toLowerCase() : "calls"} right now.{" "}
            <Link to="/calls" className="text-brick hover:underline">
              Whole board
            </Link>
          </p>
        )}
      </section>

      {onCrew.length ? (
        <section className="rounded-xl bg-cream p-4 shadow-[var(--shadow-border)]">
          <h2 className="font-display text-2xl tracking-wide">You're on the crew</h2>
          <ul className="mt-3 space-y-2">
            {onCrew.map((c) => (
              <li key={c.id} className="rounded-lg bg-canvas px-3 py-2">
                <p className="text-sm font-medium">{c.title}</p>
                <p className="text-xs text-muted-foreground">
                  {c.shop} · {c.start} · hired
                </p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {mine.length ? (
        <>
          <section className="rounded-xl bg-cream p-4 shadow-[var(--shadow-border)]">
            <h2 className="font-display text-2xl tracking-wide">Shop looking</h2>
            <p className="text-xs text-muted-foreground">Hands on calls you posted.</p>
            {incoming.length ? (
              <ul className="mt-3 space-y-2">
                {incoming.map(({ c, id }) => {
                  const who = personById(people, id);
                  if (!who) return null;
                  return (
                    <li key={`${c.id}-${id}`} className="flex items-center gap-3 rounded-lg bg-canvas px-3 py-2">
                      <Portrait person={who} size="sm" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">{who.name}</p>
                        <p className="text-xs text-muted-foreground">{c.title}</p>
                      </div>
                      <Link to="/messages" className="text-xs text-brick hover:underline">
                        Line
                      </Link>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">No hands on your calls yet.</p>
            )}
          </section>

          <section className="rounded-xl bg-cream p-4 shadow-[var(--shadow-border)]">
            <h2 className="font-display text-2xl tracking-wide">Hired</h2>
            {hired.length ? (
              <ul className="mt-3 space-y-2">
                {hired.map(({ c, id }) => {
                  const who = personById(people, id);
                  if (!who) return null;
                  return (
                    <li key={`${c.id}-h-${id}`} className="flex items-center gap-3 rounded-lg bg-canvas px-3 py-2">
                      <Portrait person={who} size="sm" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium">{who.name}</p>
                        <p className="text-xs text-muted-foreground">{c.title}</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">Hire from the call. Then vouch.</p>
            )}
          </section>

          <section className="rounded-xl bg-cream p-4 shadow-[var(--shadow-border)]">
            <h2 className="font-display text-2xl tracking-wide">Need a vouch</h2>
            {needVouch.length ? (
              <ul className="mt-3 space-y-2">
                {needVouch.map(({ c, id }) => {
                  const who = personById(people, id);
                  if (!who) return null;
                  return (
                    <li key={`${c.id}-v-${id}`}>
                      <Link to="/p/$id" params={{ id }} className="block rounded-lg bg-canvas px-3 py-2">
                        <p className="text-sm font-medium">{who.name}</p>
                        <p className="text-xs text-muted-foreground">Worked {c.title} — stamp the card</p>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">When a hire has no vouch, it shows here.</p>
            )}
          </section>
        </>
      ) : null}
    </div>
  );
}
