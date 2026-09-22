import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { interviewQs, scoreAnswer } from "@/lib/interview";
import { personById, useForge } from "@/lib/store";

export const Route = createFileRoute("/interview")({ component: InterviewPage });

const ASYNC = [
  "Walk a job that went wrong.",
  "What tickets are current, and what lapses next?",
  "Who will vouch, and from which job?",
  "When can you start, and what's the floor on rate?",
  "What will you not do on this crew?",
];

function InterviewPage() {
  const you = personById(useForge((s) => s.people), useForge((s) => s.youId));
  const qs = you ? interviewQs(you) : [];
  const [i, setI] = useState(0);
  const [draft, setDraft] = useState("");
  const [scores, setScores] = useState<{ tech: number; talk: number; solve: number } | null>(null);
  const [clips, setClips] = useState<string[]>([]);

  return (
    <div className="flex flex-col gap-4">
      <header>
        <h1 className="font-display text-4xl tracking-wide">Practice interview</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Technical questions for the ticket you actually hold. Then a five-clip async for a shop.
        </p>
      </header>
      {qs[i] ? (
        <section className="rounded-xl bg-cream p-4 shadow-[var(--shadow-border)]">
          <p className="text-xs text-muted-foreground">
            You're interviewing for a {you?.trade.toLowerCase()} seat.
          </p>
          <p className="mt-2 text-sm font-medium">{qs[i]!.q}</p>
          <Textarea className="mt-3" value={draft} onChange={(e) => setDraft(e.target.value)} />
          <Button
            className="mt-3"
            disabled={!draft.trim()}
            onClick={() => {
              setScores(scoreAnswer(draft, qs[i]!.keys));
              setDraft("");
              setI((n) => Math.min(n + 1, qs.length - 1));
            }}
          >
            Answer
          </Button>
          {scores ? (
            <dl className="mt-4 grid grid-cols-3 gap-2 text-sm">
              <div>
                <dt className="text-[11px] text-muted-foreground">Technical</dt>
                <dd className="font-display text-2xl tabular-nums">{scores.tech}</dd>
              </div>
              <div>
                <dt className="text-[11px] text-muted-foreground">Talk</dt>
                <dd className="font-display text-2xl tabular-nums">{scores.talk}</dd>
              </div>
              <div>
                <dt className="text-[11px] text-muted-foreground">Solve</dt>
                <dd className="font-display text-2xl tabular-nums">{scores.solve}</dd>
              </div>
            </dl>
          ) : null}
        </section>
      ) : null}

      <section className="rounded-xl bg-cream p-4 shadow-[var(--shadow-border)]">
        <h2 className="font-display text-2xl tracking-wide">Async clips</h2>
        <p className="text-xs text-muted-foreground">Five questions. The shop watches when they have time.</p>
        <ul className="mt-3 space-y-3">
          {ASYNC.map((q) => {
            const done = clips.includes(q);
            return (
              <li key={q} className="flex items-start justify-between gap-3">
                <p className="text-sm">{q}</p>
                <Button
                  variant={done ? "ink" : "outline"}
                  disabled={done}
                  onClick={() => setClips((c) => [...c, q])}
                >
                  {done ? "Clip on file (0:32)" : "Record"}
                </Button>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
