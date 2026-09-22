import { Link } from "@tanstack/react-router";
import { hallLabel } from "@/lib/scope";
import { personById, useForge } from "@/lib/store";
import { cn } from "@/lib/utils";

export function FirstLoop() {
  const people = useForge((s) => s.people);
  const youId = useForge((s) => s.youId);
  const you = personById(people, youId);
  const posts = useForge((s) => s.posts);
  const calls = useForge((s) => s.calls);
  const applied = useForge((s) => s.appliedCallIds.length > 0);
  const loopDismissed = useForge((s) => s.loopDismissed);
  const dismissLoop = useForge((s) => s.dismissLoop);
  if (!you || loopDismissed) return null;

  const sentLine = posts.some((p) => p.authorId === you.id);
  const postedCall = calls.some((c) => c.postedBy === you.id);
  const tookCall = applied;

  const steps = [
    {
      n: "1",
      title: "Send a line",
      why: "It hits the hall. If you tag someone, it lands in their inbox too.",
      href: "/",
      done: sentLine,
    },
    {
      n: "2",
      title: postedCall ? "Call is up" : tookCall ? "Hand raised" : "Post or take a call",
      why: "A shop posts. Someone in that trade raises a hand.",
      href: "/calls",
      done: postedCall || tookCall,
    },
    {
      n: "3",
      title: "Inbox — the shop sees it",
      why: "The hand is a thread. Open the card. Call them for the job.",
      href: "/messages",
      done: postedCall || tookCall,
    },
  ];
  const next = steps.find((s) => !s.done) ?? steps[2];
  const done = steps.filter((s) => s.done).length;

  return (
    <section className="rounded-xl bg-cream p-4 shadow-[var(--shadow-border)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl tracking-wide">The loop</h2>
          <p className="text-xs text-muted-foreground">
            {done}/3 — line, call, inbox. That is the hall.
            {you.trade ? ` ${hallLabel(you.trade)} first.` : ""}
          </p>
        </div>
        <button type="button" onClick={dismissLoop} className="text-xs text-muted-foreground hover:text-ink">
          Hide
        </button>
      </div>
      <ol className="mt-3 flex flex-col gap-1.5">
        {steps.map((s) => (
          <li key={s.n}>
            <Link
              to={s.href}
              className={cn(
                "flex items-start gap-3 rounded-lg px-2 py-2 hover:bg-canvas",
                s === next && !s.done && "bg-canvas",
              )}
            >
              <span
                className={cn(
                  "grid size-7 shrink-0 place-items-center rounded-full text-xs font-medium",
                  s.done ? "bg-ok text-cream" : "bg-ink text-cream",
                )}
              >
                {s.n}
              </span>
              <span>
                <span className="block text-sm font-medium">{s.title}</span>
                <span className="block text-xs text-muted-foreground">{s.why}</span>
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}
