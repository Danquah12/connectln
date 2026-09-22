import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { meets } from "@/lib/hall-seed";
import { personById, useForge } from "@/lib/store";

export const Route = createFileRoute("/events")({ component: EventsPage });

function EventsPage() {
  const people = useForge((s) => s.people);
  const you = personById(people, useForge((s) => s.youId));
  const rsvpIds = useForge((s) => s.rsvpIds);
  const toggleRsvp = useForge((s) => s.toggleRsvp);
  const yours = you
    ? meets.filter((m) => !m.trades?.length || m.trades.includes(you.trade) || you.veteran)
    : meets;
  const rest = meets.filter((m) => !yours.includes(m));

  return (
    <div className="flex flex-col gap-4">
      <header>
        <h1 className="font-display text-4xl tracking-wide">On the calendar</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Classes, CE, fairs, drills. A start time — not a webinar dump.
        </p>
      </header>
      <List
        title="Your hall"
        rows={yours}
        rsvpIds={rsvpIds}
        onToggle={(id, on) => {
          toggleRsvp(id);
          toast(on ? "Off the list." : "You're on the list.");
        }}
      />
      {rest.length ? (
        <List
          title="Other shops"
          rows={rest}
          rsvpIds={rsvpIds}
          onToggle={(id, on) => {
            toggleRsvp(id);
            toast(on ? "Off the list." : "You're on the list.");
          }}
        />
      ) : null}
      <p className="text-xs text-muted-foreground">
        Funding that actually pays the class sits on{" "}
        <Link to="/fund" className="text-brick hover:underline">
          Funding
        </Link>
        .
      </p>
    </div>
  );
}

function List({
  title,
  rows,
  rsvpIds,
  onToggle,
}: {
  title: string;
  rows: typeof meets;
  rsvpIds: string[];
  onToggle: (id: string, on: boolean) => void;
}) {
  return (
    <section className="rounded-xl bg-cream p-4 shadow-[var(--shadow-border)]">
      <h2 className="font-display text-2xl tracking-wide">{title}</h2>
      <ul className="mt-3 space-y-3">
        {rows.map((m) => {
          const on = rsvpIds.includes(m.id);
          return (
            <li key={m.id} className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium">{m.title}</p>
                <p className="text-xs text-muted-foreground">
                  {m.place} · {m.when} · {m.kind}
                  {m.trades?.length ? ` · ${m.trades.join(", ")}` : ""}
                </p>
                {m.blurb ? <p className="mt-1 text-sm">{m.blurb}</p> : null}
              </div>
              <Button variant={on ? "ink" : "outline"} size="sm" onClick={() => onToggle(m.id, on)}>
                {on ? "Going" : "I'll be there"}
              </Button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
