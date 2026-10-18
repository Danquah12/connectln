import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { Portrait } from "@/components/portrait";
import { Button } from "@/components/ui/button";
import { visitors } from "@/lib/board-seed";
import { meets, overlapWhy } from "@/lib/hall-seed";
import { cohorts, guilds, projects, shops } from "@/lib/seed";
import { presenceLabel } from "@/lib/presence";
import { personById, useForge } from "@/lib/store";
import { ShopsHiring } from "@/components/shops-hiring";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/hall")({ component: HallPage });

function HallPage() {
  const people = useForge((s) => s.people);
  const vouches = useForge((s) => s.vouches);
  const posts = useForge((s) => s.posts);
  const youId = useForge((s) => s.youId);
  const you = personById(people, youId);
  const inviteStatus = useForge((s) => s.inviteStatus);
  const invites = useForge((s) => s.invites);
  const answerInvite = useForge((s) => s.answerInvite);
  const followedShopIds = useForge((s) => s.followedShopIds);
  const toggleFollowShop = useForge((s) => s.toggleFollowShop);
  const rsvpIds = useForge((s) => s.rsvpIds);
  const toggleRsvp = useForge((s) => s.toggleRsvp);
  const startThread = useForge((s) => s.startThread);
  const savedCallIds = useForge((s) => s.savedCallIds);
  const savedPersonIds = useForge((s) => s.savedPersonIds);
  const [tab, setTab] = useState<"grow" | "catch">("grow");

  const pending = invites.filter((i) => (inviteStatus[i.id] ?? "pending") === "pending");
  const taken = invites
    .filter((i) => inviteStatus[i.id] === "accepted")
    .map((i) => personById(people, i.fromId))
    .filter((p): p is NonNullable<typeof p> => Boolean(p));

  const crew = useMemo(() => {
    if (!you) return [];
    const ids = new Set<string>();
    vouches.forEach((v) => {
      if (v.toId === you.id) ids.add(v.fromId);
      if (v.fromId === you.id) ids.add(v.toId);
    });
    projects.forEach((p) => {
      if (p.memberIds.includes(you.id)) p.memberIds.forEach((id) => ids.add(id));
    });
    ids.delete(you.id);
    return [...ids]
      .map((id) => personById(people, id))
      .filter((p): p is NonNullable<typeof p> => Boolean(p));
  }, [you, vouches, people]);

  const suggestions = useMemo(() => {
    if (!you) return [];
    return people
      .map((p) => ({ p, why: overlapWhy(you, p, cohorts, projects) }))
      .filter((x): x is { p: NonNullable<typeof you>; why: string } => Boolean(x.why) && x.p.id !== you.id)
      .filter((x) => !crew.some((c) => c && c.id === x.p.id))
      .slice(0, 4);
  }, [people, you, crew]);

  const catchUp = useMemo(() => {
    const crewIds = new Set(crew.map((c) => c?.id));
    return posts.filter((p) => crewIds.has(p.authorId)).slice(0, 5);
  }, [posts, crew]);

  if (!you) return null;

  return (
    <div className="flex flex-col gap-4">
      <header>
        <h1 className="font-display text-4xl tracking-wide">Your hall</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          People you have worked with, shops that looked, events with a start time. Not a contact list.
        </p>
      </header>

      <div className="flex gap-1.5">
        {(
          [
            ["grow", "Invites"],
            ["catch", "Catch up"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={cn(
              "h-9 rounded-full px-3.5 text-sm",
              tab === id ? "bg-ink text-cream" : "bg-cream text-muted-foreground",
            )}
          >
            {label}
            {id === "grow" && pending.length ? ` · ${pending.length}` : ""}
          </button>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[16rem_minmax(0,1fr)]">
        <aside className="flex flex-col gap-3 lg:sticky lg:top-4 lg:self-start">
          <section className="rounded-xl bg-cream p-4 shadow-[var(--shadow-border)]">
            <p className="text-xs tracking-wide text-muted-foreground uppercase">On this board</p>
            <dl className="mt-3 space-y-2 text-sm">
              <Row k="Your people" n={crew.length + taken.length} />
              <Row k="Taken" n={taken.length} />
              <Row k="Shops" n={followedShopIds.length} to="/shops" />
              <Row k="Circles" n={guilds.filter((g) => g.memberIds.includes(you.id)).length} to="/circles" />
              <Row k="Events" n={meets.length} />
              <Row k="Who looked" n={visitors.length} />
              <Row k="Saved" n={savedPersonIds.length + savedCallIds.length} to="/saved" />
            </dl>
          </section>
          <section className="rounded-xl bg-cream p-4 shadow-[var(--shadow-border)]">
            <p className="text-xs tracking-wide text-muted-foreground uppercase">Shops you follow</p>
            <ul className="mt-3 space-y-2">
              {shops.map((s) => {
                const on = followedShopIds.includes(s.id);
                return (
                  <li key={s.id} className="flex items-center justify-between gap-2 text-sm">
                    <Link to="/s/$id" params={{ id: s.id }} className="hover:underline">
                      {s.name}
                    </Link>
                    <button
                      type="button"
                      onClick={() => toggleFollowShop(s.id)}
                      className={cn("text-xs", on ? "text-ok" : "text-brick")}
                    >
                      {on ? "Following" : "Follow"}
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        </aside>

        <div className="flex min-w-0 flex-col gap-4">
          <section className="rounded-xl bg-cream p-4 shadow-[var(--shadow-border)]">
            <h2 className="font-display text-2xl tracking-wide">Your people</h2>
            <p className="text-xs text-muted-foreground">
              Taken, vouched, or on a job with you. That is the hall — not a friend count.
            </p>
            <ul className="mt-3 grid gap-3 sm:grid-cols-2">
              {[
                ...taken.map((p) => ({ p, tag: "Taken" as const })),
                ...crew
                  .filter((c) => !taken.some((t) => t.id === c.id))
                  .map((p) => ({ p, tag: "Crew" as const })),
              ].map(({ p, tag }) => (
                <li key={p.id} className="flex gap-3">
                  <Portrait person={p} size="lg" />
                  <div className="min-w-0">
                    <Link to="/p/$id" params={{ id: p.id }} className="text-sm font-medium hover:underline">
                      {p.name}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {tag} · {presenceLabel(p)} · {p.trade} · {p.city}
                    </p>
                    <Link to="/messages" className="mt-1 inline-block text-xs text-brick hover:underline">
                      Inbox
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
            {taken.length === 0 && crew.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">Nobody taken yet. Take an invite below.</p>
            ) : null}
          </section>

          <ShopsHiring />

          {tab === "grow" ? (
            <>
              {pending.length ? (
                <section className="rounded-xl bg-cream p-4 shadow-[var(--shadow-border)]">
                  <h2 className="font-display text-2xl tracking-wide">Invites</h2>
                  <ul className="mt-3 flex flex-col gap-4">
                    {pending.map((inv) => {
                      const who = personById(people, inv.fromId);
                      if (!who) return null;
                      return (
                        <li key={inv.id} className="flex flex-col gap-3 sm:flex-row sm:items-start">
                          <Portrait person={who} size="lg" />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium">{who.name}</p>
                            <p className="text-sm">{inv.body}</p>
                            <p className="mt-1 text-xs text-muted-foreground">{inv.why}</p>
                          </div>
                          <div className="flex shrink-0 gap-2">
                            <Button
                              variant="outline"
                              onClick={() => {
                                answerInvite(inv.id, "passed");
                                toast("Passed.");
                              }}
                            >
                              Pass
                            </Button>
                            <Button
                              variant="ink"
                              onClick={() => {
                                answerInvite(inv.id, "accepted");
                                if (inv.kind === "intro" || inv.kind === "crew") startThread(who.id, "");
                                if (inv.kind === "event") toggleRsvp("meet-osha");
                                toast("Taken.");
                              }}
                            >
                              Take
                            </Button>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              ) : (
                <p className="rounded-xl bg-cream px-4 py-3 text-sm text-muted-foreground shadow-[var(--shadow-border)]">
                  No invites waiting.
                </p>
              )}

              <section className="rounded-xl bg-cream p-4 shadow-[var(--shadow-border)]">
                <h2 className="font-display text-2xl tracking-wide">Same hall</h2>
                <p className="text-xs text-muted-foreground">Same class, jobsite, or MOS — not a random alumni dump.</p>
                <ul className="mt-3 grid gap-3 sm:grid-cols-2">
                  {suggestions.map(({ p, why }) => (
                    <li key={p.id} className="flex gap-3">
                      <Portrait person={p} size="lg" />
                      <div className="min-w-0">
                        <Link to="/p/$id" params={{ id: p.id }} className="text-sm font-medium hover:underline">
                          {p.name}
                        </Link>
                        <p className="text-xs text-muted-foreground">
                          {p.trade} · {why}
                        </p>
                        <Button
                          className="mt-2 h-8 px-3 text-xs"
                          variant="outline"
                          onClick={() => {
                            startThread(p.id, `Same hall — ${why}.`);
                            toast(`Thread with ${p.name.split(" ")[0]}.`);
                          }}
                        >
                          Message
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>

              <section className="rounded-xl bg-cream p-4 shadow-[var(--shadow-border)]">
                <h2 className="font-display text-2xl tracking-wide">Who looked</h2>
                <p className="text-xs text-muted-foreground">The shop, and what they were hiring. Not a name with no context.</p>
                <ul className="mt-3 space-y-3">
                  {visitors.map((v) => (
                    <li key={v.id} className="text-sm">
                      <p className="font-medium">{v.shop}</p>
                      <p className="text-muted-foreground">
                        {v.looking} · {v.city} · {v.when}
                      </p>
                    </li>
                  ))}
                </ul>
              </section>

              <section className="rounded-xl bg-cream p-4 shadow-[var(--shadow-border)]">
                <h2 className="font-display text-2xl tracking-wide">Upcoming</h2>
                <p className="text-xs text-muted-foreground">
                  Full calendar on{" "}
                  <Link to="/events" className="text-brick hover:underline">
                    Events
                  </Link>
                  . Funding that pays the seat is on{" "}
                  <Link to="/fund" className="text-brick hover:underline">
                    Funding
                  </Link>
                  .
                </p>
                <ul className="mt-3 space-y-3">
                  {meets.map((m) => {
                    const on = rsvpIds.includes(m.id);
                    return (
                      <li key={m.id} className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium">{m.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {m.place} · {m.when} · {m.kind}
                          </p>
                        </div>
                        <Button
                          variant={on ? "ink" : "outline"}
                          onClick={() => {
                            toggleRsvp(m.id);
                            toast(on ? "Off the list." : "You're on the list.");
                          }}
                        >
                          {on ? "Going" : "I'll be there"}
                        </Button>
                      </li>
                    );
                  })}
                </ul>
              </section>
            </>
          ) : (
            <section className="rounded-xl bg-cream p-4 shadow-[var(--shadow-border)]">
              <h2 className="font-display text-2xl tracking-wide">Catch up</h2>
              <p className="text-xs text-muted-foreground">From people on your jobsites — not a firehose.</p>
              {catchUp.length ? (
                <ul className="mt-3 space-y-3">
                  {catchUp.map((p) => {
                    const who = personById(people, p.authorId);
                    return (
                      <li key={p.id} className="text-sm">
                        <span className="font-medium">{who?.name}</span>
                        <span className="text-muted-foreground"> · {p.body.slice(0, 140)}</span>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="mt-3 text-sm text-muted-foreground">Quiet hall. Check shop talk.</p>
              )}
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ k, n, to }: { k: string; n: number; to?: "/people" | "/shops" | "/circles" | "/saved" }) {
  const inner = (
    <>
      <span>{k}</span>
      <span className="tabular-nums">{n}</span>
    </>
  );
  if (!to) return <div className="flex justify-between">{inner}</div>;
  return (
    <Link to={to} className="flex justify-between hover:text-brick">
      {inner}
    </Link>
  );
}
