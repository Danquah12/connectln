import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { CrmPanel } from "@/components/crm-panel";
import { MailCompose } from "@/components/mail-compose";
import { VoiceNote } from "@/components/voice-note";
import { Button } from "@/components/ui/button";
import { hallContact } from "@/lib/contact";
import { availabilityLabel } from "@/lib/format";
import { useForge } from "@/lib/store";
import type { Person } from "@/lib/types";

export function ContactDesk({
  person,
  onJobAsk,
}: {
  person: Person;
  onJobAsk: (body: string) => void;
}) {
  const c = hallContact(person);
  const youId = useForge((s) => s.youId);
  const openLine = useForge((s) => s.openLine);
  const mine = person.id === youId;

  function copy(label: string, value: string) {
    void navigator.clipboard.writeText(value).then(
      () => toast(`Copied ${label}.`),
      () => toast(value),
    );
  }

  return (
    <div className="flex flex-col gap-4">
    <section className="rounded-xl bg-cream p-4 shadow-[var(--shadow-border)] sm:p-5">
      <h2 className="font-display text-2xl tracking-wide">The line</h2>
      <p className="text-xs text-muted-foreground">
        Call, room, voice, hall mail — on this hall. {c.shopHours}
      </p>
      <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-[11px] tracking-wide text-muted-foreground uppercase">Phone</dt>
          <dd className="font-medium tabular-nums">{c.phone}</dd>
        </div>
        <div>
          <dt className="text-[11px] tracking-wide text-muted-foreground uppercase">Hall mail</dt>
          <dd className="truncate font-medium">{c.email}</dd>
        </div>
        <div>
          <dt className="text-[11px] tracking-wide text-muted-foreground uppercase">Best window</dt>
          <dd>{c.shopHours}</dd>
        </div>
        <div>
          <dt className="text-[11px] tracking-wide text-muted-foreground uppercase">Start</dt>
          <dd>{c.start}</dd>
        </div>
        {person.rate ? (
          <div>
            <dt className="text-[11px] tracking-wide text-muted-foreground uppercase">Rate on the card</dt>
            <dd>{person.rate}</dd>
          </div>
        ) : null}
        <div>
          <dt className="text-[11px] tracking-wide text-muted-foreground uppercase">Travel</dt>
          <dd>{person.travelMiles} miles · {availabilityLabel(person.availability)}</dd>
        </div>
        {person.union ? (
          <div>
            <dt className="text-[11px] tracking-wide text-muted-foreground uppercase">Hall</dt>
            <dd>{person.union}</dd>
          </div>
        ) : null}
        {person.tickets[0] ? (
          <div>
            <dt className="text-[11px] tracking-wide text-muted-foreground uppercase">Ticket</dt>
            <dd>
              {person.tickets[0].name}
              {person.tickets[0].number ? ` · ${person.tickets[0].number}` : ""}
            </dd>
          </div>
        ) : null}
      </dl>
      {!mine ? (
        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="ink" onClick={() => openLine(person.id, "call")}>
            Call on the line
          </Button>
          <Button variant="outline" asChild>
            <Link to="/meet/$id" params={{ id: person.id }}>
              Meet
            </Link>
          </Button>
          <VoiceNote person={person} />
          <MailCompose person={person} compact />
          <Button variant="outline" onClick={() => onJobAsk(c.ask)}>
            Message for a job
          </Button>
          <Button variant="ghost" asChild>
            <a href={`tel:${c.tel}`}>Carrier call</a>
          </Button>
          <Button variant="ghost" onClick={() => copy("number", c.phone)}>
            Copy number
          </Button>
        </div>
      ) : (
        <p className="mt-4 text-sm text-muted-foreground">This is your card. Open someone else to use the line.</p>
      )}
    </section>
    {!mine ? <CrmPanel person={person} /> : null}
    </div>
  );
}
