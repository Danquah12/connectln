import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { buildNotices } from "@/lib/notices";
import { personById, useForge } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/board")({ component: BoardPage });

const FILTERS = [
  { id: "hand", label: "Needs a hand" },
  { id: "all", label: "All" },
  { id: "ticket", label: "Tickets" },
  { id: "invite", label: "Invites" },
  { id: "look", label: "Looks" },
  { id: "call", label: "Calls" },
  { id: "crew", label: "Crew" },
  { id: "mail", label: "Mail" },
] as const;

function BoardPage() {
  const people = useForge((s) => s.people);
  const youId = useForge((s) => s.youId);
  const you = personById(people, youId);
  const vouches = useForge((s) => s.vouches);
  const calls = useForge((s) => s.calls);
  const threads = useForge((s) => s.threads);
  const invites = useForge((s) => s.invites);
  const inviteStatus = useForge((s) => s.inviteStatus);
  const appliedCallIds = useForge((s) => s.appliedCallIds);
  const callHires = useForge((s) => s.callHires);
  const mail = useForge((s) => s.mail);
  const dismissed = useForge((s) => s.dismissedNotices);
  const dismissNotice = useForge((s) => s.dismissNotice);
  const answerInvite = useForge((s) => s.answerInvite);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["id"]>("hand");

  const notices = useMemo(() => {
    if (!you) return [];
    return buildNotices({
      you,
      people,
      vouches,
      calls,
      threads,
      invites,
      inviteStatus,
      appliedCallIds,
      dismissed,
      callHires,
      mail,
    });
  }, [you, people, vouches, calls, threads, invites, inviteStatus, appliedCallIds, dismissed, callHires, mail]);

  const visible = notices.filter((n) => {
    if (filter === "all") return true;
    if (filter === "hand") return n.decision;
    return n.kind === filter;
  });

  if (!you) return null;

  return (
    <div className="flex flex-col gap-4">
      <header>
        <h1 className="font-display text-4xl tracking-wide">The board</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Tickets, crew, invites, looks, calls. One action each. Not a newsletter.
        </p>
      </header>

      <div className="flex gap-1 overflow-x-auto">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id)}
            className={cn(
              "h-9 shrink-0 rounded-full px-3.5 text-sm font-medium",
              filter === f.id ? "bg-ink text-cream" : "bg-cream text-muted-foreground",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      <ul className="flex flex-col gap-2">
        {visible.map((n) => (
          <li
            key={n.id}
            className={cn(
              "rounded-xl p-4 shadow-[var(--shadow-border)]",
              n.decision ? "border-l-4 border-brick bg-[#e8f1fb]" : "bg-cream",
            )}
          >
            <p className="text-[11px] font-medium tracking-[0.16em] text-muted-foreground uppercase">
              {n.kind}
            </p>
            <p className="mt-1 font-medium">{n.title}</p>
            <p className="mt-1 text-sm text-muted-foreground">{n.why}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {n.inviteId ? (
                <>
                  <Button
                    size="sm"
                    variant="ink"
                    onClick={() => {
                      answerInvite(n.inviteId!, "accepted");
                      toast("Taken.");
                    }}
                  >
                    Take
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      answerInvite(n.inviteId!, "passed");
                      toast("Passed.");
                    }}
                  >
                    Pass
                  </Button>
                </>
              ) : (
                <Button size="sm" variant="ink" asChild>
                  <a href={n.href}>{n.kind === "call" ? "View seats" : n.kind === "ticket" ? "License desk" : "Open"}</a>
                </Button>
              )}
              <Button size="sm" variant="ghost" onClick={() => dismissNotice(n.id)}>
                Clear
              </Button>
            </div>
          </li>
        ))}
      </ul>
      {visible.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          Nothing on the board. Tickets current, no invites waiting.
        </p>
      ) : null}
    </div>
  );
}
