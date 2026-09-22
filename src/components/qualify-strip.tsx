import { Link } from "@tanstack/react-router";
import { hallCalls } from "@/lib/example";
import { fitScore } from "@/lib/fit";
import { personById, useForge } from "@/lib/store";

export function QualifyStrip() {
  const people = useForge((s) => s.people);
  const youId = useForge((s) => s.youId);
  const vouches = useForge((s) => s.vouches);
  const calls = useForge((s) => s.calls);
  const applied = useForge((s) => s.appliedCallIds);
  const saved = useForge((s) => s.savedCallIds);
  const you = personById(people, youId);
  if (!you) return null;

  const rows = hallCalls(calls)
    .filter((c) => c.postedBy !== you.id)
    .map((c) => ({ c, fit: fitScore(you, c, vouches) }))
    .filter((x) => x.fit.tradeMatch && x.fit.missing.length <= 1)
    .sort((a, b) => b.fit.score - a.fit.score)
    .slice(0, 3);

  if (!rows.length && !applied.length && !saved.length) return null;

  return (
    <section className="rounded-xl bg-cream p-4 shadow-[var(--shadow-border)]">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="font-display text-2xl tracking-wide">
          {you.availability === "open" ? "Calls that fit" : "Still a fit if you turn"}
        </h2>
        <Link to="/calls" className="text-xs text-brick hover:underline">
          Call board
        </Link>
      </div>
      <p className="text-xs text-muted-foreground">
        Tickets on the card, not a job title. You qualify means the paper holds.
      </p>
      <p className="mt-2 text-xs text-muted-foreground">
        Hands raised {applied.length} · saved {saved.length}
      </p>
      {rows.length ? (
        <ul className="mt-3 flex flex-col gap-2">
          {rows.map(({ c, fit }) => (
            <li key={c.id}>
              <Link
                to="/calls"
                className="flex items-start justify-between gap-3 rounded-lg bg-canvas px-3 py-2.5 hover:bg-canvas/80"
              >
                <span className="min-w-0">
                  <span className="block text-sm font-medium">{c.title}</span>
                  <span className="block text-xs text-muted-foreground">
                    {c.city} · {c.rate} · {c.start}
                  </span>
                </span>
                <span className="shrink-0 text-right text-xs">
                  <span className="block font-medium text-ok">
                    You qualify · {fit.have.length}/{fit.have.length + fit.missing.length + fit.unverified.length}
                  </span>
                  {fit.missing[0] ? (
                    <span className="text-warn">Missing {fit.missing[0]}</span>
                  ) : applied.includes(c.id) ? (
                    <span className="text-muted-foreground">Hand raised</span>
                  ) : null}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}