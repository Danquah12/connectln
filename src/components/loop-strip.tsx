import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DEAL_STAGES, type LineSession } from "@/lib/crm";
import { nextBoardMoves, type BoardMove } from "@/lib/loop";
import { personById, useForge } from "@/lib/store";
import type { Person } from "@/lib/types";

export function LoopStrip({
  person,
  session,
}: {
  person: Person;
  session?: LineSession;
}) {
  const youId = useForge((s) => s.youId);
  const you = personById(useForge((s) => s.people), youId);
  const calls = useForge((s) => s.calls);
  const vouches = useForge((s) => s.vouches);
  const shopSeats = useForge((s) => s.shopSeats);
  const appliedCallIds = useForge((s) => s.appliedCallIds);
  const callHires = useForge((s) => s.callHires);
  const dealNotes = useForge((s) => s.dealNotes);
  const deal = dealNotes.find((d) => d.personId === person.id);
  const applyToCall = useForge((s) => s.applyToCall);
  const hireOnCall = useForge((s) => s.hireOnCall);
  const coverTicket = useForge((s) => s.coverTicket);
  const sendMail = useForge((s) => s.sendMail);
  const saveDeal = useForge((s) => s.saveDeal);
  const addVouch = useForge((s) => s.addVouch);

  if (!you || you.id === person.id) return null;
  const moves = nextBoardMoves({
    you,
    them: person,
    calls,
    vouches,
    shopSeats,
    appliedCallIds,
    callHires,
    deal,
    session,
  });
  if (!moves.length) return null;

  function run(move: BoardMove) {
    if (move.id === "hand" && move.callId) {
      applyToCall(move.callId);
      toast("Hand raised. On the call.");
      return;
    }
    if (move.id === "hire" && move.callId) {
      coverTicket(person.id);
      hireOnCall(move.callId, person.id);
      toast("On the crew. Ticket check covered if it was in the way.");
      return;
    }
    if (move.id === "vouch" && move.callId) {
      const call = calls.find((c) => c.id === move.callId);
      addVouch(
        person.id,
        `On ${call?.title ?? "the job"}. Showed up with the tickets. I'd take them again.`,
        call?.title ?? "The job",
        ["quality", "reliability"],
      );
      toast("Vouch is on their card.");
      return;
    }
    if (move.id === "deal" && move.nextStage) {
      saveDeal({
        id: deal?.id,
        personId: person.id,
        address: deal?.address ?? `${person.city}, ${person.state}`,
        stage: move.nextStage,
        next: DEAL_STAGES.find((s) => s.id === move.nextStage)?.label ?? move.nextStage,
        notes: deal?.notes ?? session?.summary ?? "",
        ai: deal?.ai ?? session?.summary,
      });
      toast(`Deal → ${DEAL_STAGES.find((s) => s.id === move.nextStage)?.label}.`);
      return;
    }
    if (move.id === "follow" && session) {
      sendMail(person.id, session.followSubject, session.followBody);
      toast("Follow-up on hall mail.");
    }
  }

  return (
    <div className="mt-3 rounded-lg bg-ink p-3 text-cream">
      <p className="text-[11px] tracking-wide text-cream/50 uppercase">Hang-up → the board</p>
      <p className="mt-1 text-xs text-cream/70">One move. The line is not a notepad.</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {moves.map((m) => (
          <Button
            key={m.id + (m.callId ?? "") + (m.nextStage ?? "")}
            size="sm"
            variant={m.id === "hire" || m.id === "hand" ? "cream" : "outline"}
            onClick={() => run(m)}
          >
            {m.label}
          </Button>
        ))}
      </div>
      <ul className="mt-2 space-y-0.5 text-[11px] text-cream/55">
        {moves.map((m) => (
          <li key={`w-${m.id}-${m.callId ?? m.nextStage ?? "f"}`}>{m.why}</li>
        ))}
      </ul>
    </div>
  );
}
