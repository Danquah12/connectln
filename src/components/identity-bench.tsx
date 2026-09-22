import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { Portrait } from "@/components/portrait";
import { visitors } from "@/lib/board-seed";
import { meets } from "@/lib/hall-seed";
import { shops } from "@/lib/seed";
import { useCurrentUser } from "@/lib/auth/use-current-user";
import { cardName, openTerms, rankLabel, ticketNeedsRefresh, ticketStatusLabel } from "@/lib/format";
import { personById, useForge } from "@/lib/store";

export function IdentityBench({ compact = false }: { compact?: boolean }) {
  const people = useForge((s) => s.people);
  const youId = useForge((s) => s.youId);
  const vouches = useForge((s) => s.vouches);
  const savedCallIds = useForge((s) => s.savedCallIds);
  const appliedCallIds = useForge((s) => s.appliedCallIds);
  const savedPersonIds = useForge((s) => s.savedPersonIds);
  const savedPostIds = useForge((s) => s.savedPostIds);
  const followedShopIds = useForge((s) => s.followedShopIds);
  const invites = useForge((s) => s.invites);
  const inviteStatus = useForge((s) => s.inviteStatus);
  const answerInvite = useForge((s) => s.answerInvite);
  const startThread = useForge((s) => s.startThread);
  const setAvailability = useForge((s) => s.setAvailability);
  const updateYou = useForge((s) => s.updateYou);
  const sessionRole = useForge((s) => s.sessionRole);
  const you = personById(people, youId);
  const session = useCurrentUser();
  if (!you) return null;
  if (session && you.id !== session.id) return null;

  const vouchCount = vouches.filter((v) => v.toId === you.id).length;
  const followed = shops.filter((s) => followedShopIds.includes(s.id));
  const due = you.tickets.filter(ticketNeedsRefresh);
  const place = [you.city, you.state].filter(Boolean).join(", ");
  const pending = invites.filter((i) => (inviteStatus[i.id] ?? "pending") === "pending").slice(0, 2);
  const open = you.availability === "open";

  return (
    <div className="flex flex-col gap-3">
      <section className="rounded-xl bg-cream shadow-[var(--shadow-border)]">
        <div className="h-20 overflow-hidden rounded-t-xl sm:h-28">
          <img
            src={you.cover || "/sites/panel.jpg"}
            alt=""
            className="size-full object-cover object-top"
            crossOrigin="anonymous"
          />
        </div>
        <div className="px-4 pb-4">
          <div className="-mt-10 w-fit">
            <label className="relative block cursor-pointer">
              <Portrait
                person={you}
                size={compact ? "lg" : "xl"}
                link={false}
                className="ring-4 ring-cream"
              />
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = () => {
                    if (typeof reader.result === "string") updateYou({ photo: reader.result });
                  };
                  reader.readAsDataURL(file);
                }}
              />
            </label>
          </div>
          <div className="mt-3 min-w-0">
            <Link to="/you" className="font-medium text-ink hover:underline">
              {cardName(you)}
            </Link>
            <p className="truncate text-xs text-muted-foreground">{rankLabel(you.level, you.trade)}</p>
            <p className="text-xs text-muted-foreground">{place || "Add your city on the card"}</p>
            <p className="mt-1 text-xs text-ink">{openTerms(you)}</p>
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => {
                setAvailability(open ? "on-job" : "open");
                toast(open ? "On a job. Calls still see the card." : "Open to calls. Rate and miles are on the card.");
              }}
              className={
                open
                  ? "h-8 rounded-full bg-brick px-3 text-xs font-medium text-cream"
                  : "h-8 rounded-full bg-canvas px-3 text-xs text-muted-foreground"
              }
            >
              {open ? "Open to calls" : "Flip open"}
            </button>
            <Link
              to="/you"
              className="inline-flex h-8 items-center rounded-full bg-canvas px-3 text-xs text-muted-foreground hover:text-ink"
            >
              Conditions
            </Link>
          </div>
          {you.union ? <p className="mt-2 text-xs text-muted-foreground">{you.union}</p> : null}
          <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Shops that looked</dt>
              <dd className="tabular-nums">{visitors.length}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Vouches</dt>
              <dd className="tabular-nums">{vouchCount}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Hands raised</dt>
              <dd className="tabular-nums">{appliedCallIds.length}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Saved calls</dt>
              <dd className="tabular-nums">{savedCallIds.length}</dd>
            </div>
          </dl>
        </div>
      </section>

      {pending.length ? (
        <section className="rounded-xl bg-cream p-4 shadow-[var(--shadow-border)]">
          <p className="text-[11px] tracking-wide text-muted-foreground uppercase">Hall invites</p>
          <ul className="mt-2 space-y-3">
            {pending.map((inv) => {
              const who = personById(people, inv.fromId);
              if (!who) return null;
              return (
                <li key={inv.id} className="flex gap-2">
                  <Portrait person={who} size="sm" link={false} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{who.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{inv.why}</p>
                    <div className="mt-1 flex gap-2">
                      <button
                        type="button"
                        className="text-xs text-muted-foreground hover:text-ink"
                        onClick={() => {
                          answerInvite(inv.id, "passed");
                          toast("Passed.");
                        }}
                      >
                        Pass
                      </button>
                      <button
                        type="button"
                        className="text-xs font-medium text-brick"
                        onClick={() => {
                          answerInvite(inv.id, "accepted");
                          if (inv.kind === "intro" || inv.kind === "crew") startThread(who.id, "");
                          toast("Taken.");
                        }}
                      >
                        Take
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
          <Link to="/hall" className="mt-2 inline-block text-xs text-brick hover:underline">
            Your hall
          </Link>
        </section>
      ) : null}

      {due.length > 0 ? (
        <section className="rounded-xl bg-cream p-4 shadow-[var(--shadow-border)]">
          <p className="text-[11px] tracking-wide text-warn uppercase">Tickets</p>
          <ul className="mt-2 space-y-1 text-sm">
            {due.slice(0, 3).map((t) => (
              <li key={t.id}>
                {t.name} · {ticketStatusLabel(t)}
              </li>
            ))}
          </ul>
          <Link to="/wallet" className="mt-2 inline-block text-xs font-medium text-brick hover:underline">
            License desk
          </Link>
        </section>
      ) : null}

      <section className="rounded-xl bg-cream p-4 shadow-[var(--shadow-border)]">
        <p className="text-[11px] tracking-wide text-muted-foreground uppercase">Shops on your bench</p>
        <ul className="mt-2 space-y-1.5 text-sm">
          {followed.length ? (
            followed.map((s) => (
              <li key={s.id}>
                <Link to="/s/$id" params={{ id: s.id }} className="hover:underline">
                  {s.name}
                </Link>
                <span className="text-xs text-muted-foreground">
                  {" "}
                  · {s.city}
                </span>
              </li>
            ))
          ) : (
            <li className="text-muted-foreground">
              <Link to="/shops" className="text-brick hover:underline">
                Follow a shop
              </Link>
            </li>
          )}
        </ul>
      </section>

      <section className="rounded-xl bg-cream p-4 shadow-[var(--shadow-border)]">
        <ul className="space-y-2 text-sm">
          <li>
            <Link to="/hub" className="hover:text-brick">
              Hub — everything on the board
            </Link>
          </li>
          <li>
            <Link to="/saved" className="flex justify-between hover:text-brick">
              <span>Saved</span>
              <span className="tabular-nums text-muted-foreground">
                {savedCallIds.length + savedPersonIds.length + savedPostIds.length}
              </span>
            </Link>
          </li>
          <li>
            <Link to="/hands" className="hover:text-brick">
              Hand tracker
            </Link>
          </li>
          <li>
            <Link to="/calls" className="flex justify-between hover:text-brick">
              <span>Call tracker</span>
              <span className="tabular-nums text-muted-foreground">{savedCallIds.length + appliedCallIds.length}</span>
            </Link>
          </li>
          <li>
            <Link to="/card/$id" params={{ id: you.id }} className="hover:text-brick">
              Identity card
            </Link>
          </li>
          <li>
            <Link to="/goal" className="hover:text-brick">
              Your next ticket
            </Link>
          </li>
          {sessionRole === "desk" ? (
            <li>
              <Link to="/admin" search={{ bay: "morning" }} className="hover:text-brick">
                Command
              </Link>
            </li>
          ) : null}
          <li>
            <Link to="/reels" className="hover:text-brick">
              Reels
            </Link>
          </li>
          <li>
            <Link to="/market" className="hover:text-brick">
              Market
            </Link>
          </li>
          <li>
            <Link to="/hall" className="hover:text-brick">
              Hall / events
            </Link>
          </li>
          <li className="text-xs text-muted-foreground">
            Next: {meets[0]?.title} · {meets[0]?.when}
          </li>
        </ul>
      </section>
    </div>
  );
}