import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { OSHA_CARD_FACTS, OSHA_FIND_TRAINER, OSHA_VERIFY_CARD } from "@/lib/osha";
import { boardResultLabel } from "@/lib/boards";
import { personById, useForge } from "@/lib/store";
import {
  PROTOCOL,
  deskForTicket,
  reportToSource,
  runProtocol,
  type ProtocolDesk,
  type ProtocolReport,
} from "@/lib/verify-protocol";
import { cn } from "@/lib/utils";

type VerifySearch = {
  desk?: ProtocolDesk;
  number?: string;
  last?: string;
  ticket?: string;
  person?: string;
};

export const Route = createFileRoute("/verify")({
  validateSearch: (raw: Record<string, unknown>): VerifySearch => ({
    ...(raw.desk === "dora" || raw.desk === "nursys" || raw.desk === "osha" ? { desk: raw.desk } : {}),
    ...(typeof raw.number === "string" ? { number: raw.number } : {}),
    ...(typeof raw.last === "string" ? { last: raw.last } : {}),
    ...(typeof raw.ticket === "string" ? { ticket: raw.ticket } : {}),
    ...(typeof raw.person === "string" ? { person: raw.person } : {}),
  }),
  component: VerifyPage,
});

function VerifyPage() {
  const search = Route.useSearch();
  const people = useForge((s) => s.people);
  const youId = useForge((s) => s.youId);
  const checkTicketFromBoard = useForge((s) => s.checkTicketFromBoard);
  const person = personById(people, search.person || youId);
  const ticket = person?.tickets.find((t) => t.id === search.ticket);
  const initialDesk: ProtocolDesk =
    search.desk ?? (ticket ? deskForTicket(ticket) : undefined) ?? "dora";

  const [desk, setDesk] = useState<ProtocolDesk>(initialDesk);
  const [last, setLast] = useState(search.last ?? person?.name.split(" ").at(-1) ?? "");
  const [number, setNumber] = useState(search.number ?? ticket?.number ?? "");
  const [trainer, setTrainer] = useState(ticket?.osha?.trainer ?? "");
  const [ato, setAto] = useState(ticket?.osha?.ato ?? "");
  const [completed, setCompleted] = useState(ticket?.osha?.completed || ticket?.issued || "");
  const [qr, setQr] = useState(Boolean(ticket?.osha?.qr));
  const [busy, setBusy] = useState(false);
  const [report, setReport] = useState<ProtocolReport | null>(null);
  const meta = PROTOCOL[desk];

  const samples = useMemo(
    () =>
      desk === "dora"
        ? [
            { label: "Jordan Hale · electrician", last: "Hale", number: "JE-441902" },
            { label: "Elena Vasquez · broker", last: "Vasquez", number: "EA-441902" },
          ]
        : desk === "nursys"
          ? [
              { label: "Camila Ruiz · compact RN", last: "Ruiz", number: "RN-448201" },
              { label: "Ruth Alvarez · Texas RN", last: "Alvarez", number: "RN-10442" },
            ]
          : [
              { label: "Jordan Hale · OSHA 30", last: "Hale", number: "OTI-30-441902" },
              { label: "Keisha Owens · OSHA 10 stale", last: "Owens", number: "OTI-10-22941" },
            ],
    [desk],
  );

  function run(e?: React.FormEvent) {
    e?.preventDefault();
    setBusy(true);
    window.setTimeout(() => {
      const next = runProtocol({
        desk,
        number,
        last,
        holder: person?.name,
        ticketName: ticket?.name,
        claimsCompact: /compact|nlc|multistate/i.test(`${ticket?.name ?? ""} ${ticket?.issuer ?? ""} ${desk}`),
        completed: completed || ticket?.osha?.completed || ticket?.issued,
        trainer: trainer || ticket?.osha?.trainer,
        trainerId: ticket?.osha?.trainerId,
        ato: ato || ticket?.osha?.ato,
        qr,
        document: Boolean(ticket?.document),
        hours: ticket?.osha?.hours,
        industry: ticket?.osha?.industry,
      });
      setReport(next);
      setBusy(false);
    }, 520);
  }

  function apply() {
    if (!person || !ticket || !report) return;
    const source = checkTicketFromBoard(person.id, ticket.id) ?? reportToSource(report);
    if (source.result === "match") toast("Trainer / ATO confirmed. Marked verified.");
    else if (source.result === "stale") toast("Card is real. Stale for the 5-year shop rule — still on the passport.");
    else if (source.result === "needs-paper") toast("Need a photo, QR, or trainer name.");
    else if (source.result === "unconfirmed") toast("Waiting on the trainer or OTI center. Ticket stays pending.");
    else toast("Not confirmed. Ticket stays unverified.");
  }

  return (
    <div className="flex flex-col gap-4">
      <header>
        <p className="text-[11px] tracking-wide text-muted-foreground uppercase">Board protocol</p>
        <h1 className="font-display text-4xl tracking-wide">DORA, Nursys, OSHA</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          A scan is not the source. Colorado trades: DORA. Compact nursing: Nursys. OSHA 10/30: the
          trainer and the OTI Education Center — OSHA has no national student roll.
        </p>
      </header>

      <div className="flex flex-wrap gap-2">
        {(["dora", "nursys", "osha"] as const).map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => {
              setDesk(id);
              setReport(null);
            }}
            className={cn(
              "rounded-full px-3 py-1.5 text-sm",
              desk === id ? "bg-ink text-cream" : "bg-cream text-muted-foreground",
            )}
          >
            {id === "dora" ? "DORA" : id === "nursys" ? "Nursys" : "OSHA Outreach"}
          </button>
        ))}
      </div>

      <section className="rounded-xl bg-ink px-5 py-4 text-cream">
        <p className="text-[11px] tracking-wide text-cream/55 uppercase">{meta.board}</p>
        <ol className="mt-3 space-y-1.5 text-sm text-cream/85">
          {meta.gates.map((g, i) => (
            <li key={g}>
              <span className="font-mono text-[11px] text-cream/45">{i + 1}.</span> {g}
            </li>
          ))}
        </ol>
        {desk === "nursys" ? (
          <p className="mt-3 text-xs text-cream/60">
            QuickConfirm is free and public. It is not endorsement. Endorsement is a paid
            Nursys request to the receiving board. If a shop uses this to hire, FCRA still applies.
          </p>
        ) : desk === "osha" ? (
          <p className="mt-3 text-xs text-cream/60">
            OSHA does not operate a student database and does not acknowledge lookup websites.
            Plastic cards: QR on the back goes to the OTI Education Center. Paper: the authorized
            trainer keeps the roster five years. Student cards do not expire. Shops still often
            want it within five years — that is a shop rule.
          </p>
        ) : (
          <p className="mt-3 text-xs text-cream/60">
            DORA DPO licenses fifty-plus professions in Colorado. Electrician, plumber, broker —
            this desk. An RN compact license does not belong here.
          </p>
        )}
        <a href={meta.url} target="_blank" rel="noreferrer" className="mt-3 inline-block text-sm text-cream underline">
          {desk === "osha" ? "OSHA: how to verify a student card" : "Open the real lookup"}
        </a>
        {desk === "osha" ? (
          <p className="mt-2 flex flex-wrap gap-3 text-xs">
            <a href={OSHA_FIND_TRAINER} target="_blank" rel="noreferrer" className="text-cream underline">
              Find a Trainer
            </a>
            <a href={OSHA_CARD_FACTS} target="_blank" rel="noreferrer" className="text-cream underline">
              Card facts / fraud
            </a>
            <a href={OSHA_VERIFY_CARD} target="_blank" rel="noreferrer" className="text-cream underline">
              Verify a card
            </a>
          </p>
        ) : null}
      </section>

      <form onSubmit={run} className="rounded-xl bg-cream p-4 shadow-[var(--shadow-border)]">
        <h2 className="font-display text-2xl tracking-wide">Run it</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="last">Last name on the card</Label>
            <Input id="last" value={last} onChange={(e) => setLast(e.target.value)} placeholder="Hale" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="num">{desk === "osha" ? "Card number if printed" : "License number"}</Label>
            <Input id="num" value={number} onChange={(e) => setNumber(e.target.value)} placeholder={desk === "osha" ? "OTI-30-441902" : "JE-441902"} />
          </div>
        </div>
        {desk === "osha" ? (
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="completed">Completion date</Label>
              <Input id="completed" value={completed} onChange={(e) => setCompleted(e.target.value)} placeholder="2021-11-02" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="trainer">Authorized trainer</Label>
              <Input id="trainer" value={trainer} onChange={(e) => setTrainer(e.target.value)} placeholder="Ray Delgado" />
            </div>
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <Label htmlFor="ato">OTI Education Center / ATO</Label>
              <Input id="ato" value={ato} onChange={(e) => setAto(e.target.value)} placeholder="Rocky Mountain OTI Education Center" />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={qr} onChange={(e) => setQr(e.target.checked)} />
              Plastic card · QR on the back
            </label>
          </div>
        ) : null}
        <div className="mt-3 flex flex-wrap gap-2">
          {samples.map((s) => (
            <button
              key={s.number}
              type="button"
              className="rounded-full bg-canvas px-3 py-1 text-xs text-muted-foreground hover:text-ink"
              onClick={() => {
                setLast(s.last);
                setNumber(s.number);
                if (desk === "osha" && s.number === "OTI-30-441902") {
                  setTrainer("Ray Delgado");
                  setAto("Rocky Mountain OTI Education Center");
                  setCompleted("2021-11-02");
                  setQr(true);
                }
                if (desk === "osha" && s.number === "OTI-10-22941") {
                  setTrainer("Ray Delgado");
                  setAto("Rocky Mountain OTI Education Center");
                  setCompleted("2020-03-01");
                  setQr(false);
                }
              }}
            >
              {s.label}
            </button>
          ))}
        </div>
        <div className="mt-4 flex gap-2">
          <Button type="submit" disabled={busy}>
            {busy ? "Running…" : desk === "osha" ? "Run Outreach protocol" : "Check the board"}
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link to="/wallet">License desk</Link>
          </Button>
        </div>
      </form>

      {report ? (
        <section className="rounded-xl bg-cream p-4 shadow-[var(--shadow-border)]">
          <p className="text-[11px] tracking-wide text-muted-foreground uppercase">
            {report.desk === "osha"
              ? "OSHA Outreach report · not a license lookup"
              : report.desk === "nursys"
                ? "QuickConfirm report"
                : "DPO license details"}
          </p>
          <p
            className={cn(
              "font-display text-3xl tracking-wide",
              report.result === "match" || report.result === "stale" ? "text-ok" : "text-brick",
            )}
          >
            {boardResultLabel(report.result)}
          </p>
          <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
            <Row k="Name" v={report.holder} />
            <Row k="Number" v={report.number} />
            <Row k="Type" v={report.licenseType} />
            <Row k="Jurisdiction" v={report.jurisdiction} />
            <Row k="Active" v={report.status} />
            {report.compact ? <Row k="Compact" v={report.compact} /> : null}
            {report.issued ? <Row k="Issued" v={report.issued} /> : null}
            {report.expires ? <Row k="Expires" v={report.expires} /> : null}
            <Row k="Discipline" v={report.discipline ? "Yes" : "None"} />
            {report.city ? <Row k="City" v={report.city} /> : null}
          </dl>
          <ul className="mt-4 space-y-1.5">
            {report.steps.map((s) => (
              <li key={s.id} className="flex items-start gap-2 text-sm">
                <span className={cn("font-mono text-xs", s.pass ? "text-ok" : "text-brick")}>
                  {s.pass ? "PASS" : "FAIL"}
                </span>
                <span className={s.pass ? "text-ink" : "text-muted-foreground"}>{s.label}</span>
              </li>
            ))}
          </ul>
          {person && ticket ? (
            <Button type="button" className="mt-4" variant={report.result === "match" || report.result === "stale" ? "ink" : "outline"} onClick={apply}>
              Write this on the ticket
            </Button>
          ) : (
            <p className="mt-4 text-xs text-muted-foreground">
              Sign in to write the result on a wallet ticket.
            </p>
          )}
        </section>
      ) : null}
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <dt className="text-[11px] tracking-wide text-muted-foreground uppercase">{k}</dt>
      <dd className="font-medium">{v}</dd>
    </div>
  );
}
