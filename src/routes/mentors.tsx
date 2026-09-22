import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Portrait } from "@/components/portrait";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { rankLabel } from "@/lib/format";
import { TRADE_GROUPS } from "@/lib/seed";
import { personById, useForge } from "@/lib/store";
import type { Trade } from "@/lib/types";
import { toast } from "sonner";

export const Route = createFileRoute("/mentors")({ component: MentorsPage });

function MentorsPage() {
  const people = useForge((s) => s.people);
  const youId = useForge((s) => s.youId);
  const updateYou = useForge((s) => s.updateYou);
  const you = personById(people, youId);
  const bumpMentorWeek = useForge((s) => s.bumpMentorWeek);
  const menteeOf = useForge((s) => s.menteeOf);
  const mentor = menteeOf ? personById(people, menteeOf) : null;
  const [trade, setTrade] = useState<Trade | "all">(you?.trade ?? "all");

  const mentors = useMemo(
    () =>
      people.filter(
        (p) => p.mentoring && p.id !== youId && (trade === "all" || p.trade === trade),
      ),
    [people, trade, youId],
  );
  const apprentices = people.filter((p) => p.seekingMentor);

  return (
    <div className="flex flex-col gap-4">
      <header>
        <h1 className="font-display text-4xl tracking-wide">Mentors</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Apprentice to journeyman. Student to faculty. Corpsman to charge. Not a coaching brand.
        </p>
      </header>

      {mentor && you ? (
        <section className="rounded-xl bg-cream p-4 shadow-[var(--shadow-border)]">
          <p className="text-sm font-medium">Learning from {mentor.name}</p>
          <ul className="mt-2 flex gap-2 text-sm">
            {[1, 2, 3, 4].map((w) => (
              <li key={w} className={(you.mentorWeeks ?? 0) >= w ? "text-ok" : "text-muted-foreground"}>
                Week {w} {(you.mentorWeeks ?? 0) >= w ? "✓" : ""}
              </li>
            ))}
          </ul>
          <Button className="mt-3" variant="outline" onClick={() => bumpMentorWeek()}>
            Log this week
          </Button>
        </section>
      ) : null}

      {you ? (
        <div className="flex flex-wrap gap-2">
          <Button
            variant={you.seekingMentor ? "ink" : "outline"}
            onClick={() => {
              updateYou({ seekingMentor: !you.seekingMentor });
              toast(you.seekingMentor ? "No longer looking." : "Looking for a mentor.");
            }}
          >
            {you.seekingMentor ? "Looking for a mentor" : "Find a mentor"}
          </Button>
          <Button
            variant={you.mentoring ? "ink" : "outline"}
            onClick={() => {
              updateYou({ mentoring: !you.mentoring });
              toast(you.mentoring ? "Off the mentor list." : "You're on as a mentor.");
            }}
          >
            {you.mentoring ? "Mentoring" : "Become a mentor"}
          </Button>
        </div>
      ) : null}

      <div className="flex gap-1.5 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => setTrade("all")}
          className={
            trade === "all"
              ? "h-9 shrink-0 rounded-full bg-ink px-3.5 text-sm text-cream"
              : "h-9 shrink-0 rounded-full bg-cream px-3.5 text-sm text-muted-foreground"
          }
        >
          All
        </button>
        {TRADE_GROUPS.flatMap((g) => g.trades).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTrade(t)}
            className={
              trade === t
                ? "h-9 shrink-0 rounded-full bg-ink px-3.5 text-sm text-cream"
                : "h-9 shrink-0 rounded-full bg-cream px-3.5 text-sm text-muted-foreground"
            }
          >
            {t}
          </button>
        ))}
      </div>

      <ul className="flex flex-col gap-2">
        {mentors.map((p) => (
          <li key={p.id}>
            <Link
              to="/p/$id"
              params={{ id: p.id }}
              className="flex items-center gap-3 rounded-xl bg-cream p-3 shadow-[var(--shadow-border)]"
            >
              <Portrait person={p} size="lg" link={false} />
              <div className="min-w-0 flex-1">
                <p className="font-medium">{p.name}</p>
                <p className="truncate text-sm text-muted-foreground">
                  {rankLabel(p.level, p.trade)} · {p.city}, {p.state} · {p.years} yrs
                </p>
              </div>
              <Badge variant="ok">Mentor</Badge>
            </Link>
          </li>
        ))}
      </ul>

      <p className="text-xs text-muted-foreground">
        {apprentices.length} people on the board are looking for a mentor.
      </p>
    </div>
  );
}
