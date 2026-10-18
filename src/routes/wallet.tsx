import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { TicketPlate } from "@/components/ticket-plate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { boardFor, boardResultLabel } from "@/lib/boards";
import { deskForTicket } from "@/lib/verify-protocol";
import { ticketNeedsRefresh, ticketStatus, ticketStatusLabel } from "@/lib/format";
import { personById, useForge } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/wallet")({ component: WalletPage });

function WalletPage() {
  const people = useForge((s) => s.people);
  const youId = useForge((s) => s.youId);
  const attachTicketDoc = useForge((s) => s.attachTicketDoc);
  const addTicket = useForge((s) => s.addTicket);
  const checkTicketFromBoard = useForge((s) => s.checkTicketFromBoard);
  const you = personById(people, youId);
  const ticketSeats = useForge((s) => s.ticketSeats);
  const checked = ticketSeats.includes(youId);
  const [checking, setChecking] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [issuer, setIssuer] = useState("");
  const [number, setNumber] = useState("");
  const [issued, setIssued] = useState("");
  const [expires, setExpires] = useState("");
  const [trainer, setTrainer] = useState("");
  const [ato, setAto] = useState("");

  if (!you) return null;

  const oshaDraft = /osha/i.test(name);

  const rows = [...you.tickets].sort((a, b) => {
    const da = a.expires ? new Date(a.expires).getTime() : Infinity;
    const db = b.expires ? new Date(b.expires).getTime() : Infinity;
    return da - db;
  });
  const soon = rows.filter((t) => ticketStatus(t) === "soon");
  const lapsed = rows.filter((t) => ticketStatus(t) === "lapsed");
  const stale = rows.filter((t) => ticketStatus(t) === "stale");
  const pending = rows.filter((t) => t.verify === "pending");
  const unverified = rows.filter((t) => (t.verify ?? "verified") === "unverified");
  const verified = rows.filter((t) => (t.verify ?? "verified") === "verified");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || (!issuer.trim() && !oshaDraft)) {
      toast("Name and issuer are the ticket.");
      return;
    }
    addTicket({
      name: name.trim(),
      issuer: issuer.trim() || (oshaDraft ? "OSHA Outreach" : ""),
      number: number.trim() || undefined,
      issued: issued || undefined,
      expires: oshaDraft ? undefined : expires || undefined,
      verify: "unverified",
      osha: oshaDraft
        ? {
            kind: "student",
            hours: /\b30\b/.test(name) ? 30 : 10,
            industry: "construction",
            completed: issued || undefined,
            trainer: trainer.trim() || undefined,
            ato: ato.trim() || undefined,
          }
        : undefined,
    });
    toast(
      oshaDraft
        ? "On the wallet. Photo of the card and the trainer's name so the desk can run Outreach."
        : "On the wallet. Upload the paper so the desk can verify it.",
    );
    setName("");
    setIssuer("");
    setNumber("");
    setIssued("");
    setExpires("");
    setTrainer("");
    setAto("");
    setOpen(false);
  }

  return (
    <div className="flex flex-col gap-4">
      <header>
        <h1 className="font-display text-4xl tracking-wide">License desk</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          A license number is a claim until the issuing board says it is theirs.
          Colorado trades: DORA. Compact nursing: Nursys. OSHA 10/30: the trainer and the OTI
          Education Center — there is no OSHA student database.
        </p>
        <Link to="/verify" className="mt-2 inline-block text-sm text-brick hover:underline">
          DORA / Nursys / OSHA protocol
        </Link>
      </header>

      {!checked ? (
        <section className="rounded-xl bg-ink px-5 py-4 text-cream">
          <p className="text-[11px] tracking-wide text-cream/55 uppercase">Ticket check · $12 / year</p>
          <p className="mt-1 font-display text-2xl tracking-wide">Not on this card yet</p>
          <p className="mt-1 text-sm text-cream/70">
            You can still raise a hand. A shop cannot hire you on an unverified required ticket. Pay it, or they cover it.
          </p>
          <Link to="/packages" className="mt-3 inline-block text-sm text-cream underline">
            Ask the desk
          </Link>
        </section>
      ) : null}

      <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat label="Verified" value={verified.length} />
        <Stat label="Pending" value={pending.length} warn={pending.length > 0} />
        <Stat label="Unverified" value={unverified.length} warn={unverified.length > 0} />
        <Stat label="60-day / stale" value={soon.length + lapsed.length + stale.length} warn={soon.length + lapsed.length + stale.length > 0} />
      </dl>

      {lapsed.length + soon.length + stale.length > 0 ? (
        <section className="rounded-xl bg-ink px-5 py-4 text-cream">
          <p className="text-[11px] tracking-wide text-cream/55 uppercase">Reminder</p>
          <p className="mt-1 font-display text-2xl tracking-wide">
            {lapsed.length ? `${lapsed.length} lapsed` : null}
            {lapsed.length && (soon.length || stale.length) ? " · " : null}
            {soon.length ? `${soon.length} inside 60 days` : null}
            {(lapsed.length || soon.length) && stale.length ? " · " : null}
            {stale.length ? `${stale.length} OSHA stale for shop recency` : null}
          </p>
          <p className="mt-1 text-sm text-cream/70">
            Lapsed licenses fail the next call. OSHA student cards do not expire — stale means older
            than the shop's five-year rule. Still on the passport.
          </p>
          <ul className="mt-2 space-y-1 text-sm text-cream/80">
            {[...lapsed, ...soon, ...stale].map((t) => (
              <li key={t.id}>
                {t.name} · {ticketStatusLabel(t)}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <ul className="flex flex-col gap-2">
        {rows.map((t) => {
          const s = ticketStatus(t);
          const needs = ticketNeedsRefresh(t);
          return (
            <li
              key={t.id}
              className="flex flex-wrap items-start gap-3 rounded-2xl bg-white p-4 shadow-[0_1px_2px_rgba(26,24,20,0.04),0_0_0_1px_rgba(26,24,20,0.06)]"
            >
              <TicketPlate ticket={t} />
              <div className="min-w-0 flex-1">
                <p
                  className={cn(
                    "text-sm font-medium",
                    s === "lapsed" && "text-brick",
                    s === "soon" && "text-warn",
                  )}
                >
                  {t.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t.issuer}
                  {t.number ? ` · ${t.number}` : ""}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t.issued ? `Issued ${t.issued.slice(0, 7)} · ` : ""}
                  {ticketStatusLabel(t)}
                </p>
                <p className="mt-1 text-xs">
                  <span
                    className={cn(
                      "font-medium uppercase tracking-wide",
                      (t.verify ?? "verified") === "verified" && "text-ok",
                      t.verify === "pending" && "text-warn",
                      t.verify === "unverified" && "text-muted-foreground",
                    )}
                  >
                    {t.verify ?? "verified"}
                  </span>
                  {t.source ? ` · ${boardResultLabel(t.source.result)}` : ""}
                  {t.document ? ` · ${t.document}` : needs && !t.document ? " · upload the paper" : ""}
                </p>
              </div>
              <div className="flex flex-col items-end gap-2">
                {deskForTicket(t) ? (
                  <Link
                    to="/verify"
                    search={{
                      desk: deskForTicket(t),
                      number: t.number,
                      last: you.name.split(" ").at(-1),
                      ticket: t.id,
                      person: you.id,
                    }}
                    className="text-xs font-medium text-brick"
                  >
                    {deskForTicket(t) === "nursys" ? "Nursys protocol" : "DORA protocol"}
                  </Link>
                ) : null}
                <button
                  type="button"
                  className="text-xs font-medium text-brick disabled:opacity-50"
                  disabled={checking === t.id}
                  onClick={() => {
                    setChecking(t.id);
                    window.setTimeout(() => {
                      const hit = checkTicketFromBoard(you.id, t.id);
                      setChecking(null);
                      if (!hit) return;
                      if (hit.result === "match") toast(`${t.name} — on ${hit.board}.`);
                      else if (hit.result === "no-record") toast(`${t.name} — the board has no record.`);
                      else if (hit.result === "needs-number") toast("The board needs a credential number.");
                      else toast("No public roll. Upload the paper for the desk.");
                    }, 480);
                  }}
                >
                  {checking === t.id ? "Checking…" : "Check the board"}
                </button>
                {boardFor(t)?.url ? (
                  <a
                    href={boardFor(t)!.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-muted-foreground hover:text-ink"
                  >
                    Open {boardFor(t)!.name}
                  </a>
                ) : null}
                <label className="cursor-pointer text-xs font-medium text-brick">
                  Upload
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    className="sr-only"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      attachTicketDoc(t.id, file.name);
                      toast(`${t.name} queued for the desk.`);
                      e.target.value = "";
                    }}
                  />
                </label>
              </div>
            </li>
          );
        })}
      </ul>

      {open ? (
        <form onSubmit={submit} className="rounded-2xl bg-white p-4 shadow-[0_1px_2px_rgba(26,24,20,0.04),0_0_0_1px_rgba(26,24,20,0.06)]">
          <h2 className="font-display text-2xl tracking-wide">Add a ticket</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <Label htmlFor="t-name">What it is</Label>
              <Input id="t-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Journeyman Electrician" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="t-issuer">Issuing board</Label>
              <Input id="t-issuer" value={issuer} onChange={(e) => setIssuer(e.target.value)} placeholder="State of Colorado" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="t-number">Credential number</Label>
              <Input id="t-number" value={number} onChange={(e) => setNumber(e.target.value)} placeholder="JE-441902" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="t-issued">{oshaDraft ? "Completed" : "Issued"}</Label>
              <Input id="t-issued" type="date" value={issued} onChange={(e) => setIssued(e.target.value)} />
            </div>
            {oshaDraft ? (
              <>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="t-trainer">Authorized trainer</Label>
                  <Input id="t-trainer" value={trainer} onChange={(e) => setTrainer(e.target.value)} placeholder="Who issued the card" />
                </div>
                <div className="flex flex-col gap-1.5 sm:col-span-2">
                  <Label htmlFor="t-ato">OTI Education Center / ATO</Label>
                  <Input id="t-ato" value={ato} onChange={(e) => setAto(e.target.value)} placeholder="On the back of a plastic card" />
                </div>
                <p className="sm:col-span-2 text-xs text-muted-foreground">
                  Student cards do not expire. Do not invent an expiry. Shop recency is five years from completion.
                </p>
              </>
            ) : (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="t-exp">Expires</Label>
                <Input id="t-exp" type="date" value={expires} onChange={(e) => setExpires(e.target.value)} />
              </div>
            )}
          </div>
          <div className="mt-4 flex gap-2">
            <Button type="submit">Put it on the wallet</Button>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
          </div>
        </form>
      ) : (
        <Button type="button" variant="outline" onClick={() => setOpen(true)}>
          Add a ticket
        </Button>
      )}

      <p className="text-sm text-muted-foreground">
        Public face of this wallet:{" "}
        <Link to="/p/$id" params={{ id: you.id }} className="text-brick hover:underline">
          your card
        </Link>
        . Check the board first. The desk still reads the scan when there is no public roll.
      </p>
    </div>
  );
}

function Stat({ label, value, warn }: { label: string; value: number; warn?: boolean }) {
  return (
    <div className="rounded-2xl bg-white px-3 py-3 shadow-[0_1px_2px_rgba(26,24,20,0.04),0_0_0_1px_rgba(26,24,20,0.06)]">
      <p className="text-[11px] tracking-wide text-muted-foreground uppercase">{label}</p>
      <p className={cn("font-display text-3xl tabular-nums", warn && "text-brick")}>{value}</p>
    </div>
  );
}
