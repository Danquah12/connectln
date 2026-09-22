import { proofOf } from "@/lib/proof";
import type { Person, Vouch } from "@/lib/types";

export function ProofStrip({ person, vouches }: { person: Person; vouches: Vouch[] }) {
  const p = proofOf(person, vouches);
  const bits = [
    `${p.years} yr`,
    `${p.jobs} site${p.jobs === 1 ? "" : "s"}`,
    `${p.vouches} vouch${p.vouches === 1 ? "" : "es"}`,
    `${p.tickets} ticket${p.tickets === 1 ? "" : "s"}`,
    p.miles ? `${p.miles} mi` : null,
    p.open ? "Open" : null,
  ].filter(Boolean);
  return (
    <p className="text-sm text-ink">
      {bits.join(" · ")}
    </p>
  );
}

export function NeedOffer({ person }: { person: Person }) {
  const offers = person.offers?.filter(Boolean) ?? [];
  const needs = person.needs?.filter(Boolean) ?? [];
  if (!offers.length && !needs.length) return null;
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {offers.length ? (
        <p className="text-sm">
          <span className="text-[11px] font-medium tracking-[0.16em] text-muted-foreground uppercase">I offer</span>
          <span className="mt-0.5 block">{offers.join(" · ")}</span>
        </p>
      ) : null}
      {needs.length ? (
        <p className="text-sm">
          <span className="text-[11px] font-medium tracking-[0.16em] text-muted-foreground uppercase">I need</span>
          <span className="mt-0.5 block">{needs.join(" · ")}</span>
        </p>
      ) : null}
    </div>
  );
}
