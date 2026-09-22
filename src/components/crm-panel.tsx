import { useState } from "react";
import { toast } from "sonner";
import { LoopStrip } from "@/components/loop-strip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DEAL_STAGES, isDealTrade, runLineAi, type DealStage } from "@/lib/crm";
import { personById, useForge } from "@/lib/store";
import type { Person } from "@/lib/types";
import { cn } from "@/lib/utils";

export function CrmPanel({ person }: { person: Person }) {
  const youId = useForge((s) => s.youId);
  const people = useForge((s) => s.people);
  const you = personById(people, youId);
  const lineSessions = useForge((s) => s.lineSessions);
  const crmActions = useForge((s) => s.crmActions);
  const sessions = lineSessions.filter((x) => x.withId === person.id);
  const actions = crmActions.filter((x) => x.personId === person.id);
  const deals = useForge((s) => s.dealNotes);
  const deal = deals.find((d) => d.personId === person.id);
  const toggle = useForge((s) => s.toggleCrmAction);
  const sendMail = useForge((s) => s.sendMail);
  const saveDeal = useForge((s) => s.saveDeal);
  const latest = sessions[0];
  const homes = isDealTrade(person.trade);

  const [address, setAddress] = useState(deal?.address ?? `${person.city}, ${person.state}`);
  const [stage, setStage] = useState<DealStage>(deal?.stage ?? "lead");
  const [next, setNext] = useState(deal?.next ?? "");
  const [notes, setNotes] = useState(deal?.notes ?? "");

  if (!you) return null;

  return (
    <section className="rounded-xl bg-cream p-4 shadow-[var(--shadow-border)] sm:p-5">
      <h2 className="font-display text-2xl tracking-wide">On this card</h2>
      <p className="text-xs text-muted-foreground">
        Summary, actions, follow-up. Desk AI from the line, the room, or a voice note — not a mystery model.
      </p>

      {latest ? (
        <div className="mt-3 rounded-lg bg-canvas p-3">
          <p className="text-[11px] tracking-wide text-muted-foreground uppercase">
            Last {latest.kind} · smart summary
          </p>
          <p className="mt-1 text-sm leading-relaxed">{latest.summary}</p>
          <p className="mt-2 text-xs text-muted-foreground">{latest.transcript}</p>
          {latest.audio ? (
            <audio className="mt-2 w-full" controls src={latest.audio} preload="none" />
          ) : null}
        </div>
      ) : (
        <p className="mt-3 text-sm text-muted-foreground">No line yet. Call, meet, or leave a voice note.</p>
      )}

      <LoopStrip person={person} session={latest} />

      {actions.length ? (
        <ul className="mt-3 space-y-1.5">
          {actions.slice(0, 6).map((a) => (
            <li key={a.id}>
              <button
                type="button"
                onClick={() => toggle(a.id)}
                className={cn("text-left text-sm", a.done && "text-muted-foreground line-through")}
              >
                {a.done ? "✓" : "☐"} {a.title}
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {homes ? (
        <form
          className="mt-4 flex flex-col gap-2 border-t border-border pt-4"
          onSubmit={(e) => {
            e.preventDefault();
            const ai = runLineAi({
              you,
              them: person,
              kind: "call",
              transcript: notes,
            }).dealNote;
            saveDeal({
              id: deal?.id,
              personId: person.id,
              address: address.trim() || `${person.city}, ${person.state}`,
              stage,
              next: next.trim(),
              notes: notes.trim(),
              ai,
            });
            toast("Deal note on the card.");
          }}
        >
          <p className="font-display text-xl tracking-wide">Deal notes</p>
          <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Address" />
          <div className="flex flex-wrap gap-1">
            {DEAL_STAGES.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setStage(s.id)}
                className={cn(
                  "h-8 rounded-full px-2.5 text-xs",
                  stage === s.id ? "bg-ink text-cream" : "bg-canvas text-muted-foreground",
                )}
              >
                {s.label}
              </button>
            ))}
          </div>
          <Input value={next} onChange={(e) => setNext(e.target.value)} placeholder="Next step" />
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="What happened" />
          <div className="flex flex-wrap gap-2">
            <Button type="submit" size="sm" variant="ink">
              Save deal note
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => {
                const ai = runLineAi({ you, them: person, kind: "call", transcript: notes }).dealNote;
                saveDeal({
                  id: deal?.id,
                  personId: person.id,
                  address: address.trim() || `${person.city}, ${person.state}`,
                  stage,
                  next: next.trim() || "Showing",
                  notes: notes.trim(),
                  ai,
                });
                toast("Deal notes AI wrote the next line.");
              }}
            >
              Deal notes AI
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => {
                const follow = runLineAi({ you, them: person, kind: "call", transcript: notes || deal?.ai || "" });
                sendMail(person.id, follow.followSubject, follow.followBody);
                toast("Follow-up AI sent on hall mail.");
              }}
            >
              Follow-up AI
            </Button>
          </div>
          {deal?.ai ? <p className="text-xs text-muted-foreground">{deal.ai}</p> : null}
        </form>
      ) : null}
    </section>
  );
}
