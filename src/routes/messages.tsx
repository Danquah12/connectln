import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Portrait } from "@/components/portrait";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { relTime } from "@/lib/format";
import { presenceLabel } from "@/lib/presence";
import { shops } from "@/lib/seed";
import { personById, useForge } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/messages")({ component: MessagesPage });

function MessagesPage() {
  const threads = useForge((s) => s.threads);
  const people = useForge((s) => s.people);
  const youId = useForge((s) => s.youId);
  const sendMessage = useForge((s) => s.sendMessage);
  const startThread = useForge((s) => s.startThread);
  const calls = useForge((s) => s.calls);
  const callHands = useForge((s) => s.callHands);
  const saved = useForge((s) => s.savedCallIds);
  const inviteStatus = useForge((s) => s.inviteStatus);
  const invites = useForge((s) => s.invites);
  const [activeId, setActiveId] = useState(threads[0]?.id ?? "");
  const [draft, setDraft] = useState("");
  const [lane, setLane] = useState<"all" | "hands" | "unread" | "hall" | "star">("all");
  const [q, setQ] = useState("");
  const starredThreadIds = useForge((s) => s.starredThreadIds);
  const toggleStarThread = useForge((s) => s.toggleStarThread);
  const followedShopIds = useForge((s) => s.followedShopIds);

  const mine = calls.filter((c) => c.postedBy === youId);
  const incoming = mine.flatMap((c) =>
    (callHands[c.id] ?? []).map((personId) => ({ call: c, personId })),
  );

  const hallIds = new Set(
    invites.filter((i) => inviteStatus[i.id] === "accepted").map((i) => i.fromId),
  );
  const incomingIds = new Set(incoming.map((x) => x.personId));

  const visibleThreads = threads.filter((t) => {
    if (t.withId === youId) return false;
    const last = t.messages.at(-1);
    if (lane === "hands") return incomingIds.has(t.withId);
    if (lane === "unread") return Boolean(last && last.fromId !== youId);
    if (lane === "hall") return hallIds.has(t.withId);
    if (lane === "star") return starredThreadIds.includes(t.id);
    const query = q.trim().toLowerCase();
    if (query) {
      const who = personById(people, t.withId);
      const hay = `${who?.name ?? ""} ${t.messages.map((m) => m.body).join(" ")}`.toLowerCase();
      if (!hay.includes(query)) return false;
    }
    return true;
  });
  const active = useMemo(
    () => visibleThreads.find((t) => t.id === activeId) ?? visibleThreads[0],
    [visibleThreads, activeId],
  );
  const other = active ? personById(people, active.withId) : undefined;

  return (
    <div className="flex min-h-[70dvh] flex-col overflow-hidden rounded-xl bg-cream shadow-[var(--shadow-border)] lg:min-h-[36rem] lg:flex-row">
      <aside className="border-b border-border lg:w-72 lg:border-r lg:border-b-0">
        <div className="px-4 py-3">
          <h1 className="font-display text-2xl tracking-wide">Inbox</h1>
          <p className="text-xs text-muted-foreground">
            Threads. Hall mail is{" "}
            <Link to="/mail" search={{ to: undefined }} className="text-brick hover:underline">
              a letter
            </Link>
            .
          </p>
          <p className="text-xs text-muted-foreground">Hands on a call, and hall talk.</p>
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search lines"
            className="mt-2 h-9 bg-canvas"
          />
          <div className="mt-2 flex flex-wrap gap-1">
            {(
              [
                ["all", "All"],
                ["hands", "Hands"],
                ["unread", "Unread"],
                ["hall", "Hall"],
                ["star", "Starred"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setLane(id)}
                className={cn(
                  "h-8 rounded-full px-2.5 text-xs",
                  lane === id ? "bg-ink text-cream" : "bg-canvas text-muted-foreground",
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        {followedShopIds.length ? (
          <div className="border-b border-border px-4 py-3">
            <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">Shop boards</p>
            <ul className="mt-2 space-y-1">
              {shops
                .filter((s) => followedShopIds.includes(s.id))
                .map((s) => (
                  <li key={s.id}>
                    <Link to="/s/$id" params={{ id: s.id }} className="block truncate text-sm hover:underline">
                      {s.name}
                    </Link>
                  </li>
                ))}
            </ul>
          </div>
        ) : null}
        {incoming.length ? (
          <div className="border-b border-border px-4 py-3">
            <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
              Hands on your calls
            </p>
            <ul className="mt-2 flex flex-col gap-2">
              {incoming.map(({ call, personId }) => {
                const who = personById(people, personId);
                if (!who) return null;
                return (
                  <li key={`${call.id}-${personId}`}>
                    <button
                      type="button"
                      className="flex w-full items-center gap-2 text-left hover:opacity-80"
                      onClick={() => setActiveId(startThread(personId, ""))}
                    >
                      <Portrait person={who} size="sm" link={false} />
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium">{who.name}</span>
                        <span className="block truncate text-[11px] text-muted-foreground">
                          {call.title}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : mine.length ? (
          <p className="border-b border-border px-4 py-3 text-xs text-muted-foreground">
            Your call is up. Hands land here.
          </p>
        ) : (
          <p className="border-b border-border px-4 py-3 text-xs text-muted-foreground">
            Post a call. When someone raises a hand, it shows here.
          </p>
        )}
        <ul>
          {visibleThreads.map((t) => {
            const who = personById(people, t.withId);
            if (!who) return null;
            const last = t.messages.at(-1);
            const selected = active?.id === t.id;
            return (
              <li key={t.id}>
                <button
                  type="button"
                  onClick={() => setActiveId(t.id)}
                  className={cn(
                    "flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-canvas",
                    selected && "bg-canvas",
                  )}
                >
                  <Portrait person={who} size="sm" link={false} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{who.name}</span>
                    <span className="block truncate text-[11px] text-muted-foreground">
                      {presenceLabel(who)} · {last?.body}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </aside>

      <section className="flex min-w-0 flex-1 flex-col">
        {active && other ? (
          <>
            <header className="flex items-center gap-3 border-b border-border px-4 py-3">
              <Portrait person={other} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{other.name}</p>
                <p className="text-xs text-muted-foreground">
                  {presenceLabel(other)} · {other.trade} · {other.city}
                </p>
              </div>
              <button
                type="button"
                onClick={() => toggleStarThread(active.id)}
                className={cn(
                  "h-8 rounded-full px-3 text-xs",
                  starredThreadIds.includes(active.id) ? "bg-ink text-cream" : "bg-canvas text-muted-foreground",
                )}
              >
                {starredThreadIds.includes(active.id) ? "Starred" : "Star"}
              </button>
            </header>
            <ol className="flex flex-1 flex-col gap-3 overflow-y-auto px-4 py-4">
              {active.messages.map((m) => {
                const mine = m.fromId === youId;
                return (
                  <li
                    key={m.id}
                    className={cn("flex", mine ? "justify-end" : "justify-start")}
                  >
                    <div
                      className={cn(
                        "max-w-[80%] rounded-lg px-3 py-2 text-sm leading-relaxed",
                        mine ? "bg-ink text-cream" : "bg-canvas text-ink",
                      )}
                    >
                      <p>{m.body}</p>
                      <p
                        className={cn(
                          "mt-1 text-[10px]",
                          mine ? "text-cream/55" : "text-muted-foreground",
                        )}
                      >
                        {relTime(m.createdAt)}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ol>
            {(() => {
              const call = calls.find((c) => saved.includes(c.id)) ?? calls.find((c) => c.trade === other.trade);
              if (!call) return null;
              return (
                <p className="px-4 text-xs text-muted-foreground">
                  Attach: {call.title} · {call.city} · {call.rate}{" "}
                  <button
                    type="button"
                    className="text-brick hover:underline"
                    onClick={() =>
                      sendMessage(
                        active.id,
                        `Relevant seat: ${call.title} — ${call.city} — ${call.rate} — ${call.duration}.`,
                      )
                    }
                  >
                    Send with this call
                  </button>
                </p>
              );
            })()}
            <form
              className="flex gap-2 border-t border-border p-3"
              onSubmit={(e) => {
                e.preventDefault();
                sendMessage(active.id, draft);
                setDraft("");
              }}
            >
              <Input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder={`Message ${other.name.split(" ")[0]}`}
                className="bg-canvas"
              />
              <Button type="submit" disabled={!draft.trim()}>
                Send
              </Button>
            </form>
          </>
        ) : (
          <p className="p-8 text-sm text-muted-foreground">No threads yet.</p>
        )}
      </section>
    </div>
  );
}
