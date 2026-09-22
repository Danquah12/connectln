import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Mic } from "lucide-react";
import { Portrait } from "@/components/portrait";
import { useDebouncedValue } from "@/lib/debounce";
import { searchBoard, type Hit, type HitKind } from "@/lib/search";
import { suggestBoard } from "@/lib/suggest";
import { canListen, startListening } from "@/lib/listen";
import { listings as seedListings } from "@/lib/market-seed";
import { personById, useForge } from "@/lib/store";
import { cn } from "@/lib/utils";

const KIND_LABEL: Record<HitKind, string> = {
  call: "Call",
  post: "Shop talk",
  person: "Person",
  shop: "Shop",
  listing: "Market",
  event: "Event",
  fund: "Funding",
  circle: "Circle",
  talk: "Talk",
};

function hitTo(hit: Hit) {
  switch (hit.kind) {
    case "call":
      return { to: "/calls" as const, hash: hit.id };
    case "person":
      return { to: "/p/$id" as const, params: { id: hit.id } };
    case "shop":
      return { to: "/s/$id" as const, params: { id: hit.id } };
    case "listing":
      return { to: "/listing/$id" as const, params: { id: hit.id } };
    case "talk":
      return { to: "/talk/$id" as const, params: { id: hit.id } };
    case "event":
      return { to: "/events" as const };
    case "fund":
      return { to: "/fund" as const };
    case "circle":
      return { to: "/circles" as const };
    default:
      return { to: "/" as const };
  }
}

