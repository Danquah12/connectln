import { createFileRoute, Link } from "@tanstack/react-router";
import { cohorts } from "@/lib/seed";
import { useForge } from "@/lib/store";

export const Route = createFileRoute("/cohorts")({ component: CohortsPage });

function CohortsPage() {
  const people = useForge((s) => s.people);
  const looking = (ids: string[]) =>
    ids.filter((id) => people.find((p) => p.id === id)?.availability === "open").length;

  return (
    <div className="flex flex-col gap-4">
      <header>
        <h1 className="font-display text-4xl tracking-wide">Cohorts</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Apprenticeship classes, units, nursing programs, teacher prep. Not a school brand.
        </p>
      </header>
      <ul className="flex flex-col gap-2">
        {cohorts.map((c) => (
          <li key={c.id}>
            <Link
              to="/c/$id"
              params={{ id: c.id }}
              className="block rounded-xl bg-cream p-4 shadow-[var(--shadow-border)] hover:shadow-[var(--shadow-border-hover)]"
            >
              <p className="font-medium">{c.name}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {c.place} · {c.year} · {c.memberIds.length} members · {looking(c.memberIds)} open
                to calls
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
