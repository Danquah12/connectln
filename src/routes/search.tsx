import { useMemo } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Bookmark } from "lucide-react";
import { toast } from "sonner";
import { BoardSearch } from "@/components/board-search";
import { Portrait } from "@/components/portrait";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { fitScore } from "@/lib/fit";
import { personById, useForge } from "@/lib/store";
import { searchBoard, type Hit, type HitKind } from "@/lib/search";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/search")({
  validateSearch: (raw: Record<string, unknown>): { q?: string; kind?: string } => ({
    ...(typeof raw.q === "string" ? { q: raw.q } : {}),
    ...(typeof raw.kind === "string" ? { kind: raw.kind } : {}),
  }),
  component: SearchPage,
});

const KINDS: { id: "all" | HitKind; label: string }[] = [
  { id: "all", label: "All" },
  { id: "call", label: "Calls" },
  { id: "post", label: "Shop talk" },
  { id: "person", label: "People" },
  { id: "shop", label: "Shops" },
  { id: "listing", label: "Market" },
  { id: "event", label: "Events" },
  { id: "fund", label: "Funding" },
  { id: "circle", label: "Circles" },
  { id: "talk", label: "Talks" },
];

function SearchPage() {
  const { q: qSearch, kind: kindSearch } = Route.useSearch();
  const navigate = useNavigate();
  const q = (qSearch ?? "").trim();
  const kind = (KINDS.some((k) => k.id === kindSearch) ? kindSearch : "all") as "all" | HitKind;

  const people = useForge((s) => s.people);
  const posts = useForge((s) => s.posts);
  const calls = useForge((s) => s.calls);
  const extra = useForge((s) => s.extraListings);
  const pulled = useForge((s) => s.pulledListings);
  const you = personById(people, useForge((s) => s.youId));
  const toggleSaveCall = useForge((s) => s.toggleSaveCall);
  const savedCallIds = useForge((s) => s.savedCallIds);

  const hits = useMemo(() => {
    if (!q) return [];
    try {
      return searchBoard(q, people, posts, calls, extra, pulled, you?.trade);
    } catch {
      return [];
    }
  }, [q, people, posts, calls, extra, pulled, you?.trade]);
  const visible = kind === "all" ? hits : hits.filter((h) => h.kind === kind);
  const counts = useMemo(() => {
    const c: Partial<Record<HitKind, number>> = {};
    for (const h of hits) c[h.kind] = (c[h.kind] ?? 0) + 1;
    return c;
  }, [hits]);

  function go(next: { q?: string; kind?: string }) {
    void navigate({
      to: "/search",
      search: {
        ...(next.q ?? q ? { q: next.q ?? q } : {}),
        ...(next.kind && next.kind !== "all" ? { kind: next.kind } : {}),
      },
    });
  }

  const grouped =
    kind === "all"
      ? KINDS.filter((k) => k.id !== "all" && (counts[k.id as HitKind] ?? 0) > 0)
      : [];

  return (
    <div className="flex flex-col gap-4">
      <header>
        <h1 className="font-display text-4xl tracking-wide">Search the board</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Results come up as you type. Tickets and MOS beat a job title.
        </p>
        <div className="mt-3">
          <BoardSearch variant="page" />
        </div>
      </header>

      <div className="flex flex-wrap gap-1.5">
        {KINDS.map((k) => {
          const n = k.id === "all" ? hits.length : (counts[k.id] ?? 0);
          if (k.id !== "all" && q && n === 0) return null;
          return (
            <button
              key={k.id}
              type="button"
              onClick={() => go({ kind: k.id })}
              className={cn(
                "h-9 rounded-full px-3.5 text-sm font-medium",
                kind === k.id ? "bg-ink text-cream" : "bg-cream text-muted-foreground",
              )}
            >
              {k.label}
              {q && n ? ` ${n}` : ""}
            </button>
          );
        })}
      </div>

      {!q ? (
        <section className="rounded-xl bg-cream p-4 shadow-[var(--shadow-border)]">
          <p className="text-sm text-muted-foreground">Try</p>
          <ul className="mt-2 flex flex-wrap gap-2">
            {["hospital electrician", "compact RN", "11B", "OSHA-30", "GI Bill", "EPA 608"].map((s) => (
              <li key={s}>
                <button
                  type="button"
                  className="rounded-full bg-canvas px-3 py-1.5 text-sm hover:bg-accent"
                  onClick={() => go({ q: s })}
                >
                  {s}
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[13rem_minmax(0,1fr)]">
        {q ? (
          <aside className="hidden lg:block">
            <div className="sticky top-20 rounded-xl bg-cream p-4 shadow-[var(--shadow-border)]">
              <p className="text-xs tracking-wide text-muted-foreground uppercase">On this page</p>
              <ul className="mt-2 space-y-1 text-sm">
                {KINDS.filter((k) => k.id !== "all" && (counts[k.id as HitKind] ?? 0) > 0).map((k) => (
                  <li key={k.id}>
                    <button type="button" className="hover:text-brick" onClick={() => go({ kind: k.id })}>
                      {k.label} · {counts[k.id as HitKind]}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        ) : (
          <div className="hidden lg:block" />
        )}

        <div className="min-w-0 flex flex-col gap-4">
          {q && visible.length === 0 ? (
            <p className="rounded-xl bg-cream px-4 py-6 text-sm text-muted-foreground shadow-[var(--shadow-border)]">
              Nothing on the board for “{q}”. Try a ticket, a MOS, or a city.
            </p>
          ) : null}

          {kind === "all" && q
            ? grouped.map((g) => (
                <section key={g.id} className="overflow-hidden rounded-xl bg-cream shadow-[var(--shadow-border)]">
                  <div className="flex items-end justify-between px-4 pt-4">
                    <h2 className="font-display text-2xl tracking-wide">{g.label}</h2>
                    <button
                      type="button"
                      className="text-xs text-brick hover:underline"
                      onClick={() => go({ kind: g.id })}
                    >
                      All {counts[g.id as HitKind]}
                    </button>
                  </div>
                  <ul className="mt-2 divide-y divide-border">
                    {hits
                      .filter((h) => h.kind === g.id)
                      .slice(0, 4)
                      .map((h) => (
                        <li key={`${h.kind}-${h.id}`}>
                          <HitRow
                            hit={h}
                            you={you}
                            saved={savedCallIds.includes(h.id)}
                            onSave={() => {
                              toggleSaveCall(h.id);
                              toast("On your list.");
                            }}
                          />
                        </li>
                      ))}
                  </ul>
                </section>
              ))
            : null}

          {kind !== "all" && q ? (
            <section className="overflow-hidden rounded-xl bg-cream shadow-[var(--shadow-border)]">
              <h2 className="px-4 pt-4 font-display text-2xl tracking-wide">
                {KINDS.find((k) => k.id === kind)?.label}
              </h2>
              <ul className="mt-2 divide-y divide-border">
                {visible.map((h) => (
                  <li key={`${h.kind}-${h.id}`}>
                    <HitRow
                      hit={h}
                      you={you}
                      saved={savedCallIds.includes(h.id)}
                      onSave={() => {
                        toggleSaveCall(h.id);
                        toast("On your list.");
                      }}
                    />
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function HitRow({
  hit,
  you,
  saved,
  onSave,
}: {
  hit: Hit;
  you: ReturnType<typeof personById>;
  saved: boolean;
  onSave: () => void;
}) {
  const calls = useForge((s) => s.calls);
  const people = useForge((s) => s.people);
  const call = hit.kind === "call" ? calls.find((c) => c.id === hit.id) : undefined;
  const person = hit.kind === "person" ? personById(people, hit.id) : undefined;
  const fit = call && you ? fitScore(you, call) : null;
  const qualify = fit && fit.missing.length <= 1 && fit.tradeMatch;

  const inner = (
    <>
      {person ? (
        <Portrait person={person} size="lg" link={false} />
      ) : hit.photo ? (
        <img src={hit.photo} alt="" className="size-12 shrink-0 rounded-md object-cover" />
      ) : (
        <span className="grid size-12 shrink-0 place-items-center rounded-md bg-canvas font-display text-lg">
          {hit.title.slice(0, 1)}
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="block font-medium">{hit.title}</span>
        <span className="block text-sm text-muted-foreground">{hit.blurb}</span>
        {hit.meta ? <span className="mt-0.5 block text-xs text-muted-foreground">{hit.meta}</span> : null}
        {qualify ? (
          <Badge variant="ok" className="mt-1">
            You qualify · {fit.have.length}/{fit.have.length + fit.missing.length}
          </Badge>
        ) : null}
      </span>
    </>
  );

  return (
    <div className="flex items-start gap-3 px-4 py-3">
      {hit.kind === "call" ? (
        <Link to="/calls" hash={hit.id} className="flex min-w-0 flex-1 items-start gap-3 hover:text-brick">
          {inner}
        </Link>
      ) : hit.kind === "person" ? (
        <Link to="/p/$id" params={{ id: hit.id }} className="flex min-w-0 flex-1 items-start gap-3 hover:text-brick">
          {inner}
        </Link>
      ) : hit.kind === "shop" ? (
        <Link to="/s/$id" params={{ id: hit.id }} className="flex min-w-0 flex-1 items-start gap-3 hover:text-brick">
          {inner}
        </Link>
      ) : hit.kind === "listing" ? (
        <Link to="/listing/$id" params={{ id: hit.id }} className="flex min-w-0 flex-1 items-start gap-3 hover:text-brick">
          {inner}
        </Link>
      ) : hit.kind === "talk" ? (
        <Link to="/talk/$id" params={{ id: hit.id }} className="flex min-w-0 flex-1 items-start gap-3 hover:text-brick">
          {inner}
        </Link>
      ) : hit.kind === "event" ? (
        <Link to="/events" className="flex min-w-0 flex-1 items-start gap-3 hover:text-brick">
          {inner}
        </Link>
      ) : hit.kind === "fund" ? (
        <Link to="/fund" className="flex min-w-0 flex-1 items-start gap-3 hover:text-brick">
          {inner}
        </Link>
      ) : hit.kind === "circle" ? (
        <Link to="/circles" className="flex min-w-0 flex-1 items-start gap-3 hover:text-brick">
          {inner}
        </Link>
      ) : (
        <Link to="/" className="flex min-w-0 flex-1 items-start gap-3 hover:text-brick">
          {inner}
        </Link>
      )}
      {hit.kind === "call" ? (
        <Button
          size="icon-sm"
          variant={saved ? "ink" : "outline"}
          aria-label="Save call"
          onClick={onSave}
        >
          <Bookmark className="size-4" />
        </Button>
      ) : null}
    </div>
  );
}
