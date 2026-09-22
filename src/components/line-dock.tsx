import { Link, useRouterState } from "@tanstack/react-router";
import { X } from "lucide-react";
import { Portrait } from "@/components/portrait";
import { presenceOf } from "@/lib/presence";
import { personById, useForge } from "@/lib/store";

export function LineDock() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const threads = useForge((s) => s.threads);
  const people = useForge((s) => s.people);
  const youId = useForge((s) => s.youId);
  const hidden = useForge((s) => s.dockHiddenIds);
  const hideDock = useForge((s) => s.hideDock);

  if (pathname === "/login" || pathname === "/goal" || pathname.startsWith("/messages")) return null;

  const open = threads
    .filter((t) => t.withId !== youId && !hidden.includes(t.id) && t.messages.length)
    .slice()
    .sort((a, b) => (b.messages.at(-1)?.createdAt ?? "").localeCompare(a.messages.at(-1)?.createdAt ?? ""))
    .slice(0, 3);

  if (!open.length) return null;

  return (
    <div className="hall-float pointer-events-none fixed right-2 z-30 flex max-w-[calc(100vw-1rem)] gap-2 overflow-x-auto sm:right-3">
      {open.map((t) => {
        const who = personById(people, t.withId);
        if (!who) return null;
        const last = t.messages.at(-1);
        const unread = last && last.fromId !== youId;
        return (
          <div
            key={t.id}
            className="pointer-events-auto flex min-w-[11rem] max-w-[14rem] items-center gap-2 rounded-full bg-cream py-1.5 pr-1.5 pl-2 shadow-[var(--shadow-border)]"
          >
            <Link to="/messages" className="flex min-w-0 flex-1 items-center gap-2">
              <Portrait person={who} size="sm" link={false} />
              <span className="min-w-0">
                <span className="block truncate text-xs font-medium">{who.name.split(" ")[0]}</span>
                <span className="block truncate text-[10px] text-muted-foreground">
                  {unread ? "Needs a look" : presenceOf(who) === "online" ? "On the hall" : "Line"}
                </span>
              </span>
            </Link>
            <button
              type="button"
              className="grid size-8 place-items-center rounded-full text-muted-foreground hover:bg-canvas hover:text-ink"
              aria-label={`Close line with ${who.name}`}
              onClick={() => hideDock(t.id)}
            >
              <X className="size-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}