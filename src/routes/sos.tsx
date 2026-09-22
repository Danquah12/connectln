import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { CallCard } from "@/components/call-card";
import { Portrait } from "@/components/portrait";
import { Button } from "@/components/ui/button";
import { personById, useForge } from "@/lib/store";

export const Route = createFileRoute("/sos")({ component: SosPage });

function SosPage() {
  const calls = useForge((s) => s.calls);
  const people = useForge((s) => s.people);
  const youId = useForge((s) => s.youId);
  const you = personById(people, youId);
  const toggleDisaster = useForge((s) => s.toggleDisaster);
  const urgent = calls.filter((c) => c.urgent);
  const ready = people.filter((p) => p.disaster);
  const counts = ready.reduce<Record<string, number>>((acc, p) => {
    acc[p.trade] = (acc[p.trade] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="flex flex-col gap-4">
      <header>
        <h1 className="font-display text-4xl tracking-wide">SOS</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Water main, storm, hospital wing. Nearby tickets, not a press release.
        </p>
      </header>
      {you ? (
        <div className="rounded-xl bg-cream p-4 shadow-[var(--shadow-border)]">
          <p className="text-sm font-medium">Disaster response network</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Opt in and shops can find you when the lights go. No brand campaign.
          </p>
          <Button className="mt-3" variant={you.disaster ? "ink" : "outline"} onClick={() => {
            toggleDisaster();
            toast(you.disaster ? "You're off the list." : "You're on the disaster list.");
          }}>
            {you.disaster ? "On the list" : "Opt in"}
          </Button>
          <ul className="mt-4 grid grid-cols-2 gap-2 text-sm sm:grid-cols-3">
            {Object.entries(counts).map(([t, n]) => (
              <li key={t}>
                {n} {t.toLowerCase()}
                {n === 1 ? "" : "s"}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {urgent.map((c) => (
        <CallCard key={c.id} call={c} />
      ))}

      <section className="rounded-xl bg-cream p-4 shadow-[var(--shadow-border)]">
        <h2 className="font-display text-2xl tracking-wide">On the list</h2>
        <ul className="mt-3 flex gap-3 overflow-x-auto">
          {ready.slice(0, 12).map((p) => (
            <li key={p.id} className="w-28 shrink-0">
              <Portrait person={p} size="lg" />
              <p className="mt-1 truncate text-xs">{p.name}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
