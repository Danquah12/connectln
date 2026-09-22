import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Portrait } from "@/components/portrait";
import { personById, useForge } from "@/lib/store";

export const Route = createFileRoute("/near")({ component: NearPage });

function NearPage() {
  const people = useForge((s) => s.people);
  const you = personById(people, useForge((s) => s.youId));
  const [radius, setRadius] = useState(you?.travelMiles ?? 80);

  const nearby = useMemo(() => {
    if (!you) return [];
    return people.filter((p) => {
      if (p.id === you.id) return false;
      if (p.state !== you.state && p.city !== you.city) return false;
      const miles = p.city === you.city ? 8 : 40;
      return miles <= radius && miles <= p.travelMiles + 10;
    });
  }, [people, you, radius]);

  const counts = nearby.reduce<Record<string, number>>((acc, p) => {
    acc[p.trade] = (acc[p.trade] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="flex flex-col gap-4">
      <header>
        <h1 className="font-display text-4xl tracking-wide">Who's working near me</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          City and state, not a pin on their house. Travel radius is on the card.
        </p>
      </header>
      <label className="text-sm">
        Your radius: {radius} miles
        <input
          type="range"
          min={10}
          max={200}
          value={radius}
          onChange={(e) => setRadius(Number(e.target.value))}
          className="mt-2 block w-full"
        />
      </label>
      <ul className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-3">
        {Object.entries(counts).map(([t, n]) => (
          <li key={t} className="rounded-lg bg-cream p-3">
            {n} {t.toLowerCase()}
            {n === 1 ? "" : "s"}
          </li>
        ))}
      </ul>
      <ul className="flex flex-col gap-2">
        {nearby.map((p) => (
          <li key={p.id}>
            <Link
              to="/p/$id"
              params={{ id: p.id }}
              className="flex items-center gap-3 rounded-xl bg-cream p-3 shadow-[var(--shadow-border)]"
            >
              <Portrait person={p} size="lg" link={false} />
              <div>
                <p className="font-medium">{p.name}</p>
                <p className="text-sm text-muted-foreground">
                  {p.trade} · {p.city} · will travel {p.travelMiles} mi
                </p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
