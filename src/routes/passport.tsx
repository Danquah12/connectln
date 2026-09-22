import { createFileRoute, Link } from "@tanstack/react-router";
import { SkillsRadar } from "@/components/radar";
import { TicketPlate } from "@/components/ticket-plate";
import { Button } from "@/components/ui/button";
import { events, visitors } from "@/lib/board-seed";
import { careerLadder, nextCredentials } from "@/lib/recommend";
import { personById, useForge } from "@/lib/store";
import { ticketNeedsRefresh } from "@/lib/format";
import { careerDna, careerXp, hiddenOpps, marketFor } from "@/lib/xp";

export const Route = createFileRoute("/passport")({ component: PassportPage });

function PassportPage() {
  const people = useForge((s) => s.people);
  const vouches = useForge((s) => s.vouches);
  const youId = useForge((s) => s.youId);
  const passed = useForge((s) => s.passedChallenges);
  const you = personById(people, youId);
  if (!you) return null;
  const dna = careerDna(you, vouches);
  const xp = careerXp(you, vouches, passed.length);
  const market = marketFor(you);
  const next = nextCredentials(you);
  const hidden = hiddenOpps(you);
  const ladder = careerLadder(you);
  const mineEvents = events.filter((e) => e.personId === you.id);

  return (
    <div className="flex flex-col gap-4">
      <header>
        <h1 className="font-display text-4xl tracking-wide">Professional passport</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Who you are. What you know. What you're certified to do. What you've done. Who
          will vouch. What you're available for.
        </p>
      </header>

      <section className="rounded-xl bg-ink px-5 py-5 text-cream">
        <p className="text-xs tracking-wide text-cream/55 uppercase">Level {xp.level}</p>
        <p className="font-display text-4xl tracking-wide">{you.name}</p>
        <p className="mt-1 text-sm text-cream/70">{xp.xp.toLocaleString()} XP</p>
        <div className="mt-3 h-2 rounded-full bg-cream/15">
          <div className="h-2 rounded-full bg-brick" style={{ width: `${xp.pct}%` }} />
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {xp.badges.map((b) => (
            <span key={b.id} className="rounded-full bg-cream/10 px-2 py-0.5 text-[11px]">
              {b.label}
            </span>
          ))}
        </div>
      </section>

      {you.openTo ? (
        <section className="rounded-xl bg-cream p-4 shadow-[var(--shadow-border)]">
          <h2 className="font-display text-2xl tracking-wide">Available</h2>
          <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-[11px] text-muted-foreground">Looking for</dt>
              <dd>{you.openTo.looking}</dd>
            </div>
            <div>
              <dt className="text-[11px] text-muted-foreground">Where</dt>
              <dd>{you.openTo.locations}</dd>
            </div>
            <div>
              <dt className="text-[11px] text-muted-foreground">When</dt>
              <dd>{you.openTo.when}</dd>
            </div>
            <div>
              <dt className="text-[11px] text-muted-foreground">Minimum</dt>
              <dd>{you.openTo.minRate}</dd>
            </div>
            <div>
              <dt className="text-[11px] text-muted-foreground">Travel</dt>
              <dd>{you.openTo.travel}</dd>
            </div>
            <div>
              <dt className="text-[11px] text-muted-foreground">Shift / hire</dt>
              <dd>
                {you.openTo.shift} · {you.openTo.employment}
              </dd>
            </div>
          </dl>
        </section>
      ) : null}

      <section className="rounded-xl bg-cream p-4 shadow-[var(--shadow-border)]">
        <h2 className="font-display text-2xl tracking-wide">Career DNA</h2>
        <ul className="mt-3 space-y-2">
          {dna.map((d) => (
            <li key={d.id}>
              <div className="flex justify-between text-sm">
                <span>{d.label}</span>
                <span className="tabular-nums">{d.value}</span>
              </div>
              <div className="mt-1 h-1.5 rounded-full bg-canvas">
                <div className="h-1.5 rounded-full bg-ink" style={{ width: `${d.value}%` }} />
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-xl bg-cream p-4 shadow-[var(--shadow-border)]">
        <h2 className="font-display text-2xl tracking-wide">Skills radar</h2>
        <SkillsRadar person={you} vouches={vouches} />
      </section>

      <section className="rounded-xl bg-cream p-4 shadow-[var(--shadow-border)]">
        <h2 className="font-display text-2xl tracking-wide">Certified to do</h2>
        <p className="text-xs text-muted-foreground">
          {you.tickets.filter(ticketNeedsRefresh).length
            ? "Something is pending, unverified, or inside 60 days."
            : "Issuer, number, issued, expiry. The wallet is the source."}
        </p>
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {you.tickets.map((t) => (
            <TicketPlate key={t.id} ticket={t} />
          ))}
        </div>
        <Link to="/wallet" className="mt-3 inline-block text-sm text-brick hover:underline">
          Open the license desk
        </Link>
      </section>

      <section className="rounded-xl bg-cream p-4 shadow-[var(--shadow-border)]">
        <h2 className="font-display text-2xl tracking-wide">Done — on this hall</h2>
        <p className="text-xs text-muted-foreground">A hire writes the job here. Vouches follow the site.</p>
        <ul className="mt-3 space-y-2">
          {you.history.slice(0, 6).map((h) => {
            const recs = vouches.filter((v) => v.toId === you.id && v.site === h.name);
            return (
              <li key={h.id} className="text-sm">
                <span className="font-medium">{h.name}</span>
                <span className="text-muted-foreground">
                  {" "}
                  · {h.city} · {h.role}
                  {h.verified ? " · hired on ConnectLn" : ""}
                </span>
                {recs.length ? (
                  <span className="block text-xs text-muted-foreground">
                    Vouched: {recs.map((v) => v.body).join(" · ")}
                  </span>
                ) : null}
              </li>
            );
          })}
        </ul>
        <Link to="/p/$id" params={{ id: you.id }} className="mt-3 inline-block text-sm text-brick hover:underline">
          Full proof of work
        </Link>
      </section>

      <section className="rounded-xl bg-cream p-4 shadow-[var(--shadow-border)]">
        <h2 className="font-display text-2xl tracking-wide">Market value</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {you.trade} typical ${market.low}–${market.high}/hr. Your card sits near ${market.you}/hr.
        </p>
        <h3 className="mt-4 text-sm font-medium">Increase my value</h3>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm">
          {next.map((n) => (
            <li key={n}>{n}</li>
          ))}
        </ol>
        <div className="mt-3">
          <Button asChild variant="ink">
            <Link to="/twin">Ask the twin</Link>
          </Button>
        </div>
      </section>

      <section className="rounded-xl bg-cream p-4 shadow-[var(--shadow-border)]">
        <h2 className="font-display text-2xl tracking-wide">Hidden opportunities</h2>
        <ul className="mt-3 space-y-3">
          {hidden.map((h) => (
            <li key={h.title}>
              <p className="text-sm font-medium">{h.title}</p>
              <p className="text-xs text-muted-foreground">{h.why}</p>
              <p className="text-xs tabular-nums">{h.pay}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-xl bg-cream p-4 shadow-[var(--shadow-border)]">
        <h2 className="font-display text-2xl tracking-wide">Path</h2>
        <ol className="mt-3 space-y-1 text-sm">
          {ladder.map((s) => (
            <li key={s.label} className={s.current ? "font-medium text-brick" : "text-muted-foreground"}>
              {s.current ? "→ " : ""}
              {s.label}
            </li>
          ))}
        </ol>
      </section>

      <section className="rounded-xl bg-cream p-4 shadow-[var(--shadow-border)]">
        <h2 className="font-display text-2xl tracking-wide">Tool belt</h2>
        <p className="mt-2 text-sm">{you.tools?.join(" · ")}</p>
        <p className="mt-1 text-xs text-muted-foreground">{you.software?.join(" · ")}</p>
      </section>

      <section className="rounded-xl bg-cream p-4 shadow-[var(--shadow-border)]">
        <h2 className="font-display text-2xl tracking-wide">Reputation events</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {mineEvents.map((e) => (
            <li key={e.id} className="flex justify-between gap-3">
              <span>{e.label}</span>
              <span className="text-xs text-muted-foreground">{e.when}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-xl bg-cream p-4 shadow-[var(--shadow-border)]">
        <h2 className="font-display text-2xl tracking-wide">Who looked</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {visitors.map((v) => (
            <li key={v.id}>
              <p className="font-medium">{v.shop} viewed your card</p>
              <p className="text-xs text-muted-foreground">
                Looking for {v.looking} · {v.when}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <p className="flex flex-wrap gap-x-3 gap-y-1 text-xs">
        <Link to="/hub" className="text-brick hover:underline">
          Hub
        </Link>
        <Link to="/market" className="text-brick hover:underline">
          Market
        </Link>
        <Link to="/showcase" className="text-brick hover:underline">
          Showcase
        </Link>
        <Link to="/work" className="text-brick hover:underline">
          Work
        </Link>
        <Link to="/build" className="text-brick hover:underline">
          Build
        </Link>
        <Link to="/become" className="text-brick hover:underline">
          What can I become
        </Link>
        <Link to="/gigs" className="text-brick hover:underline">
          Gigs
        </Link>
        <Link to="/near" className="text-brick hover:underline">
          Near me
        </Link>
        <Link to="/interview" className="text-brick hover:underline">
          Interview
        </Link>
        <Link to="/resume" className="text-brick hover:underline">
          Resume
        </Link>
        <Link to="/crew" className="text-brick hover:underline">
          Crew builder
        </Link>
        <Link to="/sos" className="text-brick hover:underline">
          SOS / disaster
        </Link>
        <Link to="/learn" className="text-brick hover:underline">
          Learn
        </Link>
        <Link to="/pulse" className="text-brick hover:underline">
          Heat & leaders
        </Link>
      </p>
    </div>
  );
}
