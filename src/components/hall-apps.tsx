import { useEffect, useRef, useState } from "react";
import {
  BarChart3,
  Compass,
  GraduationCap,
  LayoutGrid,
  Megaphone,
  Receipt,
  Store,
  Users,
  Wrench,
} from "lucide-react";

type Item = {
  to: string;
  search?: Record<string, string>;
  label: string;
  hint?: string;
  icon: typeof Store;
};

const TOOLS: { label?: string; items: Item[] }[] = [
  {
    items: [
      { to: "/market", label: "Market", hint: "List what you built", icon: Store },
      { to: "/groups", label: "Groups", hint: "Crews and rooms", icon: Users },
      { to: "/packages", label: "Billing", hint: "Shop board and seats", icon: Receipt },
    ],
  },
  {
    label: "Hands",
    items: [
      { to: "/hands", label: "Who fits", hint: "Tickets against a seat", icon: BarChart3 },
      { to: "/calls", label: "Post a call", hint: "A seat on the board", icon: Wrench },
    ],
  },
  {
    label: "Sell",
    items: [{ to: "/market", label: "Services", hint: "Tools, shifts, and work", icon: Compass }],
  },
  {
    label: "The shop",
    items: [{ to: "/shops", label: "Your shop", hint: "The page people find", icon: Megaphone }],
  },
];

export function HallApps({ desk }: { desk: boolean }) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (!box.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const explore: Item[] = [
    { to: "/calls", label: "Hire", hint: "Rank hands. Write a fill.", icon: Wrench },
    { to: "/market", label: "Sell", hint: "List a tool or a service.", icon: Store },
    { to: "/calls", label: "Post a call", hint: "The seat goes on the board.", icon: Compass },
    { to: "/packages", label: "Shop board", hint: "Seats, fills, and the bill.", icon: Receipt },
    { to: "/learn", label: "Learn", hint: "Courses for the crew.", icon: GraduationCap },
    { to: "/scope", label: "Scope", hint: "What you keep on the bench.", icon: BarChart3 },
    desk
      ? { to: "/admin", search: { bay: "morning" }, label: "Command", hint: "The operator desk.", icon: BarChart3 }
      : { to: "/admin/login", label: "Command", hint: "Operators sign in here.", icon: BarChart3 },
  ];

  return (
    <div ref={box} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-label="Shop tools"
        onClick={() => setOpen((v) => !v)}
        className="grid size-11 place-items-center rounded-full text-cream hover:bg-cream/10"
      >
        <LayoutGrid className="size-5" strokeWidth={1.75} />
      </button>
      {open ? (
        <div className="absolute right-0 top-12 z-50 w-[min(40rem,calc(100vw-1.5rem))] overflow-hidden rounded-xl border border-ink/10 bg-cream text-ink shadow-[var(--shadow-border)]">
          <div className="grid sm:grid-cols-2">
            <div className="border-b border-ink/10 p-4 sm:border-r sm:border-b-0">
              <p className="text-sm font-semibold">Your tools</p>
              <ul className="mt-3 flex flex-col gap-3">
                {TOOLS.map((group) => (
                  <li key={group.label ?? "top"}>
                    {group.label ? (
                      <p className="mb-1 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                        {group.label}
                      </p>
                    ) : null}
                    <ul className="flex flex-col">
                      {group.items.map((item) => (
                        <li key={`${group.label}-${item.label}`}>
                          <ToolLink item={item} onPick={() => setOpen(false)} />
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>
            </div>
            <div className="p-4">
              <p className="text-sm font-semibold">For the shop</p>
              <ul className="mt-3 flex flex-col">
                {explore.map((item) => (
                  <li key={item.label}>
                    <a
                      href={item.to}
                      onClick={() => setOpen(false)}
                      className="block rounded-lg px-1 py-2 hover:bg-canvas"
                    >
                      <span className="block text-sm font-medium">{item.label}</span>
                      {item.hint ? <span className="block text-xs text-muted-foreground">{item.hint}</span> : null}
                    </a>
                  </li>
                ))}
                <li>
                  <a
                    href="/shops"
                    onClick={() => setOpen(false)}
                    className="mt-1 block rounded-lg px-1 py-2 text-sm font-medium hover:bg-canvas"
                  >
                    Open a shop +
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ToolLink({ item, onPick }: { item: Item; onPick: () => void }) {
  const Icon = item.icon;
  return (
    <a href={item.search ? `${item.to}?bay=${item.search.bay}` : item.to} onClick={onPick} className="flex items-center gap-3 rounded-lg px-1 py-1.5 hover:bg-canvas">
      <span className="grid size-8 place-items-center rounded-md bg-ink text-cream">
        <Icon className="size-4" strokeWidth={1.75} />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-medium">{item.label}</span>
        {item.hint ? <span className="block truncate text-xs text-muted-foreground">{item.hint}</span> : null}
      </span>
    </a>
  );
}
