import { createFileRoute, Link } from "@tanstack/react-router";
import { Portrait } from "@/components/portrait";
import { TicketPlate } from "@/components/ticket-plate";
import { careerTrack } from "@/lib/tracks";
import { personById, useForge } from "@/lib/store";

export const Route = createFileRoute("/student/$id")({ component: StudentPage });

function StudentPage() {
  const { id } = Route.useParams();
  const people = useForge((s) => s.people);
  const person = personById(people, id);
  if (!person) return <p className="py-16 text-center text-sm text-muted-foreground">No portfolio.</p>;
  const track = careerTrack(person);

  return (
    <div className="flex flex-col gap-4">
      <header className="flex items-center gap-3">
        <Portrait person={person} size="lg" link={false} />
        <div>
          <h1 className="font-display text-4xl tracking-wide">Apprentice / student card</h1>
          <p className="text-sm text-muted-foreground">
            {person.name} · hours, tickets, jobs — share with a JATC or a principal.
          </p>
        </div>
      </header>
      <section className="rounded-xl bg-cream p-4 shadow-[var(--shadow-border)]">
        <h2 className="font-display text-2xl tracking-wide">Hours and path</h2>
        <p className="mt-2 font-display text-4xl tabular-nums">{track.percent}%</p>
        <p className="text-sm text-muted-foreground">Next: {track.next}</p>
      </section>
      <section className="rounded-xl bg-cream p-4 shadow-[var(--shadow-border)]">
        <h2 className="font-display text-2xl tracking-wide">Tickets</h2>
        <div className="mt-3 flex gap-2 overflow-x-auto">
          {person.tickets.map((t) => (
            <TicketPlate key={t.id} ticket={t} />
          ))}
        </div>
      </section>
      <section className="rounded-xl bg-cream p-4 shadow-[var(--shadow-border)]">
        <h2 className="font-display text-2xl tracking-wide">Jobsites</h2>
        <ul className="mt-2 space-y-1 text-sm">
          {person.history.map((h) => (
            <li key={h.id}>
              {h.name} · {h.role} · {h.when}
            </li>
          ))}
        </ul>
      </section>
      <p className="text-xs text-muted-foreground">
        Public profile:{" "}
        <Link to="/p/$id" params={{ id: person.id }} className="text-brick hover:underline">
          {person.name}
        </Link>
        .
      </p>
    </div>
  );
}
