import { Link } from "@tanstack/react-router";
import { MapPin, CheckCircle2, Hammer, ShieldCheck, Calendar } from "lucide-react";
import { Portrait } from "@/components/portrait";
import { availabilityLabel, cardName, rankLabel } from "@/lib/format";
import { reputation } from "@/lib/reputation";
import { useForge } from "@/lib/store";
import type { CardLayout, Person, Vouch } from "@/lib/types";
import { cn } from "@/lib/utils";

function FactChip({ icon: Icon, label }: { icon: typeof CheckCircle2; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md bg-[#c4a574]/15 px-2.5 py-1 text-[11px] font-medium tracking-wide text-ink">
      <Icon className="size-3.5 text-[#a65d3f]" />
      {label}
    </span>
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
  const open = person.availability === "open";
  const youId = useForge((s) => s.youId);
  const mine = youId === person.id;

  if (layout === "ticket") {
    return (
      <article className="grid max-w-md grid-cols-[6.25rem_minmax(0,1fr)] overflow-hidden rounded-xl bg-ink text-cream aspect-[1.75/1]">
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
          <p className="font-display text-2xl tracking-wide text-cream">{cardName(person)}</p>
          <p className="mt-0.5 truncate text-xs text-cream/70">{rankLabel(person.level, person.trade)}</p>
          <p className="truncate text-[11px] text-cream/50">
            {person.city ? `${person.city}, ${person.state}` : "City on the card"}
          </p>
          <div className="mt-auto flex flex-wrap gap-1">
            {tickets.slice(0, 2).map((t) => (
              <span key={t.id} className="rounded-full bg-cream/10 px-1.5 py-0.5 text-[10px]">
                {t.name}
              </span>
            ))}
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className={cn("overflow-hidden rounded-2xl bg-white shadow-[0_1px_2px_rgba(26,24,20,0.04),0_0_0_1px_rgba(26,24,20,0.06)]", share && "max-w-lg")}>
      <div className="flex items-start justify-between gap-4 border-b border-[#e8e2d8] px-5 py-4">
        <div className="flex items-start gap-3">
          <Portrait person={person} size="lg" link={false} className="ring-1 ring-[#e8e2d8]" />
          <div className="min-w-0">
            <p className="font-display text-3xl tracking-wide text-ink">{cardName(person)}</p>
            <p className="mt-0.5 text-sm text-muted-foreground">{rankLabel(person.level, person.trade)}</p>
            <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
              <MapPin className="size-3" />
              {person.city ? `${person.city}, ${person.state}` : "Add your city"}
              <span className="mx-1">·</span>
              <span className={cn("inline-flex items-center gap-1", open ? "text-[#3d7a5a]" : "text-muted-foreground")}>
                <span className={cn("size-1.5 rounded-full", open ? "bg-[#3d7a5a]" : "bg-muted")} />
                {availabilityLabel(person.availability)}
              </span>
            </p>
          </div>
        </div>
        <div className="hidden flex-wrap justify-end gap-1.5 sm:flex">
          <FactChip icon={CheckCircle2} label="Certified" />
          <FactChip icon={Hammer} label="Done" />
          <FactChip icon={ShieldCheck} label="Vouched" />
          <FactChip icon={Calendar} label={open ? "Available" : "On job"} />
        </div>
      </div>

      <div className="grid gap-4 p-5 sm:grid-cols-[1fr_auto]">
        <div>
          <p className="text-[11px] font-medium tracking-[0.14em] uppercase text-muted-foreground">Proof of work</p>
          <p className="mt-1 text-sm text-ink/80">
            Reputation {score.overall}. {rec.length} vouch{rec.length === 1 ? "" : "es"} from shared work.
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            Proof of work lives on the profile. Tickets and vouches prove the rest.
          </p>
        </div>

        <div className="min-w-[12rem]">
          <p className="text-[11px] font-medium tracking-[0.14em] uppercase text-muted-foreground">Tickets</p>
          <ul className="mt-2 space-y-1.5">
            {tickets.map((t) => (
              <li key={t.id} className="flex items-center gap-2 rounded-md bg-[#c4a574]/12 px-2.5 py-1.5 text-xs">
                <CheckCircle2 className="size-3.5 shrink-0 text-[#a65d3f]" />
                <span className="truncate">{t.name}</span>
              </li>
            ))}
            {!tickets.length ? <li className="text-xs text-muted-foreground">No tickets on file.</li> : null}
          </ul>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-[#e8e2d8] px-5 py-3 text-xs">
        <span className="text-muted-foreground">Built on reputation. Verified by work.</span>
        <span className="flex shrink-0 items-center gap-3">
          {mine ? (
            <Link to="/wallet" className="font-medium text-[#a65d3f] hover:underline">
              Tickets & vouches →
            </Link>
          ) : (
            <Link
              to="/p/$id"
              params={{ id: person.id }}
              hash="wallet"
              className="font-medium text-[#a65d3f] hover:underline"
            >
              Tickets & vouches →
            </Link>
          )}
          <Link
            to={share ? "/p/$id" : "/card/$id"}
            params={{ id: person.id }}
            className="font-medium text-[#a65d3f] hover:underline"
          >
            {share ? "View profile" : "Share card"} →
          </Link>
        </span>
      </div>
    </article>
  );
}
