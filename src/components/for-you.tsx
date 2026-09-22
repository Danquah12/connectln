import { Link } from "@tanstack/react-router";
import { Portrait } from "@/components/portrait";
import { forYou } from "@/lib/intel";
import { personById, useForge } from "@/lib/store";

const KIND: Record<string, string> = {
  call: "Call",
  person: "Hall",
  mentor: "Mentor",
  lane: "Lane they miss",
  ticket: "Next paper",
};

export function ForYou() {
  const people = useForge((s) => s.people);
  const youId = useForge((s) => s.youId);
  const vouches = useForge((s) => s.vouches);
  const calls = useForge((s) => s.calls);
  const appliedCallIds = useForge((s) => s.appliedCallIds);
  const you = personById(people, youId);
  if (!you) return null;

  const items = forYou({ you, people, calls, vouches, appliedCallIds });
  if (!items.length) return null;

  return (
    <section className="rounded-xl bg-cream p-4 shadow-[var(--shadow-border)] sm:p-5">
      <h2 className="font-display text-2xl tracking-wide">Why this hall</h2>
      <p className="text-xs text-muted-foreground">
        Not a title match. Tickets, jobsites, vouches, and the next chair.
      </p>
      <ul className="mt-3 flex flex-col gap-2">
        {items.map((item) => {
          const person = item.personId ? personById(people, item.personId) : undefined;
          return (
            <li key={item.id}>
              <Link
                to={item.href}
                className="flex items-start gap-3 rounded-lg bg-canvas px-3 py-2.5 hover:bg-canvas/80"
              >
                {person ? (
                  <Portrait person={person} size="sm" link={false} />
                ) : (
                  <span className="mt-0.5 w-16 shrink-0 text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
                    {KIND[item.kind]}
                  </span>
                )}
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium">{item.title}</span>
                  <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">
                    {item.why}
                  </span>
                  {item.missing?.length ? (
                    <span className="mt-0.5 block text-[11px] text-warn">
                      Missing {item.missing.join(", ")}
                    </span>
                  ) : null}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
