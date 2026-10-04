import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { cardName, initials, tradeMark } from "@/lib/format";
import { presenceOf } from "@/lib/presence";
import { clipPosters } from "@/lib/clip-posters";
import type { Person } from "@/lib/types";

function shownFace(person: Person) {
  if (person.photo && !person.photo.startsWith("/portraits/")) return person.photo;
  return clipPosters.find((p) => p.trade === person.trade)?.photo || person.photo;
}

export function Portrait({
  person,
  size = "md",
  link = true,
  className,
  presence = true,
}: {
  person: Person;
  size?: "sm" | "md" | "lg" | "xl";
  link?: boolean;
  className?: string;
  presence?: boolean;
}) {
  const dim = {
    sm: "size-9",
    md: "size-11",
    lg: "size-14",
    xl: "size-24",
  }[size];
  const state = presence ? presenceOf(person) : null;
  const dot = {
    sm: "size-2",
    md: "size-2.5",
    lg: "size-3",
    xl: "size-3.5",
  }[size];
  const open = person.availability === "open";
  const mark = tradeMark(person.trade, Boolean(person.veteran));
  const openType =
    size === "xl" ? "text-[9px] tracking-[0.18em]" : size === "lg" ? "text-[8px] tracking-[0.14em]" : "";

  const img = (
    <span className={cn("relative inline-flex shrink-0", dim)}>
      <span className={cn("id-badge inline-flex size-full overflow-hidden bg-ink", className)}>
        <span className={cn("id-badge-bar", mark.tone)} aria-hidden />
        <span className={cn("id-badge-ear", mark.tone)} aria-hidden />
        {shownFace(person) ? (
          <img
            src={shownFace(person)}
            alt=""
            className="size-full object-cover object-top"
            crossOrigin="anonymous"
          />
        ) : (
          <span className="flex size-full items-center justify-center font-display text-cream">
            {initials(cardName(person))}
          </span>
        )}
        {size !== "sm" ? (
          <span className="id-badge-stamp" aria-hidden>
            {mark.letter}
          </span>
        ) : null}
        {open ? (
          <span
            className={cn(
              "absolute inset-x-0 bottom-0 flex items-center justify-center bg-brick text-cream",
              size === "sm" || size === "md" ? "h-[22%]" : "h-[28%]",
            )}
            title="Open to calls"
          >
            {openType ? (
              <span className={cn("font-medium uppercase", openType)}>Open</span>
            ) : null}
          </span>
        ) : null}
      </span>
      {state ? (
        <span
          className={cn(
            "absolute right-0 ring-2 ring-cream",
            open ? "top-0" : "bottom-0",
            dot,
            state === "online" && "bg-ok presence-online",
            state === "away" && "bg-warn",
            state === "offline" && "bg-muted-foreground/55",
          )}
          title={state === "online" ? "On the hall" : state === "away" ? "Stepped off" : "Offline"}
          aria-hidden
        />
      ) : null}
      <span className="sr-only">
        {cardName(person)}
        {open ? ", open to calls" : ""}
      </span>
    </span>
  );

  if (!link) return img;
  return (
    <Link
      to="/p/$id"
      params={{ id: person.id }}
      className="inline-flex focus-visible:ring-2 focus-visible:ring-ring/60"
      aria-label={person.name}
    >
      {img}
    </Link>
  );
}
