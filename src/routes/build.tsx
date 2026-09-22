import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { collabs } from "@/lib/market-seed";
import { personById, useForge } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/build")({ component: BuildPage });

const STAGES = ["idea", "prototype", "crew", "shop"] as const;

function BuildPage() {
  const people = useForge((s) => s.people);
  const joinCollab = useForge((s) => s.joinCollab);
  const joined = useForge((s) => s.joinedCollab);
  const milestones = useForge((s) => s.milestones);
  const toggleMilestone = useForge((s) => s.toggleMilestone);
  const stage: (typeof STAGES)[number] = "crew";

  return (
    <div className="flex flex-col gap-4">
      <header>
        <h1 className="font-display text-4xl tracking-wide">Build</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Form a crew. Turn a punch list into a shop. Milestones instead of a handshake in a parking lot.
        </p>
      </header>

      <section className="rounded-xl bg-cream p-4 shadow-[var(--shadow-border)]">
        <h2 className="font-display text-2xl tracking-wide">Shop stage — Vega Mechanical</h2>
        <ol className="mt-3 flex flex-wrap gap-2 text-sm">
          {STAGES.map((s) => (
            <li
              key={s}
              className={cn(
                "rounded-full px-3 py-1 capitalize",
                s === stage ? "bg-ink text-cream" : "bg-canvas text-muted-foreground",
              )}
            >
              {s}
            </li>
          ))}
        </ol>
        <p className="mt-2 text-xs text-muted-foreground">Needs: bonding, one more j-man, a real estimator.</p>
      </section>

      <section className="rounded-xl bg-cream p-4 shadow-[var(--shadow-border)]">
        <h2 className="font-display text-2xl tracking-wide">Looking for a crew</h2>
        <ul className="mt-3 space-y-3">
          {collabs.map((c) => {
            const a = personById(people, c.authorId);
            const on = joined.includes(c.id);
            return (
              <li key={c.id} className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">{c.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {c.city} · {c.need.join(" + ")} · {a?.name}
                  </p>
                </div>
                <Button
                  variant={on ? "ink" : "outline"}
                  disabled={on}
                  onClick={() => {
                    joinCollab(c.id);
                    toast("You're on the crew list.");
                  }}
                >
                  {on ? "On the crew" : "Join"}
                </Button>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="rounded-xl bg-cream p-4 shadow-[var(--shadow-border)]">
        <h2 className="font-display text-2xl tracking-wide">Contract milestones</h2>
        <ul className="mt-3 space-y-2">
          {milestones.map((m) => (
            <li key={m.id}>
              <button
                type="button"
                onClick={() => toggleMilestone(m.id)}
                className="flex w-full items-center justify-between text-sm"
              >
                <span>{m.label}</span>
                <span className={m.done ? "text-ok" : "text-muted-foreground"}>{m.done ? "✓" : "open"}</span>
              </button>
            </li>
          ))}
        </ul>
      </section>

      <p className="text-xs text-muted-foreground">
        Crew picker:{" "}
        <Link to="/crew" className="text-brick hover:underline">
          Crew builder
        </Link>
        . Bids:{" "}
        <Link to="/gigs" className="text-brick hover:underline">
          Gigs
        </Link>
        .
      </p>
    </div>
  );
}
