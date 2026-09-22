import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { personById, useForge } from "@/lib/store";
import { TWIN_PROMPTS, twinAnswer } from "@/lib/twin";

export const Route = createFileRoute("/twin")({ component: TwinPage });

function TwinPage() {
  const people = useForge((s) => s.people);
  const vouches = useForge((s) => s.vouches);
  const youId = useForge((s) => s.youId);
  const you = personById(people, youId);
  const [log, setLog] = useState<{ q: string; a: string }[]>([]);
  if (!you) return null;

  function ask(q: string) {
    setLog((prev) => [...prev, { q, a: twinAnswer(you!, vouches, q) }]);
  }

  return (
    <div className="flex flex-col gap-4">
      <header>
        <h1 className="font-display text-4xl tracking-wide">Career twin</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          It already knows the tickets, the jobs, the vouches, and what you said you want. Not a
          chatbot with a memory of nobody.
        </p>
        <p className="mt-2 text-sm italic text-muted-foreground">{you.intro}</p>
      </header>
      <div className="flex flex-wrap gap-2">
        {TWIN_PROMPTS.map((p) => (
          <Button key={p} variant="outline" onClick={() => ask(p)}>
            {p}
          </Button>
        ))}
      </div>
      <ul className="flex flex-col gap-3">
        {log.map((row, i) => (
          <li key={i} className="rounded-xl bg-cream p-4 shadow-[var(--shadow-border)]">
            <p className="text-xs text-muted-foreground">{row.q}</p>
            <p className="mt-2 text-sm leading-relaxed">{row.a}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
