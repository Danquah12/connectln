import { createFileRoute, Link } from "@tanstack/react-router";
import { Portrait } from "@/components/portrait";
import { Badge } from "@/components/ui/badge";
import { availabilityLabel, rankLabel } from "@/lib/format";
import { cohorts } from "@/lib/seed";
import { personById, useForge } from "@/lib/store";

export const Route = createFileRoute("/c/$id")({ component: CohortPage });

function CohortPage() {
  const { id } = Route.useParams();
  const people = useForge((s) => s.people);
  const cohort = cohorts.find((c) => c.id === id);
  if (!cohort) {
    return <p className="py-16 text-center text-sm text-muted-foreground">No cohort by that name.</p>;
  }
  const members = cohort.memberIds.map((mid) => personById(people, mid)).filter(Boolean);
  const open = members.filter((p) => p && p.availability === "open").length;
  const mentors = members.filter((p) => p?.mentoring).length;

  return (
    <div className="flex flex-col gap-4">
      <header>
        <p className="text-[11px] tracking-wide text-muted-foreground uppercase">
          <Link to="/cohorts" className="hover:text-ink">
            Cohorts
          </Link>
        </p>
        <h1 className="font-display text-4xl tracking-wide">{cohort.name}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {cohort.place} · {members.length} members · {open} looking · {mentors} mentors
        </p>
      </header>
      <ul className="flex flex-col gap-2">
        {members.map((p) =>
          p ? (
            <li key={p.id}>
              <Link
                to="/p/$id"
                params={{ id: p.id }}
                className="flex items-center gap-3 rounded-xl bg-cream p-3 shadow-[var(--shadow-border)]"
              >
                <Portrait person={p} size="lg" link={false} />
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{p.name}</p>
                  <p className="truncate text-sm text-muted-foreground">
                    {rankLabel(p.level, p.trade)} · {p.city}
                  </p>
                </div>
                <Badge variant={p.availability === "open" ? "ok" : "muted"}>
                  {availabilityLabel(p.availability)}
                </Badge>
              </Link>
            </li>
          ) : null,
        )}
      </ul>
    </div>
  );
}
