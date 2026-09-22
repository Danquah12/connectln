import { createFileRoute, Link } from "@tanstack/react-router";
import { becomeTree, skillDna } from "@/lib/dna";
import { nextCredentials } from "@/lib/recommend";
import { personById, useForge } from "@/lib/store";
import { hiddenOpps } from "@/lib/xp";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/become")({ component: BecomePage });

function BecomePage() {
  const people = useForge((s) => s.people);
  const vouches = useForge((s) => s.vouches);
  const you = personById(people, useForge((s) => s.youId));
  if (!you) return null;
  const dna = skillDna(you);
  const tree = becomeTree(you);
  const next = nextCredentials(you);
  const hidden = hiddenOpps(you);
  const rec = vouches.filter((v) => v.toId === you.id).length;

  return (
    <div className="flex flex-col gap-4">
      <header>
        <h1 className="font-display text-4xl tracking-wide">What can I become?</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Skill combinations, not job titles. What you already have, and the one ticket in the way.
        </p>
      </header>

      <section className="rounded-xl bg-cream p-4 shadow-[var(--shadow-border)]">
        <h2 className="font-display text-2xl tracking-wide">Skill DNA</h2>
        <ul className="mt-3 space-y-3">
          {dna.map((d) => (
            <li key={d.title}>
              <p className="text-sm font-medium">{d.title}</p>
              <p className="text-xs text-muted-foreground">{d.why}</p>
              <p className="mt-1 text-xs">Have: {d.have.join(" · ")}</p>
              <p className="text-xs">Need: {d.need.join(" · ")}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-xl bg-cream p-4 shadow-[var(--shadow-border)]">
        <h2 className="font-display text-2xl tracking-wide">{tree.root}</h2>
        <ul className="mt-3 space-y-2">
          {tree.branches.map((b) => (
            <li key={b.label} className={cn("rounded-lg bg-canvas p-3", b.ready && "ring-1 ring-ok/40")}>
              <p className="text-sm font-medium">
                {b.label} {b.ready ? "· ready" : ""}
              </p>
              <p className="text-xs text-muted-foreground">Need: {b.need.join(" · ")}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-xl bg-ink px-5 py-5 text-cream">
        <h2 className="font-display text-2xl tracking-wide">Opportunity graph</h2>
        <p className="mt-2 text-sm text-cream/75">You</p>
        <p className="text-sm text-cream/75">→ {you.specialties.slice(0, 3).join(", ")}</p>
        <p className="text-sm text-cream/75">→ {you.tickets.length} tickets · {rec} vouches</p>
        <p className="text-sm text-cream/75">→ Missing: {next[0]}</p>
        <p className="text-sm text-cream/75">→ Hidden: {hidden[0]?.title}</p>
        <p className="mt-3 text-xs text-cream/55">
          Courses on{" "}
          <Link to="/learn" className="underline">
            Learn
          </Link>
          . Gigs on{" "}
          <Link to="/gigs" className="underline">
            Gigs
          </Link>
          .
        </p>
      </section>
    </div>
  );
}
