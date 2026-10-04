import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Bell, Briefcase, ClipboardList, GraduationCap, MessageSquare, Newspaper, UserRound, Users } from "lucide-react";
import { HallBinder } from "@/components/hall-binder";
import { HallBrief } from "@/components/hall-brief";
import { IdentityBench } from "@/components/identity-bench";
import { LineButton } from "@/components/line-compose";
import { LineDock } from "@/components/line-dock";
import { LineStage } from "@/components/line-stage";
import { Mark } from "@/components/mark";
import { Portrait } from "@/components/portrait";
import { SessionBinder } from "@/components/session-binder";
import { ThemeBinder, ThemeMenu } from "@/components/theme-picker";
import { LangMenu } from "@/components/lang-menu";
import { AdminShell } from "@/components/admin-shell";
import { ClipPump } from "@/components/clip-pump";
import { HallApps } from "@/components/hall-apps";
import { BoardSearch } from "@/components/board-search";
import { signOut } from "@/lib/auth/client";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { navLabel } from "@/lib/lang";
import { ticketStatus, ticketStatusLabel } from "@/lib/format";
import { buildNotices, decisionCount } from "@/lib/notices";
import { personById, useForge } from "@/lib/store";
import { parseBoardSearch } from "@/lib/board";
import { silenceHall } from "@/lib/voice-bus";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Shop talk", short: "Talk", icon: Newspaper },
  { to: "/calls", label: "Calls", short: "Calls", icon: Briefcase },
  { to: "/learn", label: "Learn", short: "Learn", icon: GraduationCap },
  { to: "/people", label: "People", short: "People", icon: Users },
  { to: "/messages", label: "Inbox", short: "Inbox", icon: MessageSquare },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const boardSearch = useRouterState({
    select: (s) => parseBoardSearch(s.location.search as Record<string, unknown>),
  });
  const people = useForge((s) => s.people);
  const youId = useForge((s) => s.youId);
  const threads = useForge((s) => s.threads);
  const sessionRole = useForge((s) => s.sessionRole);
  const lang = useForge((s) => s.hallLang);
  const you = personById(people, youId);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      if (useForge.getState().hydrated) return;
      await useForge.persist.rehydrate();
      if (!cancelled) useForge.getState().setHydrated();
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const prevPath = useRef(pathname);
  useEffect(() => {
    if (prevPath.current === pathname) return;
    prevPath.current = pathname;
    silenceHall();
  }, [pathname]);

  const onCommand = pathname.startsWith("/admin") || pathname.startsWith("/desk");
  const unreadHint = threads.some((t) => t.messages.at(-1)?.fromId !== youId);

  if (pathname === "/login" || pathname === "/goal" || pathname === "/record" || pathname === "/admin/login") {
    return (
      <>
        <ThemeBinder />
        <SessionBinder />
        {children}
      </>
    );
  }

  if (onCommand) {
    return <AdminShell>{children}</AdminShell>;
  }

  return (
    <div className="hall-shell min-h-dvh bg-canvas text-ink">
      <ThemeBinder />
      <SessionBinder />
      <ClipPump />
      <HallBinder />
      <header className="hall-head sticky top-0 z-40 border-b border-ink/20 bg-ink text-cream">
        <div className="hall-wide mx-auto flex h-12 max-w-6xl items-center gap-2 px-3 sm:h-14 sm:gap-4 sm:px-4">
          <Link to="/" className="flex shrink-0 items-center gap-2 sm:gap-2.5">
            <Mark className="size-6 sm:size-7" />
            <span className="hidden font-display text-[1.45rem] leading-none tracking-[0.06em] min-[420px]:inline">
              ConnectLn
            </span>
          </Link>
          <BoardSearch />
          <div className="ml-auto flex shrink-0 items-center gap-0.5 sm:gap-3 [&_button]:max-[420px]:size-9">
            {sessionRole === "desk" ? (
              <Link
                to="/admin"
                search={{ bay: "morning" }}
                className="hidden rounded-full border border-cream/25 px-3 py-1.5 text-xs font-medium text-cream hover:bg-cream/10 sm:inline"
              >
                Command
              </Link>
            ) : null}
            <ThemeMenu />
            <LangMenu />
            <HallApps desk={sessionRole === "desk"} />
            <BoardBell />
            <AuthSlot you={you} />
          </div>
        </div>
      </header>

      <div className="hall-main hall-wide mx-auto grid max-w-6xl grid-cols-1 gap-4 px-3 pt-4 sm:gap-6 sm:px-4 sm:pt-5 lg:grid-cols-[13.5rem_minmax(0,1fr)_18rem] xl:grid-cols-[14rem_minmax(0,1fr)_19rem]">
        <nav className="hidden lg:sticky lg:top-20 lg:block lg:self-start">
          <ul className="flex flex-col gap-1">
            {NAV.map((item) => {
              const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
              const Icon = item.icon;
              return (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    search={boardSearch}
                    className={cn(
                      "flex h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors duration-150",
                      active ? "bg-ink text-cream" : "text-ink/80 hover:bg-cream",
                    )}
                  >
                    <Icon className="size-4" strokeWidth={1.75} />
                    {navLabel(lang, item.to, item.label)}
                    {item.to === "/messages" && unreadHint ? (
                      <span className="ml-auto size-1.5 rounded-full bg-brick" />
                    ) : null}
                  </Link>
                </li>
              );
            })}
            {sessionRole === "desk" ? (
              <li>
                <Link
                  to="/admin"
                  search={{ bay: "morning" }}
                  className="flex h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium text-ink/80 hover:bg-cream"
                >
                  <ClipboardList className="size-4" strokeWidth={1.75} />
                  Command
                </Link>
              </li>
            ) : null}
            <li>
              <Link
                to="/you"
                className={cn(
                  "flex h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors duration-150",
                  pathname === "/you" || pathname === `/p/${youId}`
                    ? "bg-ink text-cream"
                    : "text-ink/80 hover:bg-cream",
                )}
              >
                <UserRound className="size-4" strokeWidth={1.75} />
                Your card
              </Link>
            </li>
          </ul>
        </nav>

        <main className="min-w-0">{children}</main>

        <aside className="hidden lg:sticky lg:top-20 lg:block lg:self-start">
          <div className="flex flex-col gap-4">
            <IdentityBench />
            <HallBrief />
            <RightRail />
          </div>
        </aside>
      </div>

      <LineButton />
      <LineStage />
      <LineDock />

      <nav className="hall-tabbar fixed inset-x-0 bottom-0 z-40 border-t border-border bg-cream/95 backdrop-blur-sm lg:hidden">
        <ul className="mx-auto grid max-w-lg grid-cols-6 px-1">
          {NAV.map((item) => {
            const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
            const Icon = item.icon;
            return (
              <li key={item.to}>
                <Link
                  to={item.to}
                  search={boardSearch}
                  className={cn(
                    "flex min-h-14 min-w-0 flex-col items-center justify-center gap-0.5 px-0.5 text-[10px] leading-tight font-medium sm:text-[11px]",
                    active ? "text-brick" : "text-muted-foreground",
                  )}
                >
                  <span className="relative">
                    <Icon className="size-5" strokeWidth={1.75} />
                    {item.to === "/messages" && unreadHint ? (
                      <span className="absolute -top-0.5 -right-0.5 size-1.5 rounded-full bg-brick" />
                    ) : null}
                  </span>
                  <span className="max-w-full truncate">{navLabel(lang, item.to, item.short)}</span>
                </Link>
              </li>
            );
          })}
          <li>
            <Link
              to="/you"
              className={cn(
                "flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px] font-medium",
                pathname === "/you" ? "text-brick" : "text-muted-foreground",
              )}
            >
              <UserRound className="size-5" strokeWidth={1.75} />
              You
            </Link>
          </li>
        </ul>
      </nav>
    </div>
  );
}

