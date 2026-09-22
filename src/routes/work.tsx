import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { CallCard } from "@/components/call-card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { fitScore } from "@/lib/fit";
import { personById, useForge } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/work")({ component: WorkPage });

const TABS = ["jobs", "contracts", "gigs", "interns", "mentor"] as const;

function WorkPage() {
  const calls = useForge((s) => s.calls);
  const people = useForge((s) => s.people);
  const you = personById(people, useForge((s) => s.youId));
  const propose = useForge((s) => s.propose);
  const proposals = useForge((s) => s.proposals);
  const [tab, setTab] = useState<(typeof TABS)[number]>("jobs");
  const [body, setBody] = useState("");

  const visible = useMemo(() => {
    if (tab === "gigs") return calls.filter((c) => c.shift || c.urgent || c.duration.includes("shift") || c.duration.includes("72"));
    if (tab === "interns") return calls.filter((c) => c.trade === "Electrician" && c.title.toLowerCase().includes("school"));
    if (tab === "contracts") return calls.filter((c) => c.travel || c.duration.includes("month") || c.duration.includes("week"));
    if (tab === "mentor") return [];
    return calls.filter((c) => !c.shift && !c.urgent);
  }, [calls, tab]);

  return (
    <div className="flex flex-col gap-4">
      <header>
        <h1 className="font-display text-4xl tracking-wide">Work</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Jobs, contracts, gigs, intern seats, mentoring. One profile. Apply once.
        </p>
      </header>
      <div className="flex flex-wrap gap-1.5">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={cn(
              "h-9 rounded-full px-3 text-sm capitalize",
              tab === t ? "bg-ink text-cream" : "bg-cream text-muted-foreground",
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "mentor" ? (
        <p className="text-sm">
          Mentors live on{" "}
          <Link to="/mentors" className="text-brick hover:underline">
            Mentors
          </Link>
          .
        </p>
      ) : (
        visible.map((c) => {
          const fit = you ? fitScore(you, c) : null;
          return (
            <div key={c.id} className="flex flex-col gap-2">
              <CallCard call={c} />
              {fit ? (
                <p className="px-1 text-xs text-muted-foreground">
                  Match {fit.score}%
                  {fit.missing.length ? ` · missing ${fit.missing.join(", ")}` : " · apply with your card"}
                </p>
              ) : null}
            </div>
          );
        })
      )}

      {tab === "contracts" ? (
        <section className="rounded-xl bg-cream p-4 shadow-[var(--shadow-border)]">
          <h2 className="font-display text-2xl tracking-wide">Jackets</h2>
          <p className="text-sm text-muted-foreground">
            Award, crew, milestones, pay — not a cover letter.
          </p>
          <Link to="/contracts" className="mt-2 inline-block text-sm text-brick hover:underline">
            Open contract desk
          </Link>
          <Textarea
            className="mt-2"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Crew, tickets, start date. Skip the cover letter."
          />
          <Button
            className="mt-3"
            disabled={!body.trim()}
            onClick={() => {
              propose("contract", body);
              setBody("");
              toast("Proposal on the shop's desk.");
            }}
          >
            Submit proposal
          </Button>
          {proposals.length ? (
            <p className="mt-2 text-xs text-muted-foreground">{proposals.length} out.</p>
          ) : null}
        </section>
      ) : null}

      <p className="text-xs text-muted-foreground">
        Need a crew first?{" "}
        <Link to="/build" className="text-brick hover:underline">
          Build
        </Link>
        .
      </p>
    </div>
  );
}
