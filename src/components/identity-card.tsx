import { Link } from "@tanstack/react-router";
import { Portrait } from "@/components/portrait";
import { TicketMark } from "@/components/ticket-plate";
import { QrMark } from "@/components/qr-mark";
import { availabilityLabel, cardName, rankLabel } from "@/lib/format";
import { reputation } from "@/lib/reputation";
import type { CardLayout, Person, Vouch } from "@/lib/types";
import { cn } from "@/lib/utils";

function NameBlock({
  person,
  invert,
  size = "lg",
}: {
  person: Person;
  invert?: boolean;
  size?: "lg" | "xl";
}) {
  return (
    <div className="min-w-0">
      <p
        className={cn(
          "text-[10px] font-medium tracking-[0.2em] uppercase",
          invert ? "text-cream/50" : "text-muted-foreground",
        )}
      >
        Name
      </p>
      <p
        className={cn(
          "mt-0.5 font-display tracking-wide text-balance",
          size === "xl" ? "text-4xl" : "text-2xl",
          invert ? "text-cream" : "text-ink",
        )}
      >
        {cardName(person)}
      </p>
    </div>
  );
}

export function IdentityCard({
  person,
  vouches,
  share,
  layout = "shop",
}: {
  person: Person;
  vouches: Vouch[];
  share?: boolean;
  layout?: CardLayout;
}) {
  const rec = vouches.filter((v) => v.toId === person.id);
  const score = reputation(person, vouches);
  const tickets = person.tickets.slice(0, 4);
  const href = share ? "/p/$id" : "/card/$id";

  if (layout === "ticket") {
    return (
      <article
        className={cn(
          "grid overflow-hidden rounded-xl bg-ink text-cream",
          "grid-cols-[6.25rem_minmax(0,1fr)] aspect-[1.75/1] max-w-md",
          share && "shadow-[var(--shadow-border)]",
        )}
      >
        <div className="relative bg-canvas">
          {person.photo ? (
            <img src={person.photo} alt="" className="size-full object-cover object-top" />
          ) : (
            <div className="grid size-full place-items-center bg-steel">
              <Portrait person={person} size="lg" link={false} />
            </div>
          )}
        </div>
        <div className="flex min-w-0 flex-col p-3">
          <NameBlock person={person} invert />
          <p className="mt-1 truncate text-xs text-cream/70">{rankLabel(person.level, person.trade)}</p>
          <p className="truncate text-[11px] text-cream/50">
            {person.city ? `${person.city}, ${person.state}` : "City on the card"}
          </p>
          <div className="mt-auto flex items-end justify-between gap-2">
            <div className="flex min-w-0 flex-wrap gap-1">
              {tickets.slice(0, 2).map((t) => (
                <span key={t.id} className="rounded-full bg-cream/10 px-1.5 py-0.5 text-[10px]">
                  {t.name}
                </span>
              ))}
            </div>
            <QrMark seed={person.id} label="" compact />
          </div>
        </div>
      </article>
    );
  }

  const plate = layout === "plate";

  return (
    <article
      className={cn(
        "overflow-hidden rounded-xl",
        plate ? "bg-cream text-ink" : "bg-ink text-cream",
        share && "max-w-sm shadow-[var(--shadow-border)]",
      )}
    >
      <div className="flex items-start gap-3 p-4">
        <Portrait
          person={person}
          size="lg"
          link={false}
          className={plate ? "ring-2 ring-ink/10" : "ring-2 ring-cream/20"}
        />
        <div className="min-w-0 flex-1">
          <NameBlock person={person} invert={!plate} />
          <p className={cn("mt-1 text-sm", plate ? "text-muted-foreground" : "text-cream/70")}>
            {rankLabel(person.level, person.trade)}
          </p>
          <p className={cn("mt-0.5 text-xs", plate ? "text-muted-foreground" : "text-cream/55")}>
            {person.city ? `${person.city}, ${person.state}` : "Add your city"}
            {person.veteran ? ` · ${person.veteran.branch}` : ""}
          </p>
        </div>
      </div>
      <div
        className={cn(
          "flex items-center justify-between border-t px-4 py-2 text-xs",
          plate ? "border-ink/10" : "border-cream/10",
        )}
      >
        <span>
          Reputation <span className="font-display text-lg tabular-nums">{score.overall}</span>
        </span>
        <span className="tabular-nums">{rec.length} vouches</span>
      </div>
      <div className="flex flex-wrap gap-1.5 px-4 pb-3">
        {tickets.map((t) => (
          <TicketMark key={t.id} ticket={t} />
        ))}
      </div>
      <div
        className={cn(
          "flex items-center justify-between px-4 py-2 text-xs font-medium",
          plate ? "bg-ink text-cream" : "bg-brick text-cream",
        )}
      >
        <span>{availabilityLabel(person.availability).toUpperCase()}</span>
        <span className="flex gap-3">
          <Link
            to="/mail"
            search={{ to: person.id }}
            className="underline-offset-2 hover:underline"
          >
            Email
          </Link>
          {share ? (
            <Link to="/p/$id" params={{ id: person.id }} className="underline-offset-2 hover:underline">
              View profile
            </Link>
          ) : (
            <Link to="/card/$id" params={{ id: person.id }} className="underline-offset-2 hover:underline">
              Share card
            </Link>
          )}
        </span>
      </div>
    </article>
  );
}
