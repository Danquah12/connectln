import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Portrait } from "@/components/portrait";
import { Badge } from "@/components/ui/badge";
import { projects } from "@/lib/seed";
import { useForge } from "@/lib/store";
import type { Trade } from "@/lib/types";

export const Route = createFileRoute("/crew")({ component: CrewPage });

const NEED: { trade: Trade; n: number }[] = [
  { trade: "Electrician", n: 2 },
  { trade: "Plumber", n: 2 },
  { trade: "HVAC", n: 1 },
  { trade: "Carpenter", n: 4 },
];

function CrewPage() {
  const people = useForge((s) => s.people);
  const [site, setSite] = useState(projects[0]!.id);
  const project = projects.find((p) => p.id === site) ?? projects[0]!;
  const together = useMemo(() => {
    const ids = new Set(project.memberIds);
    return people.filter((p) => ids.has(p.id));
  }, [people, project]);

  const recs = NEED.flatMap(({ trade, n }) => {
    const known = together.filter((p) => p.trade === trade).slice(0, n);
    const fill = people
      .filter((p) => p.trade === trade && p.availability === "open" && !known.includes(p))
      .slice(0, Math.max(0, n - known.length));
    return [...known, ...fill].slice(0, n);
  });

  return (
    <div className="flex flex-col gap-4">
      <header>
        <h1 className="font-display text-4xl tracking-wide">Crew builder</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          People who have already stood on the same floor beat a cold roster.
        </p>
      </header>
      <div className="flex gap-1.5 overflow-x-auto">
        {projects.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setSite(p.id)}
            className={
              site === p.id
                ? "h-9 shrink-0 rounded-full bg-ink px-3 text-sm text-cream"
                : "h-9 shrink-0 rounded-full bg-cream px-3 text-sm text-muted-foreground"
            }
          >
            {p.name}
          </button>
        ))}
      </div>
      <p className="text-sm text-muted-foreground">
        {together.length} people from {project.name} already overlap. Compatibility is the work,
        not a score.
      </p>
      <ul className="flex flex-col gap-2">
        {recs.map((p) => (
          <li key={p.id}>
            <Link
              to="/p/$id"
              params={{ id: p.id }}
              className="flex items-center gap-3 rounded-xl bg-cream p-3 shadow-[var(--shadow-border)]"
            >
              <Portrait person={p} size="lg" link={false} />
              <div className="min-w-0 flex-1">
                <p className="font-medium">{p.name}</p>
                <p className="text-sm text-muted-foreground">
                  {p.trade} · {p.city}
                </p>
              </div>
              {project.memberIds.includes(p.id) ? (
                <Badge variant="ok">Worked this job</Badge>
              ) : (
                <Badge variant="muted">Open</Badge>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
