import { createFileRoute } from "@tanstack/react-router";
import { TRADE_GROUPS } from "@/lib/seed";
import { useForge } from "@/lib/store";

export const Route = createFileRoute("/intel")({ component: IntelPage });

function IntelPage() {
  const people = useForge((s) => s.people);
  const calls = useForge((s) => s.calls);
  const open = people.filter((p) => p.availability === "open");
  const byTrade = (t: string) => people.filter((p) => p.trade === t);
  const openJobs = calls.reduce((n, c) => n + Math.max(0, c.spots - c.filled), 0);
  const avgYears = people.reduce((n, p) => n + p.years, 0) / people.length;
  const tickets = people.flatMap((p) => p.tickets.map((t) => t.name));
  const topTicket = [...new Set(tickets)].sort(
    (a, b) => tickets.filter((x) => x === b).length - tickets.filter((x) => x === a).length,
  )[0];
  const thisMonth = open.filter((p) => p.state === "CO");

  return (
    <div className="flex flex-col gap-4">
      <header>
        <h1 className="font-display text-4xl tracking-wide">Workforce intelligence</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Available vs open seats. Shortage is a number, not a press conference.
        </p>
      </header>
      <section className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[
          ["On the board", people.length],
          ["Open to calls", open.length],
          ["Open seats", openJobs],
          ["Avg years", avgYears.toFixed(1)],
        ].map(([k, v]) => (
          <div key={String(k)} className="rounded-xl bg-cream p-3 shadow-[var(--shadow-border)]">
            <p className="text-[11px] text-muted-foreground">{k}</p>
            <p className="font-display text-3xl tabular-nums">{v}</p>
          </div>
        ))}
      </section>
      <p className="text-sm">Most common ticket: {topTicket}</p>
      <section className="rounded-xl bg-cream p-4 shadow-[var(--shadow-border)]">
        <h2 className="font-display text-2xl tracking-wide">By field</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {TRADE_GROUPS.flatMap((g) => g.trades).map((t) => {
            const o = byTrade(t).filter((p) => p.availability === "open").length;
            const seats = calls.filter((c) => c.trade === t).reduce((x, c) => x + Math.max(0, c.spots - c.filled), 0);
            const short = Math.max(0, seats - o);
            return (
              <li key={t} className="flex justify-between gap-3">
                <span>{t}</span>
                <span className="tabular-nums text-muted-foreground">
                  {o} open / {seats} seats{short ? ` · short ${short}` : ""}
                </span>
              </li>
            );
          })}
        </ul>
      </section>
      <section className="rounded-xl bg-cream p-4 shadow-[var(--shadow-border)]">
        <h2 className="font-display text-2xl tracking-wide">Talent radar</h2>
        <p className="text-sm">
          {thisMonth.length} people in Colorado became or stayed available on this board.
        </p>
        <ul className="mt-2 space-y-1 text-sm">
          {thisMonth.map((p) => (
            <li key={p.id}>
              {p.name} · {p.trade} · {p.city}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
