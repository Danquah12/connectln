import { createFileRoute, Link } from "@tanstack/react-router";
import { Portrait } from "@/components/portrait";
import { PostCard } from "@/components/post-card";
import { CallCard } from "@/components/call-card";
import { personById, useForge } from "@/lib/store";

export const Route = createFileRoute("/saved")({ component: SavedPage });

function SavedPage() {
  const people = useForge((s) => s.people);
  const posts = useForge((s) => s.posts);
  const calls = useForge((s) => s.calls);
  const savedCallIds = useForge((s) => s.savedCallIds);
  const savedPersonIds = useForge((s) => s.savedPersonIds);
  const savedPostIds = useForge((s) => s.savedPostIds);

  const savedPeople = savedPersonIds.map((id) => personById(people, id)).filter(Boolean);
  const savedPosts = posts.filter((p) => savedPostIds.includes(p.id));
  const savedCalls = calls.filter((c) => savedCallIds.includes(c.id));

  return (
    <div className="flex flex-col gap-4">
      <header>
        <h1 className="font-display text-4xl tracking-wide">Saved</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Cards, calls, and shop talk you pulled aside. Not a bookmark of the whole internet.
        </p>
      </header>

      <section className="rounded-xl bg-cream p-4 shadow-[var(--shadow-border)]">
        <h2 className="font-display text-2xl tracking-wide">People</h2>
        {savedPeople.length ? (
          <ul className="mt-3 flex flex-col gap-2">
            {savedPeople.map((p) =>
              p ? (
                <li key={p.id}>
                  <Link to="/p/$id" params={{ id: p.id }} className="flex items-center gap-3 rounded-lg bg-canvas px-3 py-2">
                    <Portrait person={p} size="sm" link={false} />
                    <span className="min-w-0">
                      <span className="block text-sm font-medium">{p.name}</span>
                      <span className="block text-xs text-muted-foreground">
                        {p.trade} · {p.city}
                      </span>
                    </span>
                  </Link>
                </li>
              ) : null,
            )}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">Save a card from People.</p>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-display text-2xl tracking-wide">Calls</h2>
        {savedCalls.length ? (
          savedCalls.map((c) => <CallCard key={c.id} call={c} />)
        ) : (
          <p className="text-sm text-muted-foreground">Save a call from the board.</p>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-display text-2xl tracking-wide">Shop talk</h2>
        {savedPosts.length ? (
          savedPosts.map((p) => <PostCard key={p.id} post={p} />)
        ) : (
          <p className="text-sm text-muted-foreground">Bookmark a line from shop talk.</p>
        )}
      </section>
    </div>
  );
}