function AuthSlot({ you }: { you: ReturnType<typeof personById> }) {
  const { user, isPending } = useCurrentUserState();
  const [signingOut, setSigningOut] = useState(false);

  if (isPending) {
    return <div className="h-8 w-36 animate-pulse rounded-full bg-cream/15" />;
  }
  if (!user) {
    return (
      <Link
        to="/login"
        search={{ seat: "member" }}
        className="rounded-full border border-cream/25 px-3 py-1.5 text-xs font-medium text-cream hover:bg-cream/10"
      >
        Sign in
      </Link>
    );
  }

  const bound = you && you.id === user.id;
  const name = bound ? you.name : (user.displayName ?? user.primaryEmail ?? "You");

  return (
    <div className="flex items-center gap-2">
      <Link to="/you" className="flex items-center gap-2 rounded-full py-1 pr-1 pl-3 hover:bg-cream/10">
        <span className="hidden text-right sm:block">
          <span className="block text-xs font-medium">{name}</span>
          <span className="block text-[11px] text-cream/55">
            {bound ? "On the hall" : "On the board"}
          </span>
        </span>
        {bound ? (
          <Portrait person={you} size="sm" link={false} />
        ) : (
          <span className="grid size-9 place-items-center rounded-full bg-cream/15 text-sm font-medium">
            {name.charAt(0).toUpperCase()}
          </span>
        )}
      </Link>
      <button
        type="button"
        disabled={signingOut}
        onClick={() => {
          setSigningOut(true);
          void signOut("/login").catch(() => setSigningOut(false));
        }}
        className="hidden text-xs text-cream/70 hover:text-cream sm:inline"
      >
        {signingOut ? "Signing out…" : "Sign out"}
      </button>
    </div>
  );
}

