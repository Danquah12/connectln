import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { personById, useForge } from "@/lib/store";
import type { GigMode } from "@/lib/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/gigs")({ component: GigsPage });

const MODES: { id: GigMode; label: string }[] = [
  { id: "full-time", label: "Full-time" },
  { id: "contract", label: "Contract" },
  { id: "part-time", label: "Part-time" },
  { id: "gigs", label: "Weekend / gigs" },
  { id: "emergency", label: "Emergency" },
  { id: "seasonal", label: "Seasonal" },
];

const MARKET = [
  {
    id: "kitchen",
    title: "Commercial kitchen renovate",
    city: "Denver",
    budget: "$40–60k",
    need: "Electrician + plumber + HVAC",
  },
  {
    id: "school-night",
    title: "School night work — three classrooms",
    city: "Aurora",
    budget: "T&M, union scale",
    need: "Electrician + carpenter",
  },
  {
    id: "clinic",
    title: "Clinic RTU + med gas punch",
    city: "Houston",
    budget: "$22–28k",
    need: "HVAC + plumber",
  },
];

function GigsPage() {
  const you = personById(useForge((s) => s.people), useForge((s) => s.youId));
  const gigModes = useForge((s) => s.gigModes);
  const setGigModes = useForge((s) => s.setGigModes);
  const bids = useForge((s) => s.bids);
  const bidProject = useForge((s) => s.bidProject);

  return (
    <div className="flex flex-col gap-4">
      <header>
        <h1 className="font-display text-4xl tracking-wide">Gig mode</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Full-time is not the only honest answer. Weekend, emergency, seasonal — say it on the card.
        </p>
      </header>
      <div className="flex flex-wrap gap-1.5">
        {MODES.map((m) => {
          const on = gigModes.includes(m.id);
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => {
                const next = on ? gigModes.filter((x) => x !== m.id) : [...gigModes, m.id];
                setGigModes(next.length ? next : ["contract"]);
                toast(on ? `Off: ${m.label}` : `On: ${m.label}`);
              }}
              className={cn(
                "h-9 rounded-full px-3 text-sm",
                on ? "bg-ok/20 text-ok" : "bg-cream text-muted-foreground",
              )}
            >
              {m.label}
            </button>
          );
        })}
      </div>
      {you ? (
        <p className="text-sm text-muted-foreground">Travel radius on your card: {you.travelMiles} miles.</p>
      ) : null}

      <section className="rounded-xl bg-cream p-4 shadow-[var(--shadow-border)]">
        <h2 className="font-display text-2xl tracking-wide">Project marketplace</h2>
        <p className="text-xs text-muted-foreground">Post a project. Form a crew. Bid. Not a job board essay.</p>
        <ul className="mt-3 space-y-3">
          {MARKET.map((p) => {
            const in_ = bids.some((b) => b.project === p.id);
            return (
              <li key={p.id} className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">{p.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {p.city} · {p.budget} · {p.need}
                  </p>
                </div>
                <Button
                  variant={in_ ? "ink" : "outline"}
                  disabled={in_}
                  onClick={() => {
                    bidProject(p.id);
                    toast("Bid in. The GC will see the crew.");
                  }}
                >
                  {in_ ? "Bid in" : "Bid with a crew"}
                </Button>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
