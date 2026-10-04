import { type ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Mark } from "@/components/mark";
import { SessionBinder } from "@/components/session-binder";
import { ThemeBinder } from "@/components/theme-picker";
import { ClipPump } from "@/components/clip-pump";
import { signOut } from "@/lib/auth/client";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { personById, useForge } from "@/lib/store";
import { cn } from "@/lib/utils";

export const COMMAND_NAVS: { id: string; label: string; group: string }[] = [
  { id: "morning", label: "Overview", group: "Operate" },
  { id: "clips", label: "Synced", group: "Operate" },
  { id: "seats", label: "Seats", group: "Operate" },
  { id: "queue", label: "Queue", group: "Operate" },
  { id: "notes", label: "Notes", group: "Operate" },
  { id: "tickets", label: "Tickets", group: "Work" },
  { id: "calls", label: "Calls", group: "Work" },
  { id: "contracts", label: "Contracts", group: "Work" },
  { id: "market", label: "Market", group: "Work" },
  { id: "learn", label: "Learn", group: "Learn" },
  { id: "mhcc", label: "Maryland", group: "Learn" },
  { id: "packages", label: "Packages", group: "Money" },
  { id: "pay", label: "Ledger", group: "Money" },
  { id: "mail", label: "Mail", group: "Money" },
  { id: "smtp", label: "SMTP", group: "Money" },
  { id: "security", label: "Security", group: "System" },
  { id: "flags", label: "Flags", group: "System" },
  { id: "audit", label: "Audit", group: "System" },
  { id: "health", label: "Health", group: "System" },
];

const GROUPS = ["Operate", "Work", "Learn", "Money", "System"] as const;

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const bay =
    useRouterState({
      select: (s) => {
        const raw = s.location.search as { bay?: unknown };
        return typeof raw.bay === "string" ? raw.bay : "morning";
      },
    }) ?? "morning";
  const navigate = useNavigate();
  const people = useForge((s) => s.people);
  const youId = useForge((s) => s.youId);
  const you = personById(people, youId);
  const { user } = useCurrentUserState();
  const name = you?.name || user?.displayName || user?.primaryEmail || "Operator";

  function openBay(id: string) {
    void navigate({ to: "/admin", search: { bay: id } });
  }

  return (
    <div className="command-shell min-h-dvh bg-ink text-cream">
      <ThemeBinder />
      <SessionBinder />
      <ClipPump />
      <div className="flex min-h-dvh flex-col lg:grid lg:grid-cols-[15rem_minmax(0,1fr)]">
        <aside className="border-b border-cream/10 lg:border-r lg:border-b-0">
          <div className="flex items-center justify-between gap-3 px-4 py-4 lg:flex-col lg:items-stretch lg:px-4 lg:pt-6">
            <Link to="/admin" search={{ bay: "morning" }} className="flex items-center gap-2.5">
              <Mark className="size-7" />
              <span className="min-w-0">
                <span className="block font-display text-2xl leading-none tracking-[0.08em]">Command</span>
                <span className="mt-1 block text-[11px] tracking-[0.16em] text-cream/45 uppercase">
                  ConnectLn · not the hall
                </span>
              </span>
            </Link>
            <Link
              to="/"
              className="hidden rounded-full border border-cream/20 px-3 py-1.5 text-xs font-medium text-cream/80 hover:bg-cream/10 lg:inline-flex"
            >
              Open hall
            </Link>
          </div>
          <nav className="hidden max-h-[calc(100dvh-8rem)] overflow-y-auto px-3 pb-6 lg:block">
            {GROUPS.map((group) => (
              <div key={group} className="mb-4">
                <p className="px-2 pb-1 text-[10px] tracking-[0.18em] text-cream/35 uppercase">{group}</p>
                <ul className="flex flex-col gap-0.5">
                  {COMMAND_NAVS.filter((n) => n.group === group).map((item) => (
                    <li key={item.id}>
                      <button
                        type="button"
                        onClick={() => openBay(item.id)}
                        className={cn(
                          "flex h-10 w-full items-center rounded-lg px-3 text-left text-sm font-medium",
                          bay === item.id ? "bg-cream text-ink" : "text-cream/80 hover:bg-cream/10",
                        )}
                      >
                        {item.label}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
          <div className="flex gap-1 overflow-x-auto px-3 pb-3 lg:hidden">
            {COMMAND_NAVS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => openBay(item.id)}
                className={cn(
                  "h-9 shrink-0 rounded-full px-3 text-xs font-medium",
                  bay === item.id ? "bg-cream text-ink" : "border border-cream/20 text-cream/80",
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
        </aside>
        <div className="flex min-w-0 flex-col bg-canvas text-ink">
          <header className="flex items-center justify-between gap-3 border-b border-ink/10 bg-cream px-4 py-3">
            <div className="min-w-0">
              <p className="text-[11px] tracking-[0.16em] text-muted-foreground uppercase">
                {pathname.startsWith("/admin") ? "Administrator" : "Command"}
              </p>
              <p className="truncate text-sm font-medium">{name}</p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Link
                to="/"
                className="rounded-full border border-ink/15 px-3 py-1.5 text-xs font-medium hover:bg-canvas lg:hidden"
              >
                Hall
              </Link>
              <button
                type="button"
                className="rounded-full bg-ink px-3 py-1.5 text-xs font-medium text-cream"
                onClick={() => void signOut()}
              >
                Sign out
              </button>
            </div>
          </header>
          <main className="min-w-0 flex-1 px-3 py-4 sm:px-5 sm:py-5">{children}</main>
        </div>
      </div>
    </div>
  );
}