function BoardBell() {
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
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  if (!you) return null;
  const n = decisionCount(
    buildNotices({
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
    }),
  );
  return (
    <Link
      to="/board"
      className="relative grid size-11 place-items-center rounded-full hover:bg-cream/10"
      aria-label={n ? `The board, ${n} need a hand` : "The board"}
    >
      <Bell className="size-5" strokeWidth={1.75} />
      {n > 0 && pathname !== "/board" ? (
        <span className="absolute top-2 right-2 size-1.5 rounded-full bg-brick" />
      ) : null}
    </Link>
  );
}

function RightRail() {
  const people = useForge((s) => s.people);
  const youId = useForge((s) => s.youId);
  const calls = useForge((s) => s.calls);
  const you = personById(people, youId);
  if (!you) return null;

  const nearby = calls
    .filter((c) => c.trade === you.trade && c.filled < c.spots)
    .slice(0, 3);
  const attention = you.tickets.filter((t) => {
    const s = ticketStatus(t);
    return s === "soon" || s === "lapsed" || t.verify === "pending" || t.verify === "unverified";
  });

  return (
    <div className="flex flex-col gap-4">
      <section className="rounded-xl bg-cream p-4 shadow-[var(--shadow-border)]">
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          Calls in your trade
        </p>
        <ul className="mt-3 flex flex-col gap-3">
          {nearby.length === 0 ? (
            <li className="text-sm text-muted-foreground">Nothing open right now.</li>
          ) : (
            nearby.map((c) => (
              <li key={c.id}>
                <Link to="/calls" hash={c.id} className="block hover:opacity-80">
                  <p className="text-sm font-medium">{c.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {c.city} · {c.rate} · {c.spots - c.filled} open
                  </p>
                </Link>
              </li>
            ))
          )}
        </ul>
      </section>

      <section className="rounded-xl bg-cream p-4 shadow-[var(--shadow-border)]">
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Come back for</p>
        <ul className="mt-3 space-y-2 text-sm">
          <li>
            <Link to="/learn" className="hover:text-brick">
              Ten minutes on the tools
            </Link>
          </li>
          <li>
            <Link to="/events" className="hover:text-brick">
              Classes, CE, drills
            </Link>
          </li>
          <li>
            <Link to="/fund" className="hover:text-brick">
              Money that sits a class
            </Link>
          </li>
        </ul>
      </section>

      {attention.length > 0 ? (
        <section className="rounded-xl bg-cream p-4 shadow-[var(--shadow-border)]">
          <p className="text-xs font-medium tracking-wide text-warn uppercase">
            Tickets needing a refresh
          </p>
          <ul className="mt-2 space-y-1.5">
            {attention.map((t) => {
              const lapsed = ticketStatus(t) === "lapsed";
              return (
                <li key={t.id} className="text-sm">
                  {t.name}
                  <span
                    className={cn(
                      "ml-2 font-mono text-[11px]",
                      lapsed ? "text-brick" : "text-muted-foreground",
                    )}
                  >
                    {ticketStatusLabel(t)}
                    {t.verify === "pending" ? " · pending" : t.verify === "unverified" ? " · unverified" : ""}
                  </span>
                </li>
              );
            })}
          </ul>
          <Link to="/wallet" className="mt-3 inline-block text-xs font-medium text-brick hover:underline">
            Open the license desk
          </Link>
        </section>
      ) : null}
    </div>
  );
}
