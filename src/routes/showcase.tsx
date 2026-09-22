import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { showcases } from "@/lib/market-seed";
import { personById, useForge } from "@/lib/store";

export const Route = createFileRoute("/showcase")({ component: ShowcasePage });

function ShowcasePage() {
  const people = useForge((s) => s.people);
  const startThread = useForge((s) => s.startThread);

  return (
    <div className="flex flex-col gap-4">
      <header>
        <h1 className="font-display text-4xl tracking-wide">Showcase</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Show what you built. Walkthroughs, not lifestyle. Hire from the still.
        </p>
      </header>
      <ul className="flex flex-col gap-3">
        {showcases.map((s) => {
          const who = personById(people, s.personId);
          return (
            <li key={s.id} className="overflow-hidden rounded-xl bg-cream shadow-[var(--shadow-border)]">
              <img src={s.still} alt="" className="aspect-[5/2] w-full object-cover" />
              <div className="p-4">
                <p className="text-[11px] uppercase text-muted-foreground">{s.kind}</p>
                <h2 className="font-display text-2xl tracking-wide">{s.title}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{s.blurb}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {who?.name} · {s.rating.toFixed(1)} · {s.views.toLocaleString()} views
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button variant="outline" asChild>
                    <Link to="/challenges">Watch / try</Link>
                  </Button>
                  {who ? (
                    <Button
                      onClick={() => {
                        startThread(who.id, `Saw ${s.title}. Need that on a job.`);
                        toast(`Opened a thread with ${who.name.split(" ")[0]}.`);
                      }}
                    >
                      Hire
                    </Button>
                  ) : null}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
