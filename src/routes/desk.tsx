import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, Navigate, useSearch } from "@tanstack/react-router";
import { toast } from "sonner";
import { Portrait } from "@/components/portrait";
import { YoutubeStage } from "@/components/youtube-stage";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import {
  health,
  seedReports,
  type ReportRisk,
} from "@/lib/command-seed";
import { listManagedUsers, setManagedStatus, stampMember, type ManagedUser } from "@/lib/accounts";
import { seedLectures } from "@/lib/lecture-seed";
import { listings as seedListings } from "@/lib/market-seed";
import { PACKS } from "@/lib/packages";
import { TAKE } from "@/lib/money";
import { importMhccCsv, loadMhccBook } from "@/lib/mhcc-book";
import { MHCC_CSV_HINT } from "@/lib/mhcc";
import { crewWatch, nextCallFails } from "@/lib/crew-watch";
import { DEAL_STAGES } from "@/lib/crm";
import { hallAddress } from "@/lib/mail";
import { dispatchSmtp } from "@/lib/mail-dispatch";
import { smtpReady, RELAYS, normalizeSmtp, type SmtpTls } from "@/lib/smtp";
import { lessons } from "@/lib/board-seed";
import { boardResultLabel } from "@/lib/boards";
import { deskForTicket } from "@/lib/verify-protocol";
import { clearanceLabel, rankLabel, relTime, ticketStatus, ticketStatusLabel } from "@/lib/format";
import { personById, useForge } from "@/lib/store";
import { CLIP_PULL_MS, clipDayLabel, clipDayLedger, clipState, talkBelt } from "@/lib/clip-ingest";
import { TRADES } from "@/lib/seed";
import { youtubeThumb } from "@/lib/youtube";
import type { Trade } from "@/lib/types";
import { cn } from "@/lib/utils";
import { deskSearch } from "@/lib/command";

export const Route = createFileRoute("/desk")({
  validateSearch: deskSearch,
  component: function DeskRedirect() {
    const search = Route.useSearch();
    return <Navigate to="/admin" search={search} />;
  },
});

const BAYS = [
  { id: "morning", label: "Morning" },
  { id: "clips", label: "Synced" },
  { id: "seats", label: "Seats" },
  { id: "queue", label: "Queue" },
  { id: "tickets", label: "Tickets" },
  { id: "market", label: "Market" },
  { id: "calls", label: "Calls" },
  { id: "contracts", label: "Contracts" },
  { id: "learn", label: "Learn" },
  { id: "packages", label: "Packages" },
  { id: "mail", label: "Mail" },
  { id: "smtp", label: "SMTP" },
  { id: "pay", label: "Ledger" },
  { id: "security", label: "Security" },
  { id: "flags", label: "Flags" },
  { id: "audit", label: "Audit" },
  { id: "clips", label: "Synced" },
  { id: "health", label: "Health" },
  { id: "mhcc", label: "Maryland" },
] as const;

export function DeskPage() {
  const { user, isPending } = useCurrentUserState();
  const search = useSearch({ strict: false }) as { bay?: string };
  const bay: (typeof BAYS)[number]["id"] = BAYS.some((b) => b.id === search.bay)
    ? (search.bay as (typeof BAYS)[number]["id"])
    : "morning";

  if (isPending) return <div className="h-64 animate-pulse rounded-xl bg-cream" />;
  if (!user) return <Navigate to="/admin/login" />;

  return (
    <div className="flex flex-col gap-4">
      {bay === "morning" ? <Morning /> : null}
      {bay === "seats" ? <Seats /> : null}
      {bay === "queue" ? <Queue /> : null}
      {bay === "tickets" ? <TicketsBay /> : null}
      {bay === "market" ? <MarketBay /> : null}
      {bay === "calls" ? <CallsBay /> : null}
      {bay === "contracts" ? <ContractsBay /> : null}
      {bay === "learn" ? <LearnBay /> : null}
      {bay === "packages" ? <PackagesBay /> : null}
      {bay === "mail" ? <MailBay /> : null}
      {bay === "smtp" ? <SmtpBay /> : null}
      {bay === "pay" ? <LedgerBay /> : null}
      {bay === "security" ? <SecurityBay /> : null}
      {bay === "flags" ? <FlagsBay /> : null}
      {bay === "audit" ? <AuditBay /> : null}
      {bay === "clips" ? <ClipsBay /> : null}
      {bay === "health" ? <HealthBay /> : null}
      {bay === "mhcc" ? <MhccBay /> : null}
    </div>
  );
}

