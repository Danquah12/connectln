import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { callingPeople } from "@/lib/callings";
import { LEARN_PATHS } from "@/lib/learn-paths";
import { BRIEFS } from "@/lib/briefs";
import { LIBRARIES } from "@/lib/libraries";
import { TRADE_GROUPS } from "@/lib/seed";
import { youtubeThumb } from "@/lib/youtube";
import type { FieldGroup, Trade } from "@/lib/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/library")({ component: LibraryPage });

function LibraryPage() {
  const [group, setGroup] = useState<FieldGroup>("trades");
  const trades = TRADE_GROUPS.find((g) => g.id === group)?.trades ?? [];
  const [trade, setTrade] = useState<Trade>(trades[0] ?? "Electrician");
  const active = trades.includes(trade) ? trade : trades[0];
  const path = LEARN_PATHS.find((p) => p.trade === active);
  const lib = active ? LIBRARIES[active] : undefined;
  const who = callingPeople.find((p) => p.trade === active);

  return (
    <div className="flex flex-col gap-4">
      <header>
        <h1 className="font-display text-4xl tracking-wide">Career library</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Every calling. The film, the house that issues the card, and the paid library beside it.
        </p>
      </header>
      <div className="flex gap-1.5 overflow-x-auto">
        {TRADE_GROUPS.map((g) => (
          <button
            key={g.id}
            type="button"
            onClick={() => {
              setGroup(g.id);
              setTrade(g.trades[0]!);
            }}
            className={cn(
              "h-9 shrink-0 rounded-full px-3 text-sm",
              group === g.id ? "bg-ink text-cream" : "bg-cream text-muted-foreground",
            )}
          >
            {g.label}
          </button>
        ))}
      </div>
      <div className="flex gap-1.5 overflow-x-auto">
        {trades.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTrade(t)}
            className={cn(
              "h-9 shrink-0 rounded-full px-3 text-sm",
              active === t ? "bg-ink text-cream" : "bg-cream text-muted-foreground",
            )}
          >
            {t}
          </button>
        ))}
      </div>
      {path && lib && active ? (
        <article className="overflow-hidden rounded-xl bg-cream shadow-[var(--shadow-border)]">
          {path.youtube ? (
            <Link to="/watch/$id" params={{ id: path.youtube }} className="block">
              <img src={youtubeThumb(path.youtube, "wide")} alt="" className="aspect-video w-full object-cover" />
            </Link>
          ) : null}
          <div className="p-4">
            <p className="font-medium">{active}</p>
            <p className="mt-2 text-sm leading-relaxed">{path.steps}</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div>
                <p className="text-[11px] font-medium tracking-[0.16em] text-muted-foreground uppercase">Directions</p>
                <ol className="mt-1 list-decimal space-y-1 pl-4 text-sm leading-relaxed">
                  {BRIEFS[active].directions.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ol>
              </div>
              <div>
                <p className="text-[11px] font-medium tracking-[0.16em] text-muted-foreground uppercase">Guidelines</p>
                <ul className="mt-1 list-disc space-y-1 pl-4 text-sm leading-relaxed">
                  {BRIEFS[active].guidelines.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              </div>
            </div>
            <p className="mt-3 text-sm">
              <a href={path.href} className="font-medium underline" target="_blank" rel="noreferrer">
                Where it is issued
              </a>
              <span className="text-muted-foreground"> · {path.house}</span>
            </p>
            <p className="mt-1 text-sm">
              <a href={lib.href} className="font-medium underline" target="_blank" rel="noreferrer">
                Paid · {lib.house}
              </a>
              <span className="text-muted-foreground"> · {lib.seat}</span>
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {path.youtube ? (
                <Link
                  to="/watch/$id"
                  params={{ id: path.youtube }}
                  className="inline-flex h-9 items-center rounded-full bg-ink px-3 text-sm text-cream"
                >
                  Film
                </Link>
              ) : null}
              {who ? (
                <>
                  <Link
                    to="/p/$id"
                    params={{ id: who.id }}
                    className="inline-flex h-9 items-center rounded-full bg-canvas px-3 text-sm"
                  >
                    {who.name}
                  </Link>
                  <Link
                    to="/card/$id"
                    params={{ id: who.id }}
                    className="inline-flex h-9 items-center rounded-full bg-canvas px-3 text-sm"
                  >
                    Card
                  </Link>
                </>
              ) : (
                <Link to="/learn" className="inline-flex h-9 items-center rounded-full bg-canvas px-3 text-sm">
                  Learn
                </Link>
              )}
            </div>
          </div>
        </article>
      ) : (
        <p className="text-sm text-muted-foreground">No path on file for this calling.</p>
      )}
    </div>
  );
}
