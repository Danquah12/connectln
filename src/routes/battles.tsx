import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useForge } from "@/lib/store";

export const Route = createFileRoute("/battles")({ component: BattlesPage });

const AWARDS = [
  { title: "Best electrician", name: "Tomasz Kowalski", place: "CO" },
  { title: "Best welder", name: "DeShawn Brooks", place: "IL" },
  { title: "Best HVAC", name: "Patty Nguyen", place: "OR" },
  { title: "Best mentor", name: "Ruth Alvarez", place: "TX" },
  { title: "Best apprentice", name: "Keisha Owens", place: "CO" },
];

function BattlesPage() {
  const wins = useForge((s) => s.battleWins);
  const winBattle = useForge((s) => s.winBattle);
  const [pick, setPick] = useState<number | null>(null);
  const correct = 1;

  return (
    <div className="flex flex-col gap-4">
      <header>
        <h1 className="font-display text-4xl tracking-wide">Challenges and awards</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Same diagnostic, two tickets. Not a fighting game. Regional awards stay on the passport.
        </p>
      </header>
      <section className="rounded-xl bg-cream p-4 shadow-[var(--shadow-border)]">
        <h2 className="font-display text-2xl tracking-wide">Advanced troubleshooting</h2>
        <p className="mt-2 text-sm">
          277V lighting circuit. Voltage at the panel, nothing at the last fixture. First move?
        </p>
        {["Replace the ballast", "Walk the homerun for an open", "Upsize the breaker"].map((t, i) => (
          <Button
            key={t}
            variant={pick === i ? "ink" : "outline"}
            className="mt-2 w-full justify-start"
            onClick={() => setPick(i)}
          >
            {t}
          </Button>
        ))}
        <Button
          className="mt-3"
          disabled={pick === null}
          onClick={() => {
            if (pick === correct) {
              winBattle();
              toast("96. You're on the board with Marcus.");
            } else toast("Marcus had 96. Trace the run.");
          }}
        >
          Submit
        </Button>
        <ol className="mt-4 space-y-1 text-sm">
          <li>1. Marcus — 96</li>
          <li>2. You — {wins ? 94 + Math.min(wins, 4) : "—"}</li>
          <li>3. James — 91</li>
        </ol>
      </section>
      <section className="rounded-xl bg-cream p-4 shadow-[var(--shadow-border)]">
        <h2 className="font-display text-2xl tracking-wide">Regional awards</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {AWARDS.map((a) => (
            <li key={a.title}>
              {a.title} · {a.name} · {a.place}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
