import { createFileRoute, Link } from "@tanstack/react-router";
import { seedLectures, formatTalkTime } from "@/lib/lecture-seed";
import { personById, useForge } from "@/lib/store";

export const Route = createFileRoute("/present")({ component: PresentPage });

function PresentPage() {
  const people = useForge((s) => s.people);
  return (
    <div className="flex flex-col gap-4">
      <header>
        <h1 className="font-display text-4xl tracking-wide">Five-minute talks</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Professors and teachers get five minutes to explain the unit — full person in the
          frame, not a six-second clip. Play the talk. The picture loops; the lesson does not.
        </p>
      </header>
      <ul className="flex flex-col gap-3">
        {seedLectures.map((t) => {
          const who = personById(people, t.personId);
          return (
            <li key={t.id}>
              <Link
                to="/talk/$id"
                params={{ id: t.id }}
                className="block overflow-hidden rounded-xl bg-cream shadow-[var(--shadow-border)] hover:shadow-[var(--shadow-border-hover)]"
              >
                <img src={t.still} alt="" className="max-h-56 w-full bg-ink object-contain" />
                <div className="p-4">
                  <p className="font-display text-2xl tracking-wide">{t.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {who?.name} · {who?.trade} · {formatTalkTime(t.duration)}
                  </p>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
