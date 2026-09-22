import { Link } from "@tanstack/react-router";
import { PostCard } from "@/components/post-card";
import { hallCalls, hallRoster } from "@/lib/example";
import { matchesBoard, type BoardSearch } from "@/lib/board";
import { hallClipLive } from "@/lib/clip-ingest";
import { hallEnglish } from "@/lib/hall-lang";
import { hallLabel } from "@/lib/scope";
import { personById, useForge } from "@/lib/store";
import type { FieldGroup, Trade } from "@/lib/types";

export function TradeDesk({
  group,
  trade,
  plates = false,
  compact = false,
}: {
  group: "all" | FieldGroup;
  trade: Trade | "all";
  plates?: boolean;
  compact?: boolean;
}) {
  const people = useForge((s) => s.people);
  const posts = useForge((s) => s.posts);
  const calls = useForge((s) => s.calls);
  const clipStatus = useForge((s) => s.clipStatus);
  const search: BoardSearch =
    trade !== "all" ? { trade, group: group === "all" ? undefined : group } : group !== "all" ? { group } : {};

  const roster = hallRoster(people).filter((p) => matchesBoard(p.trade, group, trade));
  const talk = posts.filter((p) => {
    const author = personById(people, p.authorId);
    if (!author || !matchesBoard(author.trade, group, trade)) return false;
    if (!p.youtube && !p.video) return false;
    if (!hallClipLive(p.youtube, clipStatus)) return false;
    return hallEnglish(p.body, p.headline, author.name);
  });
  const board = hallCalls(calls).filter((c) => matchesBoard(c.trade, group, trade));
  const label = trade !== "all" ? hallLabel(trade) : group === "all" ? "The hall" : group;

  if (compact) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-cream px-4 py-3 shadow-[var(--shadow-border)]">
        <div className="min-w-0">
          <p className="font-display text-xl tracking-wide capitalize">{label}</p>
          <p className="text-xs text-muted-foreground">
            {roster.length} people · {talk.length} plates · {board.length} calls
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            to="/people"
            search={{ ...search, q: undefined }}
            className="h-10 rounded-lg bg-ink px-3.5 text-sm font-medium leading-10 text-cream"
          >
            People
          </Link>
          <Link
            to="/calls"
            search={search}
            className="h-10 rounded-lg bg-canvas px-3.5 text-sm font-medium leading-10 text-ink"
          >
            Calls
          </Link>
        </div>
      </div>
    );
  }

  return (
    <section className="rounded-xl bg-cream p-4 shadow-[var(--shadow-border)]">
      <p className="font-display text-2xl tracking-wide capitalize">{label}</p>
      <p className="mt-1 text-sm text-muted-foreground">
        {roster.length} people · {talk.length} plates · {board.length} calls
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Link
          to="/people"
          search={{ ...search, q: undefined }}
          className="h-10 rounded-lg bg-ink px-3.5 text-sm font-medium leading-10 text-cream"
        >
          People
        </Link>
        <Link
          to="/"
          search={search}
          className="h-10 rounded-lg bg-canvas px-3.5 text-sm font-medium leading-10 text-ink"
        >
          Shop talk
        </Link>
        <Link
          to="/calls"
          search={search}
          className="h-10 rounded-lg bg-canvas px-3.5 text-sm font-medium leading-10 text-ink"
        >
          Calls
        </Link>
      </div>
      {plates && talk.length > 0 ? (
        <div className="mt-4 flex flex-col gap-3">
          <p className="text-[11px] font-medium tracking-[0.16em] text-muted-foreground uppercase">
            Shop talk for {label}
          </p>
          {talk.slice(0, 8).map((p) => (
            <PostCard key={p.id} post={p} />
          ))}
        </div>
      ) : null}
    </section>
  );
}
