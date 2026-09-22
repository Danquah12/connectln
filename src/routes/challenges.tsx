import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { skillDemos } from "@/lib/board-seed";
import { personById, useForge } from "@/lib/store";

export const Route = createFileRoute("/challenges")({ component: ChallengesPage });

const QUIZ = [
  {
    id: "elec-1",
    title: "Electrician — diagnose this circuit",
    prompt: "Breaker holds. 120V at the panel, 0V at the load. First move?",
    options: [
      { t: "Replace the load", ok: false },
      { t: "Trace the run for an open", ok: true },
      { t: "Upsize the breaker", ok: false },
    ],
  },
  {
    id: "hvac-1",
    title: "HVAC — readings",
    prompt: "Superheat high, subcooling low on a TXV system. What's the call?",
    options: [
      { t: "Overcharge", ok: false },
      { t: "Undercharge", ok: true },
      { t: "Dirty condenser only", ok: false },
    ],
  },
];

function ChallengesPage() {
  const people = useForge((s) => s.people);
  const passed = useForge((s) => s.passedChallenges);
  const passChallenge = useForge((s) => s.passChallenge);
  const [pick, setPick] = useState<Record<string, number>>({});

  return (
    <div className="flex flex-col gap-4">
      <header>
        <h1 className="font-display text-4xl tracking-wide">Show what you can do</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          A still, a challenge, a verified review. Not a claim in a headline.
        </p>
      </header>

      <section className="rounded-xl bg-cream p-4 shadow-[var(--shadow-border)]">
        <h2 className="font-display text-2xl tracking-wide">Proof-of-skill library</h2>
        <ul className="mt-3 flex flex-col gap-3">
          {skillDemos.map((d) => {
            const who = personById(people, d.personId);
            const rev = personById(people, d.reviewerId);
            return (
              <li key={d.id} className="overflow-hidden rounded-lg bg-canvas">
                <div className="grid grid-cols-2">
                  {d.stills.map((s) => (
                    <img key={s} src={s} alt="" className="aspect-[4/3] w-full object-cover" />
                  ))}
                </div>
                <div className="p-3">
                  <p className="text-sm font-medium">{d.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {who?.name} · verified by {rev?.name} · {d.score.toFixed(1)}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      {QUIZ.map((q) => {
        const done = passed.includes(q.id);
        const chosen = pick[q.id];
        return (
          <section key={q.id} className="rounded-xl bg-cream p-4 shadow-[var(--shadow-border)]">
            <h2 className="font-display text-2xl tracking-wide">{q.title}</h2>
            <p className="mt-2 text-sm">{q.prompt}</p>
            <div className="mt-3 flex flex-col gap-2">
              {q.options.map((o, i) => (
                <Button
                  key={o.t}
                  variant={chosen === i ? "ink" : "outline"}
                  disabled={done}
                  onClick={() => setPick((p) => ({ ...p, [q.id]: i }))}
                >
                  {o.t}
                </Button>
              ))}
            </div>
            <div className="mt-3">
              {done ? (
                <Badge variant="ok">Passed</Badge>
              ) : (
                <Button
                  disabled={chosen === undefined}
                  onClick={() => {
                    const o = q.options[chosen ?? -1];
                    if (o?.ok) {
                      passChallenge(q.id);
                      toast("Challenge passed. It's on the passport.");
                    } else toast("Not that. Think about the path, not the part.");
                  }}
                >
                  Submit
                </Button>
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}