function Morning() {
  const people = useForge((s) => s.people);
  const youId = useForge((s) => s.youId);
  const calls = useForge((s) => s.calls);
  const callHands = useForge((s) => s.callHands);
  const callHires = useForge((s) => s.callHires);
  const mail = useForge((s) => s.mail);
  const deals = useForge((s) => s.dealNotes);
  const shopSeats = useForge((s) => s.shopSeats);
  const coverTicket = useForge((s) => s.coverTicket);
  const you = people.find((p) => p.id === youId);

  const tickets = people.flatMap((p) =>
    nextCallFails(p).map((t) => ({ person: p, ticket: t, life: ticketStatus(t) })),
  );
  const watch = crewWatch({ youId, calls, people, hires: callHires });
  const unread = mail.filter((m) => m.toId === youId && !m.read);
  const stalled = deals.filter((d) => d.stage !== "closed" && d.stage !== "lost");
  const waiting = calls
    .filter((c) => c.postedBy === youId)
    .flatMap((c) => (callHands[c.id] ?? []).map((id) => ({ call: c, person: people.find((p) => p.id === id) })))
    .filter((x) => x.person && !(callHires[x.call.id] ?? []).includes(x.person.id));

  return (
    <div className="flex flex-col gap-4">
      <Link
        to="/admin"
        search={{ bay: "clips" }}
        className="flex items-center justify-between gap-3 rounded-xl bg-ink px-4 py-4 text-cream shadow-[var(--shadow-border)]"
      >
        <div>
          <p className="text-[11px] font-medium tracking-[0.16em] text-cream/50 uppercase">Synced Videos</p>
          <p className="mt-1 font-display text-2xl tracking-wide">Review the pull</p>
          <p className="mt-1 text-sm text-cream/70">Keep, hold, or remove what lands on Shop talk and the wheel.</p>
        </div>
        <span className="shrink-0 rounded-full bg-cream px-3 py-1.5 text-sm font-medium text-ink">Open</span>
      </Link>
      <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat label="Tickets due" value={tickets.length} hint="60 days or lapsed" warn={tickets.length > 0} />
        <Stat label="Unread mail" value={unread.length} hint="Hall letters" warn={unread.length > 0} />
        <Stat label="Deals sitting" value={stalled.length} hint="Not closed" warn={stalled.length > 0} />
        <Stat label="Hands waiting" value={waiting.length} hint="On your calls" warn={waiting.length > 0} />
      </dl>

      <section className="rounded-xl bg-cream p-4 shadow-[var(--shadow-border)]">
        <h2 className="font-display text-2xl tracking-wide">Tickets due</h2>
        <p className="text-xs text-muted-foreground">The next call fails if these aren’t current.</p>
        <ul className="mt-3 space-y-1.5">
          {tickets.slice(0, 8).map(({ person, ticket, life }) => (
            <li key={`${person.id}-${ticket.id}`} className="flex items-center gap-3 rounded-lg bg-canvas px-3 py-2">
              <Portrait person={person} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {person.name} · {ticket.name}
                </p>
                <p className="text-xs text-muted-foreground">{ticketStatusLabel(ticket)}</p>
              </div>
              {shopSeats.includes(youId) && (ticket.verify === "unverified" || ticket.verify === "pending") ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    coverTicket(person.id);
                    toast(`Ticket check on ${person.name}.`);
                  }}
                >
                  Cover $12
                </Button>
              ) : null}
              <Button size="sm" variant="ghost" asChild>
                <Link to="/p/$id" params={{ id: person.id }}>
                  Card
                </Link>
              </Button>
            </li>
          ))}
        </ul>
        {tickets.length === 0 ? <p className="mt-2 text-sm text-muted-foreground">Nothing due. Leave it.</p> : null}
        {watch.length ? (
          <p className="mt-3 text-xs text-muted-foreground">
            Crew watch: {watch.length} ticket{watch.length === 1 ? "" : "s"} on people you hired.
          </p>
        ) : null}
      </section>

      <section className="rounded-xl bg-cream p-4 shadow-[var(--shadow-border)]">
        <h2 className="font-display text-2xl tracking-wide">Unread hall mail</h2>
        <ul className="mt-3 space-y-1.5">
          {unread.slice(0, 6).map((m) => {
            const from = people.find((p) => p.id === m.fromId);
            return (
              <li key={m.id}>
                <Link
                  to="/mail"
                  search={{ to: m.fromId }}
                  className="flex items-center gap-3 rounded-lg bg-canvas px-3 py-2"
                >
                  {from ? <Portrait person={from} size="sm" link={false} /> : null}
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">{m.subject}</span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {from?.name ?? m.fromId} · {relTime(m.createdAt)}
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
        {unread.length === 0 ? <p className="mt-2 text-sm text-muted-foreground">Inbox is clear.</p> : null}
      </section>

      <section className="rounded-xl bg-cream p-4 shadow-[var(--shadow-border)]">
        <h2 className="font-display text-2xl tracking-wide">Deals sitting still</h2>
        <ul className="mt-3 space-y-1.5">
          {stalled.map((d) => {
            const who = people.find((p) => p.id === d.personId);
            const stage = DEAL_STAGES.find((s) => s.id === d.stage)?.label ?? d.stage;
            return (
              <li key={d.id} className="flex items-center gap-3 rounded-lg bg-canvas px-3 py-2">
                {who ? <Portrait person={who} size="sm" /> : null}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {who?.name} · {stage}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {d.address} · next: {d.next || "—"}
                  </p>
                </div>
                {who ? (
                  <Button size="sm" variant="outline" asChild>
                    <Link to="/p/$id" params={{ id: who.id }}>
                      Advance
                    </Link>
                  </Button>
                ) : null}
              </li>
            );
          })}
        </ul>
        {stalled.length === 0 ? <p className="mt-2 text-sm text-muted-foreground">No open deals.</p> : null}
      </section>

      {waiting.length ? (
        <section className="rounded-xl bg-cream p-4 shadow-[var(--shadow-border)]">
          <h2 className="font-display text-2xl tracking-wide">Hands on your calls</h2>
          <ul className="mt-3 space-y-1.5">
            {waiting.slice(0, 8).map(({ call, person }) =>
              person ? (
                <li key={`${call.id}-${person.id}`} className="flex items-center gap-3 rounded-lg bg-canvas px-3 py-2">
                  <Portrait person={person} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{person.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{call.title}</p>
                  </div>
                  <Button size="sm" variant="outline" asChild>
                    <Link to="/p/$id" params={{ id: person.id }}>
                      Card
                    </Link>
                  </Button>
                </li>
              ) : null,
            )}
          </ul>
        </section>
      ) : null}

      {you ? (
        <p className="text-xs text-muted-foreground">
          Morning for {you.name}. Other bays: seats, queue, SMTP. Don’t start there.
        </p>
      ) : null}
    </div>
  );
}

function Seats() {
  const people = useForge((s) => s.people);
  const boardStatus = useForge((s) => s.boardStatus);
  const setBoardStatus = useForge((s) => s.setBoardStatus);
  const verifyMember = useForge((s) => s.verifyMember);
  const mergeHall = useForge((s) => s.mergeHall);
  const [q, setQ] = useState("");
  const [live, setLive] = useState<ManagedUser[] | null>(null);
  const [loading, setLoading] = useState(false);

  function pullSeats() {
    setLoading(true);
    void listManagedUsers()
      .then((rows) => {
        setLive(rows);
        mergeHall({
          people: rows.map((u) => ({ ...u.person, example: false })),
          posts: [],
          calls: [],
          vouches: [],
        });
      })
      .catch(() => toast("Sign in as desk to load live logins."))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    pullSeats();
  }, []);

  const visible = people.filter((p) => {
    const s = q.trim().toLowerCase();
    if (!s) return true;
    return `${p.name} ${p.trade} ${p.city} ${p.veteran?.mos ?? ""} ${p.deskVerified ? "verified" : "new"}`
      .toLowerCase()
      .includes(s);
  });
  const fresh = visible.filter((p) => !p.example && !p.deskVerified);

  return (
    <section className="rounded-xl bg-cream p-4 shadow-[var(--shadow-border)]">
      <h2 className="font-display text-2xl tracking-wide">Seats</h2>
      <p className="text-xs text-muted-foreground">
        A login is not on the hall until you load seats and stamp the card. Tickets are a separate
        verify, under Tickets.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button size="sm" variant="ink" onClick={pullSeats} disabled={loading}>
          {loading ? "Loading…" : "Load signed-in seats"}
        </Button>
      </div>
      {live ? (
        <ul className="mt-3 space-y-2">
          {live.map((u) => {
            const onHall = people.some((p) => p.id === u.userId);
            const stamped = people.find((p) => p.id === u.userId)?.deskVerified;
            return (
              <li key={u.userId} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-canvas px-3 py-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium">{u.name || u.email || "New member"}</p>
                  <p className="text-xs text-muted-foreground">
                    {u.email ?? "no email"} · {u.role} · {u.sessions} open · {u.person.trade}
                    {stamped ? " · stamped" : " · waiting"}
                    {onHall ? "" : " · not on this hall yet"}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" asChild>
                    <Link to="/p/$id" params={{ id: u.userId }}>
                      Card
                    </Link>
                  </Button>
                  <Button
                    size="sm"
                    variant="ink"
                    disabled={Boolean(stamped)}
                    onClick={() => {
                      void stampMember({ data: { userId: u.userId } })
                        .then((person) => {
                          mergeHall({ people: [person], posts: [], calls: [], vouches: [] });
                          verifyMember(u.userId);
                          toast(`${person.name} is on the hall. Verified.`);
                          pullSeats();
                        })
                        .catch((e: Error) => toast(e.message || "Desk seat required."));
                    }}
                  >
                    {stamped ? "Verified" : "Verify · put on the hall"}
                  </Button>
                  <button
                    type="button"
                    className="text-sm text-brick"
                    onClick={() => {
                      void setManagedStatus({
                        data: {
                          userId: u.userId,
                          status: u.status === "suspended" ? "active" : "suspended",
                        },
                      })
                        .then(() => {
                          toast("Seat updated.");
                          pullSeats();
                        })
                        .catch((e: Error) => toast(e.message));
                    }}
                  >
                    {u.status === "suspended" ? "Restore" : "Suspend login"}
                  </button>
                </div>
              </li>
            );
          })}
          {live.length === 0 ? (
            <li className="text-sm text-muted-foreground">No logins in the book yet.</li>
          ) : null}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-muted-foreground">
          If this stays empty, sign out and sign back in as desk, then load seats.
        </p>
      )}

      {fresh.length ? (
        <div className="mt-5">
          <p className="text-[11px] tracking-wide text-muted-foreground uppercase">Waiting on a stamp</p>
          <ul className="mt-2 space-y-1 text-sm">
            {fresh.slice(0, 8).map((p) => (
              <li key={p.id}>
                {p.name} · {p.trade}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <Input
        className="mt-4 bg-canvas"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Name, trade, MOS"
      />
      <ul className="mt-3 flex flex-col gap-2">
        {visible.slice(0, 12).map((p) => {
          const st = boardStatus[p.id] ?? "active";
          return (
            <li key={p.id} className="flex items-center gap-3 rounded-lg bg-canvas px-3 py-2">
              <Portrait person={p} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{p.name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {rankLabel(p.level, p.trade)} · {p.city}
                  {p.veteran ? ` · ${p.veteran.mos}` : ""}
                  {p.deskVerified ? " · desk verified" : p.example ? "" : " · new"}
                </p>
              </div>
              <Badge variant={st === "suspended" ? "brick" : st === "restricted" ? "warn" : p.deskVerified ? "ok" : "muted"}>
                {st === "active" && !p.deskVerified && !p.example ? "new" : st}
              </Badge>
              <Button size="sm" variant="outline" onClick={() => setBoardStatus(p.id, st === "active" ? "restricted" : "active")}>
                {st === "active" ? "Restrict" : "Restore"}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setBoardStatus(p.id, st === "suspended" ? "active" : "suspended")}>
                {st === "suspended" ? "Unban" : "Suspend"}
              </Button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function Queue() {
  const reportStatus = useForge((s) => s.reportStatus);
  const resolveReport = useForge((s) => s.resolveReport);
  const live = useForge((s) => s.reports);
  const people = useForge((s) => s.people);
  const queue = [...live, ...seedReports];
  return (
    <section className="rounded-xl bg-cream p-4 shadow-[var(--shadow-border)]">
      <h2 className="font-display text-2xl tracking-wide">Moderation queue</h2>
      <p className="text-xs text-muted-foreground">
        Reports from the hall land here first. Keep or pull. Pull on a person suspends the seat.
      </p>
      <ul className="mt-3 flex flex-col gap-2">
        {queue.map((r) => {
          const st = reportStatus[r.id] ?? "pending";
          const who = people.find((p) => p.id === r.by)?.name ?? r.by;
          return (
            <li key={r.id} className="rounded-lg bg-canvas px-3 py-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-medium">{r.target}</p>
                  <p className="text-xs text-muted-foreground">
                    {r.kind} · {r.reason} · flagged by {who}
                  </p>
                </div>
                <Risk risk={r.risk} />
              </div>
              {st === "pending" ? (
                <div className="mt-2 flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => resolveReport(r.id, "kept")}>
                    Keep
                  </Button>
                  <Button
                    size="sm"
                    variant="ink"
                    onClick={() => {
                      resolveReport(r.id, "pulled");
                      toast("Pulled.");
                    }}
                  >
                    Pull
                  </Button>
                </div>
              ) : (
                <p className="mt-2 text-xs text-muted-foreground">{st}</p>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function TicketsBay() {
  const people = useForge((s) => s.people);
  const verifyTicket = useForge((s) => s.verifyTicket);
  const checkTicketFromBoard = useForge((s) => s.checkTicketFromBoard);
  const [checking, setChecking] = useState<string | null>(null);
  const pending = people.flatMap((p) =>
    p.tickets
      .filter((t) => t.verify === "pending" || t.verify === "unverified")
      .map((t) => ({ person: p, ticket: t })),
  );
  const due = people.flatMap((p) =>
    p.tickets
      .filter((t) => {
        const s = ticketStatus(t);
        return s === "soon" || s === "lapsed" || s === "stale";
      })
      .map((t) => ({ person: p, ticket: t })),
  );

  return (
    <div className="flex flex-col gap-4">
      <section className="rounded-xl bg-cream p-4 shadow-[var(--shadow-border)]">
        <h2 className="font-display text-2xl tracking-wide">Verify queue</h2>
        <p className="text-xs text-muted-foreground">
          Check the issuing board first. OSHA 10/30 is not a license — run Outreach (trainer / OTI).
          A scan is not the source.
        </p>
        {pending.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">Nothing waiting.</p>
        ) : (
          <ul className="mt-3 flex flex-col gap-2">
            {pending.map(({ person, ticket }) => {
              const key = `${person.id}-${ticket.id}`;
              return (
                <li key={key} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-canvas px-3 py-3">
                  <div>
                    <p className="text-sm font-medium">{ticket.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {person.name} · {ticket.issuer}
                      {ticket.number ? ` · ${ticket.number}` : " · no number"}
                      {ticket.document ? ` · ${ticket.document}` : " · no scan yet"}
                    </p>
                    {ticket.source ? (
                      <p
                        className={cn(
                          "mt-1 text-xs",
                          ticket.source.result === "match" && "text-ok",
                          ticket.source.result === "no-record" && "text-brick",
                        )}
                      >
                        {ticket.source.board} · {boardResultLabel(ticket.source.result)}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {deskForTicket(ticket) ? (
                      <Button size="sm" variant="ghost" asChild>
                        <Link
                          to="/verify"
                          search={{
                            desk: deskForTicket(ticket),
                            number: ticket.number,
                            last: person.name.split(" ").at(-1),
                            ticket: ticket.id,
                            person: person.id,
                          }}
                        >
                          {deskForTicket(ticket) === "nursys"
                            ? "Nursys"
                            : deskForTicket(ticket) === "osha"
                              ? "OSHA"
                              : "DORA"}
                        </Link>
                      </Button>
                    ) : null}
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={checking === key}
                      onClick={() => {
                        setChecking(key);
                        window.setTimeout(() => {
                          const hit = checkTicketFromBoard(person.id, ticket.id);
                          setChecking(null);
                          if (!hit) return;
                          if (hit.result === "match") toast(`On ${hit.board}. Marked verified.`);
                          else if (hit.result === "stale") toast("Card confirmed. Stale for 5-year shop recency.");
                          else if (hit.result === "no-record") toast("The board has no record. Do not mark it.");
                          else if (hit.result === "needs-number") toast("Ask them for the credential number.");
                          else if (hit.result === "needs-paper") toast("Need a photo of the card, or the trainer's name.");
                          else if (hit.result === "unconfirmed") toast("Waiting on the trainer or OTI center.");
                          else toast("No public roll. Read the paper.");
                        }, 480);
                      }}
                    >
                      {checking === key ? "Checking…" : "Check the board"}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => verifyTicket(person.id, ticket.id, "unverified")}>
                      Hold
                    </Button>
                    <Button
                      size="sm"
                      variant="ink"
                      onClick={() => {
                        verifyTicket(person.id, ticket.id, "verified");
                        toast("Verified by the desk.");
                      }}
                    >
                      Verify
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
      <section className="rounded-xl bg-cream p-4 shadow-[var(--shadow-border)]">
        <h2 className="font-display text-2xl tracking-wide">60-day board</h2>
        <p className="text-xs text-muted-foreground">Lapsed or inside 60 days. The wallet already reminded them.</p>
        <ul className="mt-3 space-y-2 text-sm">
          {due.map(({ person, ticket }) => (
            <li key={`${person.id}-${ticket.id}`}>
              {person.name} · {ticket.name}{" "}
              <span className="font-mono text-xs text-muted-foreground">{ticketStatusLabel(ticket)}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function MarketBay() {
  const extra = useForge((s) => s.extraListings);
  const pulled = useForge((s) => s.pulledListings);
  const pullListing = useForge((s) => s.pullListing);
  const catalog = useMemo(() => [...extra, ...seedListings], [extra]);
  return (
    <section className="rounded-xl bg-cream p-4 shadow-[var(--shadow-border)]">
      <h2 className="font-display text-2xl tracking-wide">Market aisle</h2>
      <p className="text-xs text-muted-foreground">Pull a listing. Take-it is simulated — no processor.</p>
      <ul className="mt-3 flex flex-col gap-2">
        {catalog.map((l) => {
          const off = pulled.includes(l.id);
          return (
            <li key={l.id} className="flex items-center justify-between gap-3 rounded-lg bg-canvas px-3 py-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{l.title}</p>
                <p className="text-xs text-muted-foreground">
                  {l.kind} · {l.price} {off ? "· pulled" : ""}
                </p>
              </div>
              {off ? (
                <Badge variant="brick">Pulled</Badge>
              ) : (
                <Button size="sm" variant="outline" onClick={() => pullListing(l.id)}>
                  Pull
                </Button>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function CallsBay() {
  const calls = useForge((s) => s.calls);
  const people = useForge((s) => s.people);
  const ticketsDue = people.flatMap((p) =>
    p.tickets
      .filter((t) => {
        const s = ticketStatus(t);
        return s === "soon" || s === "lapsed" || s === "stale";
      })
      .map((ticket) => ({ person: p, ticket })),
  );
  return (
    <div className="flex flex-col gap-4">
      <section className="rounded-xl bg-cream p-4 shadow-[var(--shadow-border)]">
        <h2 className="font-display text-2xl tracking-wide">Calls</h2>
        <ul className="mt-3 flex flex-col gap-2">
          {calls.map((c) => (
            <li key={c.id}>
              <Link to="/calls" hash={c.id} className="flex justify-between rounded-lg bg-canvas px-3 py-2 text-sm hover:bg-accent">
                <span>
                  {c.title}
                  {c.urgent ? " · urgent" : ""}
                </span>
                <span className="text-muted-foreground">
                  {c.spots - c.filled} open · {c.rate}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
      <section className="rounded-xl bg-cream p-4 shadow-[var(--shadow-border)]">
        <h2 className="font-display text-2xl tracking-wide">Tickets due</h2>
        <ul className="mt-3 flex flex-col gap-2">
          {ticketsDue.map(({ person, ticket }) => (
            <li key={`${person.id}-${ticket.id}`}>
              <Link to="/p/$id" params={{ id: person.id }} className="flex items-center gap-3 rounded-lg bg-canvas px-3 py-2 text-sm">
                <Portrait person={person} size="sm" link={false} />
                <span className="min-w-0 flex-1 truncate">
                  {person.name} · {ticket.name}
                </span>
                <span className="font-mono text-[11px]">{ticketStatusLabel(ticket)}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function ContractsBay() {
  const contracts = useForge((s) => s.contracts);
  return (
    <section className="rounded-xl bg-cream p-4 shadow-[var(--shadow-border)]">
      <h2 className="font-display text-2xl tracking-wide">Contract jackets</h2>
      <p className="text-xs text-muted-foreground">Open → awarded → on the job → punch → paid.</p>
      <ul className="mt-3 space-y-2">
        {contracts.map((c) => (
          <li key={c.id}>
            <Link to="/contracts" className="flex justify-between rounded-lg bg-canvas px-3 py-2 text-sm hover:bg-accent">
              <span>{c.title}</span>
              <span className="text-muted-foreground">
                {c.stage} · {c.workerIds.length} on crew
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

function LearnBay() {
  return (
    <section className="rounded-xl bg-cream p-4 shadow-[var(--shadow-border)]">
      <h2 className="font-display text-2xl tracking-wide">Learn / talks</h2>
      <p className="text-xs text-muted-foreground">Five-minute units and shop lessons. Quality is the point.</p>
      <ul className="mt-3 space-y-2">
        {seedLectures.map((t) => (
          <li key={t.id}>
            <Link to="/talk/$id" params={{ id: t.id }} className="block rounded-lg bg-canvas px-3 py-2 text-sm hover:bg-accent">
              {t.title} · 5:00 · verified classroom
            </Link>
          </li>
        ))}
        {lessons.map((l) => (
          <li key={l.id} className="rounded-lg bg-canvas px-3 py-2 text-sm">
            {l.title} · {l.minutes} min · {l.topic}
          </li>
        ))}
      </ul>
    </section>
  );
}

function PackagesBay() {
  const asks = useForge((s) => s.packageAsks);
  const grantShop = useForge((s) => s.grantShop);
  const grantTicket = useForge((s) => s.grantTicket);
  const shopSeats = useForge((s) => s.shopSeats);
  const ticketSeats = useForge((s) => s.ticketSeats);
  const people = useForge((s) => s.people);
  return (
    <section className="rounded-xl bg-cream p-4 shadow-[var(--shadow-border)]">
      <h2 className="font-display text-2xl tracking-wide">Packages</h2>
      <p className="text-xs text-muted-foreground">
        Card free. Ticket check $12/yr. Shop board $79/mo. Stall 12%. Grant seats here — no processor.
      </p>
      <ul className="mt-3 grid gap-2 sm:grid-cols-2">
        {PACKS.map((p) => (
          <li key={p.id} className="rounded-lg bg-canvas px-3 py-2">
            <p className="font-medium">
              {p.name} · {p.price}
            </p>
            <p className="text-xs text-muted-foreground">{p.who}</p>
          </li>
        ))}
      </ul>
      <h3 className="mt-4 text-sm font-medium">Seats</h3>
      <ul className="mt-2 space-y-1.5 text-sm">
        {shopSeats.map((id) => {
          const p = people.find((x) => x.id === id);
          return (
            <li key={`s-${id}`} className="rounded-lg bg-canvas px-3 py-2">
              {p?.name ?? id} · Shop board
            </li>
          );
        })}
        {ticketSeats.map((id) => {
          const p = people.find((x) => x.id === id);
          return (
            <li key={`t-${id}`} className="rounded-lg bg-canvas px-3 py-2">
              {p?.name ?? id} · Ticket check
            </li>
          );
        })}
      </ul>
      <h3 className="mt-4 text-sm font-medium">Asks</h3>
      {asks.length ? (
        <ul className="mt-2 space-y-1.5 text-sm">
          {asks.map((a) => (
            <li key={a.id} className="flex items-center justify-between gap-2 rounded-lg bg-canvas px-3 py-2">
              <span>
                {a.name} · {PACKS.find((p) => p.id === a.pack)?.name ?? a.pack}
              </span>
              {a.pack === "shop" || a.pack === "ticket" ? (
                <Button
                  size="sm"
                  onClick={() => {
                    if (a.pack === "shop") {
                      grantShop(a.fromId);
                      toast(`Shop board on ${a.name}.`);
                    } else {
                      grantTicket(a.fromId);
                      toast(`Ticket check on ${a.name}.`);
                    }
                  }}
                >
                  Grant
                </Button>
              ) : (
                <span className="text-xs text-muted-foreground">{relTime(a.at)}</span>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-muted-foreground">Nobody has asked yet.</p>
      )}
      <Button variant="outline" className="mt-3" asChild>
        <Link to="/packages">Hall packages</Link>
      </Button>
    </section>
  );
}

function MailBay() {
  const mail = useForge((s) => s.mail);
  const people = useForge((s) => s.people);
  return (
    <section className="rounded-xl bg-cream p-4 shadow-[var(--shadow-border)]">
      <h2 className="font-display text-2xl tracking-wide">Hall mail</h2>
      <p className="text-xs text-muted-foreground">
        ConnectLn pipe. {mail.length} letters. Does not leave this hall.
      </p>
      <ul className="mt-3 space-y-1.5 text-sm">
        {mail.slice(0, 20).map((m) => {
          const from = people.find((p) => p.id === m.fromId);
          const to = people.find((p) => p.id === m.toId);
          return (
            <li key={m.id} className="rounded-lg bg-canvas px-3 py-2">
              <p className="font-medium">{m.subject}</p>
              <p className="text-xs text-muted-foreground">
                {from ? hallAddress(from) : m.fromId} → {to ? hallAddress(to) : m.toId} · {relTime(m.createdAt)}
                {m.read ? "" : " · unread"}
              </p>
            </li>
          );
        })}
      </ul>
      {!mail.length ? <p className="mt-2 text-sm text-muted-foreground">No letters yet.</p> : null}
    </section>
  );
}

function SmtpBay() {
  const smtp = useForge((s) => s.smtp);
  const setSmtp = useForge((s) => s.setSmtp);
  const saved = normalizeSmtp(smtp);
  const [provider, setProvider] = useState(saved.provider);
  const [host, setHost] = useState(saved.host);
  const [port, setPort] = useState(String(saved.port));
  const [tls, setTls] = useState<SmtpTls>(saved.tls);
  const [user, setUser] = useState(saved.user);
  const [pass, setPass] = useState(saved.pass);
  const [from, setFrom] = useState(saved.from);
  const [helo, setHelo] = useState(saved.helo);
  const [requireAuth, setRequireAuth] = useState(saved.requireAuth);
  const [testTo, setTestTo] = useState("");
  const [busy, setBusy] = useState(false);
  const preset = RELAYS.find((r) => r.id === provider) ?? RELAYS[0];
  const draft = normalizeSmtp({
    host,
    port: Number(port) || preset.port,
    tls,
    user,
    pass,
    from,
    helo,
    requireAuth,
    provider,
  });
  const ready = smtpReady(draft);

  function applyPreset(id: string) {
    const p = RELAYS.find((r) => r.id === id) ?? RELAYS[0];
    setProvider(p.id);
    if (p.host) setHost(p.host);
    setPort(String(p.port));
    setTls(p.tls);
    setRequireAuth(p.requireAuth);
    if (p.id === "sendgrid" && !user) setUser("apikey");
  }

  return (
    <section className="rounded-xl bg-cream p-4 shadow-[var(--shadow-border)]">
      <h2 className="font-display text-2xl tracking-wide">SMTP relay</h2>
      <p className="text-xs text-muted-foreground">
        Hall mail stays on ConnectLn. The relay is the smarthost that carries a copy to an
        outside address. Pick a provider or your own host. From must be a domain the relay allows.
      </p>
      <p className={cn("mt-2 text-sm font-medium", ready ? "text-ok" : "text-brick")}>
        {ready ? `Relay ready · ${draft.host}:${draft.port}` : "No relay — letters stay on the hall"}
      </p>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {RELAYS.map((r) => (
          <button
            key={r.id}
            type="button"
            onClick={() => applyPreset(r.id)}
            className={cn(
              "h-9 rounded-full px-3 text-sm",
              provider === r.id ? "bg-ink text-cream" : "bg-canvas text-muted-foreground",
            )}
          >
            {r.label}
          </button>
        ))}
      </div>
      <form
        className="mt-4 grid gap-3 sm:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault();
          setSmtp(draft);
          toast("Relay saved on the desk.");
        }}
      >
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <Label htmlFor="smtp-host">Relay host</Label>
          <Input
            id="smtp-host"
            value={host}
            onChange={(e) => setHost(e.target.value)}
            placeholder={preset.host || "smtp.your-relay.com"}
            autoComplete="off"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="smtp-port">Port</Label>
          <Input
            id="smtp-port"
            inputMode="numeric"
            value={port}
            onChange={(e) => setPort(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>TLS</Label>
          <div className="flex flex-wrap gap-1">
            {(
              [
                ["starttls", "STARTTLS · 587"],
                ["ssl", "SSL · 465"],
                ["none", "None · 25"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                className={cn(
                  "h-9 rounded-md px-2.5 text-xs",
                  tls === id ? "bg-ink text-cream" : "bg-canvas text-muted-foreground",
                )}
                onClick={() => {
                  setTls(id);
                  if (id === "ssl") setPort("465");
                  if (id === "starttls") setPort("587");
                  if (id === "none") setPort("25");
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <Label htmlFor="smtp-helo">EHLO name</Label>
          <Input
            id="smtp-helo"
            value={helo}
            onChange={(e) => setHelo(e.target.value)}
            placeholder="hall.connectln"
          />
        </div>
        <div className="sm:col-span-2">
          <button
            type="button"
            className="text-sm"
            onClick={() => setRequireAuth((v) => !v)}
          >
            {requireAuth ? "Auth on — username and password required" : "Auth off — IP-allowlisted relay"}
          </button>
        </div>
        {requireAuth ? (
          <>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="smtp-user">Username</Label>
              <Input
                id="smtp-user"
                value={user}
                onChange={(e) => setUser(e.target.value)}
                placeholder={preset.userHint}
                autoComplete="off"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="smtp-pass">Password / token</Label>
              <Input
                id="smtp-pass"
                type="password"
                value={pass}
                onChange={(e) => setPass(e.target.value)}
                autoComplete="new-password"
              />
            </div>
          </>
        ) : null}
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <Label htmlFor="smtp-from">From (must be allowed on the relay)</Label>
          <Input
            id="smtp-from"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            placeholder="ConnectLn hall <mail@your-domain.com>"
          />
        </div>
        <Button type="submit" variant="ink">
          Save relay
        </Button>
      </form>
      <form
        className="mt-6 flex flex-col gap-2 border-t border-border pt-4"
        onSubmit={(e) => {
          e.preventDefault();
          const to = testTo.trim();
          if (!to) return;
          setBusy(true);
          void dispatchSmtp({
            data: {
              to,
              subject: "ConnectLn hall mail — relay test",
              text: "If you can read this, the SMTP relay is up. Hall mail still keeps a copy on ConnectLn.",
              settings: draft,
            },
          })
            .then((res) => {
              if (res.ok) toast("Relay accepted the test.");
              else toast(res.reason);
            })
            .catch(() => toast("Could not reach the relay."))
            .finally(() => setBusy(false));
        }}
      >
        <Label htmlFor="smtp-test">Send a test through the relay</Label>
        <div className="flex flex-wrap gap-2">
          <Input
            id="smtp-test"
            type="email"
            value={testTo}
            onChange={(e) => setTestTo(e.target.value)}
            placeholder="you@shop.com"
            className="min-w-[12rem] flex-1"
            required
          />
          <Button type="submit" variant="outline" disabled={busy || !ready}>
            {busy ? "Sending…" : "Send test"}
          </Button>
        </div>
      </form>
    </section>
  );
}

function LedgerBay() {
  const ledger = useForge((s) => s.ledger);
  const gmv = ledger.reduce((s, o) => s + o.gross, 0);
  return (
    <section className="rounded-xl bg-cream p-4 shadow-[var(--shadow-border)]">
      <h2 className="font-display text-2xl tracking-wide">Ledger</h2>
      <p className="text-xs text-muted-foreground">
        Expedite Consults LLC. Shop ${TAKE.shop} · call ${TAKE.listing} · SOS ${TAKE.urgent} · fill ${TAKE.fill} · ticket ${TAKE.ticket}. Simulated take — no cards.
      </p>
      <dl className="mt-3 grid grid-cols-3 gap-2 text-center">
        <Stat label="Taken" value={`$${gmv}`} />
        <Stat label="Fills" value={String(ledger.filter((l) => l.kind === "fill").length)} />
        <Stat label="Seats" value={String(ledger.filter((l) => l.kind === "shop" || l.kind === "listing").length)} />
      </dl>
      <ul className="mt-4 space-y-2 text-sm">
        {ledger.slice(0, 24).map((o) => (
          <li key={o.id} className="flex justify-between rounded-lg bg-canvas px-3 py-2">
            <span>
              {o.shop} · {o.label}
            </span>
            <span className="tabular-nums">${o.gross}</span>
          </li>
        ))}
      </ul>
      {ledger.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">No take yet. A shop seat or a hire writes the first line.</p>
      ) : null}
      <ClipIngestLedger compact />
    </section>
  );
}

function SecurityBay() {
  const people = useForge((s) => s.people);
  const veterans = people.filter((p) => p.veteran);
  return (
    <section className="rounded-xl bg-cream p-4 shadow-[var(--shadow-border)]">
      <h2 className="font-display text-2xl tracking-wide">Security / service</h2>
      <p className="text-xs text-muted-foreground">MOS and clearance stay on the card. Failed logins would land here.</p>
      <ul className="mt-3 flex flex-col gap-2">
        {veterans.map((p) => (
          <li key={p.id}>
            <Link to="/p/$id" params={{ id: p.id }} className="flex items-center gap-3 rounded-lg bg-canvas px-3 py-2">
              <Portrait person={p} size="sm" link={false} />
              <span className="text-sm">
                {p.name} · {p.veteran?.branch} · {p.veteran?.mos}
                {clearanceLabel(p) ? ` · ${clearanceLabel(p)}` : ""}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

function FlagsBay() {
  const flags = useForge((s) => s.flags);
  const setFlag = useForge((s) => s.setFlag);
  return (
    <section className="rounded-xl bg-cream p-4 shadow-[var(--shadow-border)]">
      <h2 className="font-display text-2xl tracking-wide">Feature flags</h2>
      <p className="text-xs text-muted-foreground">Flip a bay without a deploy. Live is off on purpose.</p>
      <ul className="mt-3 space-y-2">
        {(Object.keys(flags) as (keyof typeof flags)[]).map((k) => (
          <li key={k} className="flex items-center justify-between rounded-lg bg-canvas px-3 py-2 text-sm">
            <span className="capitalize">{k}</span>
            <button
              type="button"
              onClick={() => setFlag(k, !flags[k])}
              className={cn("text-xs font-medium", flags[k] ? "text-ok" : "text-brick")}
            >
              {flags[k] ? "On" : "Off"}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

function AuditBay() {
  const audit = useForge((s) => s.audit);
  return (
    <section className="rounded-xl bg-cream p-4 shadow-[var(--shadow-border)]">
      <h2 className="font-display text-2xl tracking-wide">Audit</h2>
      <p className="text-xs text-muted-foreground">Who pulled what. Desk actions write here.</p>
      <ul className="mt-3 space-y-2 text-sm">
        {audit.map((a, i) => (
          <li key={`${a.t}-${i}`} className="rounded-lg bg-canvas px-3 py-2">
            <span className="font-mono text-[11px] text-muted-foreground">{a.t}</span>
            {" · "}
            <span className="font-medium">{a.who}</span>
            {" · "}
            {a.action}
          </li>
        ))}
      </ul>
    </section>
  );
}

function HealthBay() {
  return (
    <section className="rounded-xl bg-cream p-4 shadow-[var(--shadow-border)]">
      <h2 className="font-display text-2xl tracking-wide">Health</h2>
      <ul className="mt-3 grid gap-2 sm:grid-cols-2">
        {health.map((h) => (
          <li key={h.name} className="flex justify-between rounded-lg bg-canvas px-3 py-2 text-sm">
            <span>{h.name}</span>
            <span className={h.ok ? "text-ok" : "text-brick"}>{h.ok ? "Up" : "Off"}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function MhccBay() {
  const mergeMhcc = useForge((s) => s.mergeMhcc);
  const people = useForge((s) => s.people);
  const sessionRole = useForge((s) => s.sessionRole);
  const [csv, setCsv] = useState("");
  const [busy, setBusy] = useState(false);
  const book = people.filter((p) => p.book === "mhcc");

  async function load() {
    const rows = await loadMhccBook();
    mergeMhcc(rows);
  }

  return (
    <section className="rounded-xl bg-cream p-4 shadow-[var(--shadow-border)]">
      <h2 className="font-display text-2xl tracking-wide">Maryland book</h2>
      <p className="text-xs text-muted-foreground">
        Purchased Maryland Labor / MHCC file. Paste CSV. Desk only. Sample rows sit until you import yours.
      </p>
      <p className="mt-2 font-mono text-[11px] text-muted-foreground">{MHCC_CSV_HINT}</p>
      <p className="mt-3 text-sm">
        {book.length} on the book · {book.filter((p) => !p.example).length} from your file
      </p>
      {sessionRole === "desk" ? (
        <form
          className="mt-3 flex flex-col gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!csv.trim()) return;
            setBusy(true);
            void importMhccCsv({ data: csv })
              .then(async (r) => {
                toast(`Imported ${r.added}. ${r.skipped} skipped.`);
                setCsv("");
                await load();
              })
              .catch(() => toast("Desk seat required to import."))
              .finally(() => setBusy(false));
          }}
        >
          <textarea
            value={csv}
            onChange={(e) => setCsv(e.target.value)}
            rows={8}
            className="min-h-32 w-full rounded-lg bg-canvas p-3 font-mono text-xs"
            placeholder={MHCC_CSV_HINT}
          />
          <label className="text-sm">
            Or choose a file
            <input
              type="file"
              accept=".csv,text/csv"
              className="mt-1 block"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                void file.text().then(setCsv);
              }}
            />
          </label>
          <Button type="submit" variant="ink" disabled={busy || !csv.trim()}>
            {busy ? "Loading…" : "Load into the book"}
          </Button>
        </form>
      ) : (
        <p className="mt-3 text-sm text-muted-foreground">Sign in on the desk seat to import the file you bought.</p>
      )}
      <ul className="mt-4 max-h-80 space-y-1 overflow-auto text-sm">
        {book.slice(0, 40).map((p) => (
          <li key={p.id} className="flex justify-between rounded-lg bg-canvas px-3 py-2">
            <span>
              {p.name} · {p.trade} · {p.city}
            </span>
            <span className="text-xs text-muted-foreground">{p.tickets[0]?.number}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function ClipIngestLedger({ compact = false }: { compact?: boolean }) {
  const reports = useForge((s) => s.clipReports);
  const days = useMemo(() => clipDayLedger(reports), [reports]);
  const total = days.reduce((s, d) => s + d.ingested, 0);
  const today = new Date().toISOString().slice(0, 10);
  const todayRow = days.find((d) => d.day === today);

  function text() {
    return [
      "ConnectLn clip ingest ledger",
      `Days: ${days.length}  Videos ingested: ${total}`,
      "",
      ...days.map(
        (d) =>
          `${clipDayLabel(d.day)}\t${d.ingested} ingested\t${d.skipped} already had\t${d.failed} failed\t${d.pulls} pull${d.pulls === 1 ? "" : "s"}${
            d.trades.length ? `\t${d.trades.map((t) => `${t.trade} ${t.n}`).join(", ")}` : ""
          }`,
      ),
    ].join("\n");
  }

  return (
    <div className={compact ? "mt-5 border-t border-border pt-4" : "mt-4"}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className={compact ? "text-sm font-medium" : "font-display text-xl tracking-wide"}>
            Ingest ledger
          </h3>
          <p className="text-xs text-muted-foreground">How many videos the hall took in each day.</p>
        </div>
        {days.length ? (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                void navigator.clipboard.writeText(text()).then(
                  () => toast("Ledger copied."),
                  () => toast("Could not copy."),
                );
              }}
            >
              Copy ledger
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const blob = new Blob([text()], { type: "text/plain" });
                const a = document.createElement("a");
                a.href = URL.createObjectURL(blob);
                a.download = `connectln-clip-ledger.txt`;
                a.click();
                URL.revokeObjectURL(a.href);
              }}
            >
              Download
            </Button>
          </div>
        ) : null}
      </div>
      <dl className="mt-3 grid grid-cols-3 gap-2 text-center">
        <Stat label="Today" value={todayRow?.ingested ?? 0} hint={todayRow ? `${todayRow.pulls} pull${todayRow.pulls === 1 ? "" : "s"}` : "No pull today"} />
        <Stat label="Days on the book" value={days.length} />
        <Stat label="Ingested all days" value={total} />
      </dl>
      {days.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">No ingest days yet. Pull now writes the first row.</p>
      ) : (
        <ul className="mt-3 divide-y divide-border rounded-lg bg-canvas">
          {days.map((d) => (
            <li key={d.day} className="flex flex-wrap items-baseline justify-between gap-2 px-3 py-2.5 text-sm">
              <span>
                <span className="font-medium">{clipDayLabel(d.day)}</span>
                {d.trades.length ? (
                  <span className="ml-2 text-xs text-muted-foreground">
                    {d.trades.map((t) => `${t.trade} ${t.n}`).join(" · ")}
                  </span>
                ) : null}
              </span>
              <span className="tabular-nums text-muted-foreground">
                <span className="font-medium text-ink">{d.ingested} ingested</span>
                {" · "}
                {d.skipped} already had
                {d.failed ? ` · ${d.failed} failed` : ""}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ClipsBay() {
  const reports = useForge((s) => s.clipReports);
  const at = useForge((s) => s.clipIngestedAt);
  const role = useForge((s) => s.sessionRole);
  const posts = useForge((s) => s.posts);
  const extraReels = useForge((s) => s.extraReels);
  const people = useForge((s) => s.people);
  const clipStatus = useForge((s) => s.clipStatus);
  const setClipStatus = useForge((s) => s.setClipStatus);
  const [busy, setBusy] = useState(false);
  const [trade, setTrade] = useState<Trade | "all">("all");
  const [view, setView] = useState<"pending" | "live" | "held" | "killed" | "all">("pending");
  const [watch, setWatch] = useState<string | null>(null);
  const next = reports[0]?.nextAt;
  const due = next ? Date.parse(next) - Date.now() : 0;
  const canVet = true;

  const rows = useMemo(() => {
    const seen = new Set<string>();
    const out: { youtube: string; title: string; trade: string; still: string }[] = [];
    function add(youtube: string, title: string, trade: string, still?: string) {
      if (!youtube || seen.has(youtube)) return;
      seen.add(youtube);
      out.push({ youtube, title, trade, still: still || youtubeThumb(youtube) });
    }
    for (const p of posts) {
      if (p.youtube) add(p.youtube, p.headline || p.body.slice(0, 72), personById(people, p.authorId)?.trade || "", p.photo);
    }
    for (const r of extraReels) {
      if (r.youtube) add(r.youtube, r.title, personById(people, r.personId)?.trade || "", r.still);
    }
    for (const [yt, st] of Object.entries(clipStatus)) {
      if (st === "killed") add(yt, "Removed from the hall", "", youtubeThumb(yt));
    }
    return out;
  }, [posts, extraReels, people, clipStatus]);

  const pendingN = rows.filter((r) => clipState(r.youtube, clipStatus) === "pending").length;
  const visible = rows.filter((row) => {
    const st = clipState(row.youtube, clipStatus);
    if (trade !== "all" && row.trade !== trade) return false;
    if (view !== "all" && st !== view) return false;
    return true;
  });

  function writeReport(r: (typeof reports)[number]) {
    const added = r.items.filter((i) => i.added);
    const skip = r.items.filter((i) => !i.added);
    return [
      "ConnectLn clip pull",
      `At: ${r.at}`,
      `Next: ${r.nextAt}`,
      `Added: ${r.added}  Already had: ${r.skipped}  Failed sources: ${r.failed.length}`,
      "",
      added.length ? "ADDED" : "ADDED\n(none)",
      ...added.map((i) => `- ${i.title} — ${i.author} (@${i.handle}) · ${i.trade} · ${i.youtube}`),
      "",
      skip.length ? "ALREADY ON THE HALL" : "",
      ...skip.map((i) => `- ${i.title} — ${i.author} (@${i.handle}) · ${i.youtube}`),
      r.failed.length ? "\nFAILED SOURCES" : "",
      ...r.failed.map((f) => `- @${f.handle}: ${f.reason}`),
    ]
      .filter((line, i, all) => line !== "" || all[i - 1] !== "")
      .join("\n");
  }

  return (
    <section className="rounded-xl bg-cream p-4 shadow-[var(--shadow-border)] sm:p-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl tracking-wide">Synced Videos</h2>
          <p className="text-xs text-muted-foreground">
            Pull every 5 minutes into this bay. Vet here. Keep sends it to Shop talk and the wheel for the current{" "}
            {talkBelt() === "apac" ? "Asia / Pacific" : talkBelt() === "emea" ? "Europe / Africa" : "Americas"} 8-hour belt.
            Hold keeps it off the hall. Remove and it never syncs again. Expedite Consults LLC on the plate.
            {at ? ` Last pull ${relTime(at)}.` : " No pull yet."}
            {next && due > 0 ? ` Next ${relTime(next)}.` : next ? " Next pull is due." : ` Every ${CLIP_PULL_MS / 60000} min.`}
          </p>
        </div>
        <Button
          variant="ink"
          size="sm"
          disabled={busy}
          onClick={() => {
            setBusy(true);
            void fetch("/api/clips?force=1")
              .then((r) => (r.ok ? r.json() : null))
              .then((batch) => {
                useForge.getState().ingestClips(batch ?? { failed: [{ handle: "desk", reason: "No batch" }] });
                toast("In the vet bay. Keep a clip to put it on Shop talk.");
              })
              .catch(() => toast("Pull did not finish."))
              .finally(() => setBusy(false));
          }}
        >
          {busy ? "Pulling…" : "Pull now"}
        </Button>
      </div>
      <ClipIngestLedger />
      <ol className="mt-4 grid gap-2 rounded-xl bg-canvas px-4 py-3 text-sm sm:grid-cols-3">
        <li>
          <span className="block text-[11px] tracking-wide text-muted-foreground uppercase">1 · Watch</span>
          Click the still. If it is not our work, don’t Keep it.
        </li>
        <li>
          <span className="block text-[11px] tracking-wide text-muted-foreground uppercase">2 · Keep</span>
          Puts it on Shop talk and the Wheel for this 8-hour belt.
        </li>
        <li>
          <span className="block text-[11px] tracking-wide text-muted-foreground uppercase">3 · Hold or Remove</span>
          Hold stays in this bay. Remove never syncs again.
        </li>
      </ol>
      <div className="mt-4 flex flex-wrap gap-1.5">
        {(["pending", "live", "held", "killed", "all"] as const).map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => setView(id)}
            className={cn(
              "h-8 rounded-full px-3 text-xs font-medium",
              view === id ? "bg-ink text-cream" : "bg-canvas text-muted-foreground",
            )}
          >
            {id === "pending"
              ? `Vet${pendingN ? ` · ${pendingN}` : ""}`
              : id === "all"
                ? "All"
                : id === "live"
                  ? "On Shop talk"
                  : id === "held"
                    ? "Held"
                    : "Removed"}
          </button>
        ))}
      </div>
      <div className="mt-2 flex gap-1.5 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => setTrade("all")}
          className={cn(
            "h-8 shrink-0 rounded-full px-3 text-xs",
            trade === "all" ? "bg-ink text-cream" : "bg-canvas text-muted-foreground",
          )}
        >
          Every calling
        </button>
        {TRADES.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTrade(t)}
            className={cn(
              "h-8 shrink-0 rounded-full px-3 text-xs",
              trade === t ? "bg-ink text-cream" : "bg-canvas text-muted-foreground",
            )}
          >
            {t}
          </button>
        ))}
      </div>
      <ul className="mt-3 grid gap-3 sm:grid-cols-2">
        {visible.map((row) => {
          const st = clipState(row.youtube, clipStatus);
          return (
            <li key={row.youtube} className="overflow-hidden rounded-lg bg-canvas">
              {watch === row.youtube ? (
                <YoutubeStage id={row.youtube} title={row.title} still={row.still} autoplay mute={false} />
              ) : (
                <button
                  type="button"
                  className="block w-full"
                  onClick={() => setWatch(row.youtube)}
                  aria-label={`Watch ${row.title}`}
                >
                  <img src={row.still} alt="" className="aspect-video w-full object-cover" />
                </button>
              )}
              <div className="p-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="min-w-0 text-sm font-medium">{row.title}</p>
                  <Badge variant={st === "live" ? "ok" : st === "pending" ? "warn" : st === "held" ? "warn" : "brick"}>
                    {st === "live" ? "On Shop talk" : st === "pending" ? "Vet" : st === "held" ? "Held" : "Removed"}
                  </Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{row.trade || "Open"}</p>
                {canVet ? (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <Button
                      size="sm"
                      variant={st === "live" ? "ink" : "outline"}
                      onClick={() => {
                        setClipStatus(row.youtube, "live");
                        setWatch(null);
                        toast("On Shop talk and the wheel for this 8-hour belt.");
                      }}
                    >
                      Keep — Shop talk
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setClipStatus(row.youtube, "held");
                        setWatch(null);
                        toast("Held. Not on Shop talk or the wheel.");
                      }}
                    >
                      Hold
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setClipStatus(row.youtube, "killed");
                        setWatch(null);
                        toast("Removed. It will not sync again.");
                      }}
                    >
                      Remove
                    </Button>
                  </div>
                ) : (
                  <p className="mt-2 text-xs text-muted-foreground">Desk seat required to regulate.</p>
                )}
              </div>
            </li>
          );
        })}
      </ul>
      {visible.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">
          {view === "pending" ? "Nothing to vet. Next pull is in five minutes." : "Nothing in this filter."}
        </p>
      ) : null}
      {role !== "desk" ? (
        <p className="mt-2 text-xs text-muted-foreground">Signed in · hall view. Pull now still writes the report.</p>
      ) : null}
      {reports.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">No pulls logged yet. Sit on shop talk or hit Pull now.</p>
      ) : (
        <ul className="mt-4 flex flex-col gap-4">
          {reports.map((r) => (
            <li key={r.id} className="rounded-lg bg-canvas p-3">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="text-sm font-medium">{relTime(r.at)}</p>
                <p className="text-xs text-muted-foreground">
                  {r.added} added · {r.skipped} already on the hall
                  {r.failed.length ? ` · ${r.failed.length} sources failed` : ""}
                </p>
              </div>
              {r.items.length ? (
                <ul className="mt-2 divide-y divide-border">
                  {r.items.map((i) => (
                    <li key={i.youtube} className="flex flex-wrap items-baseline justify-between gap-2 py-1.5 text-sm">
                      <span className="min-w-0">
                        <span className="font-medium">{i.title}</span>
                        <span className="text-muted-foreground">
                          {" "}
                          — {i.author} · {i.trade || i.handle}
                        </span>
                      </span>
                      <Badge variant={i.added ? "ok" : "muted"}>{i.added ? "Added" : "Had"}</Badge>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-xs text-muted-foreground">Nothing in this pull.</p>
              )}
              {r.failed.length ? (
                <ul className="mt-2 text-xs text-warn">
                  {r.failed.map((f) => (
                    <li key={f.handle}>
                      @{f.handle}: {f.reason}
                    </li>
                  ))}
                </ul>
              ) : null}
              <div className="mt-2 flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    void navigator.clipboard.writeText(writeReport(r)).then(
                      () => toast("Report copied."),
                      () => toast("Could not copy."),
                    );
                  }}
                >
                  Copy report
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const blob = new Blob([writeReport(r)], { type: "text/plain" });
                    const a = document.createElement("a");
                    a.href = URL.createObjectURL(blob);
                    a.download = `connectln-clips-${r.at.slice(0, 10)}.txt`;
                    a.click();
                    URL.revokeObjectURL(a.href);
                  }}
                >
                  Download
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function Risk({ risk }: { risk: ReportRisk }) {
  return (
    <Badge variant={risk === "high" ? "brick" : risk === "review" ? "warn" : "muted"}>
      {risk}
    </Badge>
  );
}

function Stat({
  label,
  value,
  hint,
  warn,
}: {
  label: string;
  value: string | number;
  hint?: string;
  warn?: boolean;
}) {
  return (
    <div className="rounded-xl bg-cream p-4 shadow-[var(--shadow-border)]">
      <dt className="text-[11px] tracking-wide text-muted-foreground uppercase">{label}</dt>
      <dd className={cn("font-display text-3xl tabular-nums", warn && "text-brick")}>{value}</dd>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
