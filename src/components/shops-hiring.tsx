import { Link } from "@tanstack/react-router";
import { hallCalls } from "@/lib/example";
import { shops } from "@/lib/seed";
import { personById, useForge } from "@/lib/store";

export function ShopsHiring() {
  const people = useForge((s) => s.people);
  const youId = useForge((s) => s.youId);
  const calls = useForge((s) => s.calls);
  const you = personById(people, youId);
  if (!you) return null;

  const open = hallCalls(calls).filter((c) => c.trade === you.trade && c.filled < c.spots);
  const hiring = shops.filter((s) => open.some((c) => c.shop === s.name || c.trade === s.trade)).slice(0, 4);
  if (!hiring.length) return null;

  return (
    <section className="rounded-xl bg-cream p-4 shadow-[var(--shadow-border)]">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="font-display text-2xl tracking-wide">Shops hiring your calling</h2>
        <Link to="/calls" className="text-xs text-brick hover:underline">
          Calls
        </Link>
      </div>
      <p className="text-xs text-muted-foreground">Open seats in {you.trade.toLowerCase()} — not a title match.</p>
      <ul className="mt-3 grid gap-3 sm:grid-cols-2">
        {hiring.map((s) => {
          const n = open.filter((c) => c.shop === s.name || c.trade === s.trade).length;
          return (
            <li key={s.id}>
              <Link to="/s/$id" params={{ id: s.id }} className="block rounded-lg bg-canvas px-3 py-2.5 hover:bg-canvas/80">
                <p className="text-sm font-medium">{s.name}</p>
                <p className="text-xs text-muted-foreground">
                  {s.city} · {n} open {n === 1 ? "call" : "calls"}
                </p>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}