import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { rankLabel, yearsLabel } from "@/lib/format";
import { personById, useForge } from "@/lib/store";

export const Route = createFileRoute("/resume")({ component: ResumePage });

function ResumePage() {
  const people = useForge((s) => s.people);
  const you = personById(people, useForge((s) => s.youId));
  const vouches = useForge((s) => s.vouches).filter((v) => v.toId === you?.id);
  const updateYou = useForge((s) => s.updateYou);
  const [paste, setPaste] = useState("");
  if (!you) return null;

  return (
    <div className="flex flex-col gap-4">
      <header>
        <h1 className="font-display text-4xl tracking-wide">Resume in, resume out</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Paste a resume, verify what it claimed. Or print the card as a resume. Nothing unverified
          walks off this page.
        </p>
      </header>
      <section className="rounded-xl bg-cream p-4 shadow-[var(--shadow-border)]">
        <h2 className="font-display text-2xl tracking-wide">Import</h2>
        <Textarea
          className="mt-2 min-h-28"
          value={paste}
          onChange={(e) => setPaste(e.target.value)}
          placeholder="Journeyman electrician, OSHA 30, Denver…"
        />
        <Button
          className="mt-3"
          disabled={!paste.trim()}
          onClick={() => {
            const low = paste.toLowerCase();
            const specialties = you.specialties.slice();
            if (low.includes("hospital") && !specialties.includes("Hospital")) specialties.push("Hospital");
            updateYou({ bio: paste.trim().slice(0, 280), specialties });
            toast("Extracted. Check tickets on the wallet — nothing is verified until you say so.");
          }}
        >
          Extract and wait for verify
        </Button>
      </section>
      <section className="rounded-xl bg-cream p-5 shadow-[var(--shadow-border)] print:shadow-none">
        <h2 className="font-display text-3xl tracking-wide">{you.name}</h2>
        <p className="text-sm">
          {rankLabel(you.level, you.trade)} · {you.city}, {you.state} · {yearsLabel(you)}
        </p>
        <p className="mt-3 text-sm">{you.bio}</p>
        <h3 className="mt-4 text-xs tracking-wide text-muted-foreground uppercase">Tickets</h3>
        <ul className="mt-1 text-sm">
          {you.tickets.map((t) => (
            <li key={t.id}>
              {t.name} · {t.issuer}
              {t.number ? ` · ${t.number}` : ""} {t.verify === "verified" ? "✓" : ""}
            </li>
          ))}
        </ul>
        <h3 className="mt-4 text-xs tracking-wide text-muted-foreground uppercase">Work</h3>
        <ul className="mt-1 text-sm">
          {you.history.map((h) => (
            <li key={h.id}>
              {h.name} · {h.role} · {h.when}
              {h.verified ? " · verified" : ""}
            </li>
          ))}
        </ul>
        <h3 className="mt-4 text-xs tracking-wide text-muted-foreground uppercase">Vouches</h3>
        <ul className="mt-1 text-sm">
          {vouches.map((v) => (
            <li key={v.id}>
              {v.site} — {v.body.slice(0, 120)}
            </li>
          ))}
        </ul>
        <Button className="mt-4 print:hidden" variant="outline" onClick={() => window.print()}>
          Print / save PDF
        </Button>
      </section>
    </div>
  );
}
