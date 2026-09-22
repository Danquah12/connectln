import { createFileRoute, Link } from "@tanstack/react-router";
import { reputation } from "@/lib/reputation";
import { useForge } from "@/lib/store";

export const Route = createFileRoute("/pulse")({ component: PulsePage });

function PulsePage() {
  const people = useForge((s) => s.people);
  const vouches = useForge((s) => s.vouches);
  const cities = Object.entries(
    people.reduce<Record<string, { n: number; trades: Record<string, number> }>>((acc, p) => {
      const k = `${p.city}, ${p.state}`;
      acc[k] ??= { n: 0, trades: {} };
      acc[k].n += 1;
      acc[k].trades[p.trade] = (acc[k].trades[p.trade] ?? 0) + 1;
      return acc;
    }, {}),
  ).sort((a, b) => b[1].n - a[1].n);

  const ranked = [...people]
    .map((p) => ({ p, s: reputation(p, vouches).overall }))
    .sort((a, b) => b.s - a.s)
    .slice(0, 10);

  const thin = cities.filter(([, v]) => v.n <= 2);

  return (
    <div className="flex flex-col gap-4">
      <header>
        <h1 className="font-display text-4xl tracking-wide">Heat and leaders</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Where the tickets sit. Who the work actually ranks. Not a popularity contest.
        </p>
      </header>
      <section className="rounded-xl bg-cream p-4 shadow-[var(--shadow-border)]">
        <h2 className="font-display text-2xl tracking-wide">Talent map</h2>
        <ul className="mt-3 space-y-2">
          {cities.map(([city, v]) => (
            <li key={city}>
              <div className="flex justify-between text-sm">
                <span>{city}</span>
                <span className="tabular-nums">{v.n}</span>
              </div>
              <div className="mt-1 h-1.5 rounded-full bg-canvas">
                <div
                  className="h-1.5 rounded-full bg-brick"
                  style={{ width: `${Math.min(100, v.n * 18)}%` }}
                />
              </div>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                {Object.entries(v.trades)
                  .map(([t, n]) => `${n} ${t}`)
                  .join(" · ")}
              </p>
            </li>
          ))}
        </ul>
        {thin[0] ? (
          <p className="mt-3 text-sm">
            Shortage signal: {thin[0][0]} is thin on the board. HVAC and night coverage go first.
          </p>
        ) : null}
      </section>
      <section className="rounded-xl bg-cream p-4 shadow-[var(--shadow-border)]">
        <h2 className="font-display text-2xl tracking-wide">Skill leaders</h2>
        <ol className="mt-3 space-y-2">
          {ranked.map((r, i) => (
            <li key={r.p.id}>
              <Link to="/p/$id" params={{ id: r.p.id }} className="flex justify-between text-sm hover:underline">
                <span>
                  {i + 1}. {r.p.name} · {r.p.trade} · {r.p.state}
                </span>
                <span className="tabular-nums">{r.s}</span>
              </Link>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
