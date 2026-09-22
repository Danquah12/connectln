import { createFileRoute, Link } from "@tanstack/react-router";
import { Portrait } from "@/components/portrait";
import { achievements } from "@/lib/achievements";
import { personById, useForge } from "@/lib/store";

export const Route = createFileRoute("/legacy/$id")({ component: LegacyPage });

function LegacyPage() {
  const { id } = Route.useParams();
  const people = useForge((s) => s.people);
  const vouches = useForge((s) => s.vouches);
  const person = personById(people, id);
  if (!person) return <p className="py-16 text-center text-sm text-muted-foreground">No legacy on file.</p>;
  const badges = achievements(person, vouches);
  const trained = people.filter(
    (p) => p.menteeOf === person.id || (person.mentoring && p.seekingMentor && p.trade === person.trade),
  );
  const mentor = person.menteeOf ? personById(people, person.menteeOf) : people.find((p) => p.mentoring && p.trade === person.trade && p.id !== person.id && p.years > person.years);

  return (
    <div className="flex flex-col gap-4">
      <header>
        <h1 className="font-display text-4xl tracking-wide">Professional legacy</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {person.name}. The work, the people they trained, the tree — not a eulogy template.
        </p>
      </header>
      <section className="rounded-xl bg-cream p-4 shadow-[var(--shadow-border)]">
        <div className="flex items-center gap-3">
          <Portrait person={person} size="lg" link={false} />
          <div>
            <p className="font-medium">{person.name}</p>
            <p className="text-sm text-muted-foreground">
              {person.years} years · {person.trade}
            </p>
          </div>
        </div>
        <p className="mt-3 text-sm leading-relaxed">{person.bio}</p>
        <p className="mt-3 text-xs text-muted-foreground">{badges.map((b) => b.label).join(" · ")}</p>
      </section>
      <section className="rounded-xl bg-cream p-4 shadow-[var(--shadow-border)]">
        <h2 className="font-display text-2xl tracking-wide">Mentored by → trained</h2>
        <p className="mt-3 text-sm">
          {mentor ? (
            <>
              <Link to="/p/$id" params={{ id: mentor.id }} className="text-brick hover:underline">
                {mentor.name}
              </Link>
              {" → "}
            </>
          ) : null}
          <span className="font-medium">{person.name}</span>
          {trained.length ? " → " : null}
          {trained.map((p, i) => (
            <span key={p.id}>
              {i ? ", " : ""}
              <Link to="/p/$id" params={{ id: p.id }} className="text-brick hover:underline">
                {p.name}
              </Link>
            </span>
          ))}
        </p>
      </section>
      <section className="rounded-xl bg-cream p-4 shadow-[var(--shadow-border)]">
        <h2 className="font-display text-2xl tracking-wide">Jobsites</h2>
        <ul className="mt-2 space-y-1 text-sm">
          {person.history.map((h) => (
            <li key={h.id}>
              {h.when} · {h.name} · {h.role}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
