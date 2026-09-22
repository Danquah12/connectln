import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/library")({ component: LibraryPage });

const LIB: Record<string, { title: string; body: string }[]> = {
  Electrician: [
    { title: "NEC — hospital isolation", body: "Article 517 is not a vibe. Isolated power, redundant paths, and no heroics on live gear." },
    { title: "Safety", body: "NFPA 70E before you open a panel. If the shop skips LOTO, leave." },
    { title: "Licensing", body: "Hours, classroom, exam. The card is the ticket, not the resume." },
    { title: "Apprenticeship", body: "A j-man who hides the good work is not a teacher. Count hours anyway." },
  ],
  Nurse: [
    { title: "Compact license", body: "The compact is a ticket. Housing and rate are separate sentences." },
    { title: "Handoff", body: "If it is not in the chart, it did not happen. Night shift knows this." },
  ],
  Teacher: [
    { title: "Certificate vs brand", body: "State cert and endorsement. The school name is optional." },
  ],
  HVAC: [
    { title: "Start-up", body: "If you set the box, you should be there when it fires." },
  ],
};

function LibraryPage() {
  const trades = Object.keys(LIB);
  const [trade, setTrade] = useState(trades[0]!);
  return (
    <div className="flex flex-col gap-4">
      <header>
        <h1 className="font-display text-4xl tracking-wide">Career library</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Code, safety, tickets, paths. Written like a shop, not a brochure.
        </p>
      </header>
      <div className="flex gap-1.5 overflow-x-auto">
        {trades.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTrade(t)}
            className={
              trade === t
                ? "h-9 shrink-0 rounded-full bg-ink px-3 text-sm text-cream"
                : "h-9 shrink-0 rounded-full bg-cream px-3 text-sm text-muted-foreground"
            }
          >
            {t}
          </button>
        ))}
      </div>
      <ul className="flex flex-col gap-3">
        {LIB[trade]?.map((a) => (
          <li key={a.title} className="rounded-xl bg-cream p-4 shadow-[var(--shadow-border)]">
            <p className="font-medium">{a.title}</p>
            <p className="mt-1 text-sm text-muted-foreground">{a.body}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
