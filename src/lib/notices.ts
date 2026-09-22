import { visitors } from "./board-seed";
import { crewWatch } from "./crew-watch";
import { daysUntil, ticketStatus, ticketStatusLabel } from "./format";
import { shops } from "./seed";
import type { CrewCall, HallInvite, HallLetter, Person, Thread, Ticket, Vouch } from "./types";

export type NoticeKind = "ticket" | "invite" | "look" | "call" | "vouch" | "inbox" | "crew" | "mail";

export type Notice = {
  id: string;
  kind: NoticeKind;
  title: string;
  why: string;
  score: number;
  decision: boolean;
  href: string;
  inviteId?: string;
};

export function shopHref(name: string) {
  const shop = shops.find((s) => s.name === name);
  return shop ? `/s/${shop.id}` : "/shops";
}

function ticketScore(t: Ticket) {
  const days = daysUntil(t.expires);
  const s = ticketStatus(t);
  if (s === "lapsed") return 100;
  if (days !== null && days <= 14) return 80;
  if (s === "soon") return 60;
  if (t.verify === "pending" || t.verify === "unverified") return 50;
  return 0;
}

export function buildNotices(input: {
  you: Person;
  people: Person[];
  vouches: Vouch[];
  calls: CrewCall[];
  threads: Thread[];
  invites: HallInvite[];
  inviteStatus: Record<string, "pending" | "accepted" | "passed">;
  appliedCallIds: string[];
  dismissed: string[];
  callHires?: Record<string, string[]>;
  mail?: HallLetter[];
}): Notice[] {
  const { you, people, vouches, calls, threads, invites, inviteStatus, appliedCallIds, dismissed, callHires, mail } =
    input;
  const byId = (id: string) => people.find((p) => p.id === id);
  const out: Notice[] = [];

  for (const t of you.tickets) {
    const n = ticketScore(t);
    if (!n) continue;
    const s = ticketStatus(t);
    out.push({
      id: `ticket-${t.id}`,
      kind: "ticket",
      title: t.name,
      why:
        s === "lapsed"
          ? `${ticketStatusLabel(t)} — it walked off the card.`
          : t.verify === "pending" || t.verify === "unverified"
            ? `${t.verify}. Upload the paper so the desk can verify it.`
            : `${ticketStatusLabel(t)} — renew before it walks off the card.`,
      score: n,
      decision: s === "lapsed" || (daysUntil(t.expires) ?? 99) <= 14,
      href: "/wallet",
    });
  }

  for (const inv of invites) {
    if ((inviteStatus[inv.id] ?? "pending") !== "pending") continue;
    const from = byId(inv.fromId);
    out.push({
      id: `invite-${inv.id}`,
      kind: "invite",
      title: from ? `${from.name} · ${inv.kind}` : inv.kind,
      why: `${inv.body} ${inv.why}`,
      score: 100,
      decision: true,
      href: "/hall",
      inviteId: inv.id,
    });
  }

  for (const v of visitors) {
    out.push({
      id: `look-${v.id}`,
      kind: "look",
      title: `${v.shop} looked`,
      why: `${v.looking}. ${v.city} · ${v.when}.`,
      score: v.when === "today" ? 40 : 25,
      decision: false,
      href: shopHref(v.shop),
    });
  }

  for (const c of calls) {
    if (c.filled >= c.spots) continue;
    const mine = c.trade === you.trade;
    const applied = appliedCallIds.includes(c.id);
    if (!mine && !applied) continue;
    out.push({
      id: `call-${c.id}`,
      kind: "call",
      title: applied ? `You raised a hand · ${c.title}` : c.title,
      why: applied
        ? `${c.city} · still open · ${c.spots - c.filled} spots`
        : `${c.city} · ${c.rate} · your ${c.trade.toLowerCase()} ticket matches`,
      score: applied ? 50 : 45,
      decision: false,
      href: "/calls",
    });
  }

  for (const v of vouches) {
    if (v.toId !== you.id) continue;
    const from = byId(v.fromId);
    out.push({
      id: `vouch-${v.id}`,
      kind: "vouch",
      title: from ? `${from.name} vouched` : "A vouch landed",
      why: v.site ? `${v.body} · ${v.site}` : v.body,
      score: 30,
      decision: false,
      href: `/p/${you.id}`,
    });
  }

  for (const t of threads) {
    const last = t.messages.at(-1);
    if (!last || last.fromId === you.id) continue;
    const who = byId(t.withId);
    out.push({
      id: `inbox-${t.id}`,
      kind: "inbox",
      title: who ? who.name : "Inbox",
      why: last.body,
      score: 100,
      decision: true,
      href: "/messages",
    });
  }

  for (const row of crewWatch({ youId: you.id, calls, people, hires: callHires ?? {} })) {
    out.push({
      id: `crew-${row.callId}-${row.person.id}-${row.required}`,
      kind: "crew",
      title: `${row.person.name} · ${row.required}`,
      why: `${row.callTitle} · ${row.label}. Next call fails if this isn't current.`,
      score: row.status === "lapsed" ? 95 : 72,
      decision: true,
      href: "/find",
    });
  }

  for (const letter of mail ?? []) {
    if (letter.toId !== you.id || letter.read) continue;
    const from = byId(letter.fromId);
    out.push({
      id: `mail-${letter.id}`,
      kind: "mail",
      title: from ? `${from.name} · hall mail` : "Hall mail",
      why: letter.subject,
      score: 96,
      decision: true,
      href: "/mail",
    });
  }

  return out
    .filter((n) => !dismissed.includes(n.id))
    .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title))
    .slice(0, 20);
}

export function decisionCount(notices: Notice[]) {
  return notices.filter((n) => n.decision).length;
}
