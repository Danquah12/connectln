import { createFileRoute, Link } from "@tanstack/react-router";
import { shops } from "@/lib/seed";
import { personById, useForge } from "@/lib/store";

export const Route = createFileRoute("/circles")({ component: CirclesPage });

function CirclesPage() {
  const people = useForge((s) => s.people);
  const masters = people.filter((p) => p.level === "Master" || p.level === "Owner");
  const vets = people.filter((p) => p.veteran);
  const hospital = people.filter((p) =>
    p.specialties.join(" ").toLowerCase().includes("hospital") ||
    p.history.some((h) => h.name.toLowerCase().includes("hospital") || h.name.toLowerCase().includes("clinic")),
  );
  const apex = shops[0]!;

  return (
    <div className="flex flex-col gap-4">
      <header>
        <h1 className="font-display text-4xl tracking-wide">Circles</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Ticket-gated rooms. Shop rooms after they hire you. Not a branding club.
        </p>
      </header>
      {[
        { title: "Master electricians / shop owners", who: masters, gate: "Master or owner ticket" },
        { title: "Former military → trades / care / classroom", who: vets, gate: "MOS on the card" },
        { title: "Hospital work", who: hospital, gate: "Hospital / clinic jobsite" },
      ].map((c) => (
        <section key={c.title} className="rounded-xl bg-cream p-4 shadow-[var(--shadow-border)]">
          <h2 className="font-display text-2xl tracking-wide">{c.title}</h2>
          <p className="text-xs text-muted-foreground">{c.gate} · {c.who.length} on the board</p>
          <ul className="mt-2 space-y-1 text-sm">
            {c.who.slice(0, 6).map((p) => (
              <li key={p.id}>
                <Link to="/p/$id" params={{ id: p.id }} className="hover:underline">
                  {p.name} · {p.trade}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
      <section className="rounded-xl bg-ink px-5 py-5 text-cream">
        <h2 className="font-display text-2xl tracking-wide">{apex.name} workforce</h2>
        <p className="mt-1 text-sm text-cream/70">Private. Announcements, tickets, internal calls.</p>
        <ul className="mt-3 space-y-1 text-sm text-cream/85">
          <li>Night shift on Aurora schools — still two spots</li>
          <li>OSHA 30 refresh Saturday at the JATC</li>
          <li>Hospital wing punch list due Friday</li>
        </ul>
        <p className="mt-3 text-xs text-cream/55">
          {apex.staffIds.map((id) => personById(people, id)?.name).filter(Boolean).join(" · ")}
        </p>
      </section>
    </div>
  );
}
