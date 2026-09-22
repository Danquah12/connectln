import { Link } from "@tanstack/react-router";
import { Portrait } from "@/components/portrait";
import { crewWatch } from "@/lib/crew-watch";
import { personById, useForge } from "@/lib/store";
import { cn } from "@/lib/utils";

export function CrewWatch() {
  const people = useForge((s) => s.people);
  const calls = useForge((s) => s.calls);
  const youId = useForge((s) => s.youId);
  const hires = useForge((s) => s.callHires);
  const you = personById(people, youId);
  if (!you) return null;
  const posted = calls.some((c) => c.postedBy === youId);
  if (!posted) return null;
  const rows = crewWatch({ youId, calls, people, hires });

  return (
    <section className="rounded-xl bg-ink px-5 py-4 text-cream">
      <p className="text-[11px] tracking-wide text-cream/55 uppercase">60-day desk</p>
      <p className="mt-1 font-display text-2xl tracking-wide">
        {rows.length ? "Crew tickets at risk" : "Crew tickets are current"}
      </p>
      <p className="mt-1 text-sm text-cream/70">
        Hired people only. Lapsed or unverified fails their next call. Inside 60 days is a warning.
      </p>
      {rows.length ? (
        <ul className="mt-3 space-y-2">
          {rows.map((row) => (
            <li key={`${row.callId}-${row.person.id}-${row.required}`} className="flex items-center gap-2">
              <Portrait person={row.person} size="sm" link={false} />
              <span className="min-w-0 text-sm">
                <Link to="/p/$id" params={{ id: row.person.id }} className="hover:underline">
                  {row.person.name}
                </Link>
                <span
                  className={cn(
                    "text-cream/70",
                    row.status === "lapsed" && "text-brick",
                    row.status === "soon" && "text-warn",
                  )}
                >
                  {" "}
                  · {row.required} · {row.label} · {row.callTitle}
                </span>
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-cream/70">
          Hire from{" "}
          <Link to="/find" className="text-cream underline">
            Find crew
          </Link>
          . Their tickets stay on this desk until the job turns.
        </p>
      )}
    </section>
  );
}