export function BoardSearch({
  variant = "header",
}: {
  variant?: "header" | "page";
}) {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const qParam =
    useRouterState({
      select: (s) => new URLSearchParams(s.location.searchStr).get("q") ?? "",
    }) ?? "";
  const kindParam =
    useRouterState({
      select: (s) => new URLSearchParams(s.location.searchStr).get("kind") ?? "",
    }) ?? "";
  const [q, setQ] = useState(variant === "page" ? qParam : "");
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const [listening, setListening] = useState(false);
  const stopListen = useRef<(() => void) | null>(null);

  useEffect(() => () => stopListen.current?.(), []);
  const debouncedQ = useDebouncedValue(q, 180);

  const people = useForge((s) => s.people);
  const posts = useForge((s) => s.posts);
  const calls = useForge((s) => s.calls);
  const extra = useForge((s) => s.extraListings);
  const pulled = useForge((s) => s.pulledListings);
  const you = personById(people, useForge((s) => s.youId));

  const hits = useMemo(() => {
    const query = debouncedQ.trim();
    if (query.length < 1) return [];
    return searchBoard(query, people, posts, calls, extra, pulled, you?.trade).slice(0, 8);
  }, [debouncedQ, people, posts, calls, extra, pulled, you?.trade]);

  const suggestions = useMemo(
    () => suggestBoard(debouncedQ, people, calls, [...extra, ...seedListings]),
    [debouncedQ, people, calls, extra],
  );

  useEffect(() => {
    if (variant === "page") setQ(qParam);
  }, [qParam, variant]);

  useEffect(() => {
    if (variant !== "page") return;
    const t = window.setTimeout(() => {
      const next = debouncedQ.trim();
      if (next === qParam) return;
      void navigate({
        to: "/search",
        search: {
          ...(next ? { q: next } : {}),
          ...(kindParam ? { kind: kindParam } : {}),
        },
        replace: true,
      });
    }, 120);
    return () => window.clearTimeout(t);
  }, [debouncedQ, qParam, kindParam, variant, navigate]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!box.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const header = variant === "header";
  const showPanel = open && q.trim().length > 0 && (header || pathname !== "/search");

  return (
    <div ref={box} className={cn("relative min-w-0", header ? "flex-1" : "w-full")}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const query = q.trim();
          setOpen(false);
          void navigate({ to: "/search", search: query ? { q: query } : {} });
        }}
      >
        <label className="sr-only" htmlFor={header ? "board-search" : "board-search-page"}>
          Search the board
        </label>
        <div className="relative">
        <input
          id={header ? "board-search" : "board-search-page"}
          value={q}
          autoComplete="off"
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => {
            if (q.trim()) setOpen(true);
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") setOpen(false);
          }}
          placeholder="Calls, people, OSHA, 11B…"
          className={
            header
              ? "h-10 w-full min-w-0 rounded-full border-0 bg-cream/10 px-3 pr-10 text-base text-cream placeholder:text-cream/45 outline-none ring-0 focus:bg-cream/15 sm:h-9 sm:max-w-md sm:px-4 sm:text-sm"
              : "flex h-11 w-full rounded-md border border-input bg-cream px-3 pr-10 text-sm text-ink outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
          }
        />
        {canListen() ? (
          <button
            type="button"
            aria-label={listening ? "Stop listening" : "Speak a search"}
            className={cn(
              "absolute top-1/2 right-2 -translate-y-1/2 text-xs",
              header ? "text-cream/70" : "text-muted-foreground",
              listening && "text-brick",
            )}
            onClick={() => {
              if (listening) {
                stopListen.current?.();
                stopListen.current = null;
                setListening(false);
                return;
              }
              setListening(true);
              stopListen.current = startListening((text, done) => {
                if (text.trim()) {
                  setQ(text.trim());
                  setOpen(true);
                }
                if (done) {
                  stopListen.current = null;
                  setListening(false);
                }
              });
            }}
          >
            {listening ? "…" : <Mic className="size-3.5" />}
          </button>
        ) : null}
        </div>
      </form>

      {showPanel ? (
        <div className="absolute top-[calc(100%+0.4rem)] left-0 right-0 z-50 max-h-[min(70dvh,24rem)] w-full max-w-md overflow-y-auto overflow-hidden rounded-xl bg-cream text-ink shadow-[var(--shadow-border)]">
          {suggestions.length ? (
            <ul className="flex flex-wrap gap-1.5 border-b border-border px-3 py-2">
              {suggestions.map((s) => (
                <li key={`${s.why}-${s.term}`}>
                  <button
                    type="button"
                    className="rounded-full bg-canvas px-2.5 py-1 text-[11px] text-ink hover:bg-accent"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      setQ(s.term);
                      void navigate({ to: "/search", search: { q: s.term } });
                      setOpen(false);
                    }}
                  >
                    {s.term}
                    <span className="ml-1 text-muted-foreground">{s.why}</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
          {hits.length === 0 ? (
            <p className="px-4 py-3 text-sm text-muted-foreground">Nothing yet. Keep typing a ticket, MOS, or city.</p>
          ) : (
            <ul>
              {hits.map((h) => (
                <li key={`${h.kind}-${h.id}`}>
                  <HitLink hit={h} onPick={() => setOpen(false)} />
                </li>
              ))}
            </ul>
          )}
          <Link
            to="/search"
            search={{ q: q.trim() }}
            onClick={() => setOpen(false)}
            className="block border-t border-border px-4 py-2.5 text-xs text-brick hover:bg-canvas"
          >
            All results for “{q.trim()}”
          </Link>
        </div>
      ) : null}
    </div>
  );
}

function HitLink({ hit, onPick }: { hit: Hit; onPick: () => void }) {
  const people = useForge((s) => s.people);
  const person = hit.kind === "person" ? personById(people, hit.id) : undefined;
  const dest = hitTo(hit);
  return (
    <Link
      {...dest}
      onClick={onPick}
      className="flex items-center gap-3 px-3 py-2.5 hover:bg-canvas"
    >
      {person ? (
        <Portrait person={person} size="sm" link={false} />
      ) : hit.photo ? (
        <img src={hit.photo} alt="" className="size-9 rounded-md object-cover" />
      ) : (
        <span className="grid size-9 shrink-0 place-items-center rounded-md bg-canvas text-xs font-medium">
          {KIND_LABEL[hit.kind].slice(0, 1)}
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium">{hit.title}</span>
        <span className="block truncate text-[11px] text-muted-foreground">
          {KIND_LABEL[hit.kind]} · {hit.blurb}
        </span>
      </span>
    </Link>
  );
}
