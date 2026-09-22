import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { lessons } from "@/lib/board-seed";
import { nextCallFails } from "@/lib/crew-watch";
import { DEAL_STAGES, isDealTrade } from "@/lib/crm";
import { fitScore } from "@/lib/fit";
import { ticketStatusLabel } from "@/lib/format";
import { funds, meets, tradeNews } from "@/lib/hall-seed";
import { owedVouches } from "@/lib/loop";
import { sitStreak } from "@/lib/return";
import { personById, useForge } from "@/lib/store";

export function YourMorning() {
  const youId = useForge((s) => s.youId);
  const people = useForge((s) => s.people);
  const you = personById(people, youId);
  const calls = useForge((s) => s.calls);
  const vouches = useForge((s) => s.vouches);
  const mail = useForge((s) => s.mail);
  const deals = useForge((s) => s.dealNotes);
  const applied = useForge((s) => s.appliedCallIds);
  const callHands = useForge((s) => s.callHands);
  const callHires = useForge((s) => s.callHires);
  const applyToCall = useForge((s) => s.applyToCall);
  const addVouch = useForge((s) => s.addVouch);
  const satLessonIds = useForge((s) => s.satLessonIds);
  const satDays = useForge((s) => s.satDays);
  const passed = useForge((s) => s.passedChallenges);
  const rsvpIds = useForge((s) => s.rsvpIds);
  const claimed = useForge((s) => s.claimedFundIds);

  if (!you) return null;

  const first = you.name.split(" ")[0] ?? you.name;
  const streak = sitStreak(satDays);
  const tickets = nextCallFails(you);
  const unread = mail.filter((m) => m.toId === you.id && !m.read);
  const deal = isDealTrade(you.trade)
    ? deals.find((d) => d.personId === you.id && d.stage !== "closed" && d.stage !== "lost")
    : deals.find((d) => d.stage !== "closed" && d.stage !== "lost");
  const fitList = calls
    .filter((c) => c.filled < c.spots && c.postedBy !== you.id && !applied.includes(c.id))
    .map((c) => ({ c, fit: fitScore(you, c, vouches) }))
    .filter((x) => !x.fit.blocked)
    .sort((a, b) => b.fit.score - a.fit.score);
  const fit = fitList[0];
  const hands = calls
    .filter((c) => c.postedBy === you.id)
    .reduce((n, c) => n + (callHands[c.id] ?? []).filter((id) => !(callHires[c.id] ?? []).includes(id)).length, 0);
  const owed = owedVouches({ youId: you.id, people, calls, callHires, vouches });
  const lesson = lessons.find((l) => !satLessonIds.includes(l.id));
  const event = meets.find(
    (m) => !rsvpIds.includes(m.id) && (!m.trades?.length || m.trades.includes(you.trade) || Boolean(you.veteran)),
  );
  const fund = funds.find(
    (f) => !claimed.includes(f.id) && (f.trades.includes(you.trade) || (you.veteran && f.kind === "gi-bill")),
  );
  const news = tradeNews.find((n) => n.trade === you.trade) ?? tradeNews.find((n) => n.trade === "all");
  const quizOpen = !passed.includes("elec-1") && you.trade === "Electrician";

  return (
    <section className="rounded-xl bg-ink p-4 text-cream shadow-[var(--shadow-border)] sm:p-5">
      <p className="text-[11px] tracking-wide text-cream/50 uppercase">On the hall today</p>
      <h2 className="mt-1 font-display text-3xl tracking-wide">Good morning, {first}</h2>
      <p className="mt-1 text-sm text-cream/60">
        {streak ? `${streak}-day sit streak. ` : "Sit ten minutes and the board remembers. "}
        {news?.line}
      </p>
      <ul className="mt-3 space-y-2">
        {lesson ? (
          <li className="flex items-center justify-between gap-3 rounded-lg bg-cream/10 px-3 py-2">
            <span className="min-w-0">
              <span className="block truncate text-sm">{lesson.title}</span>
              <span className="block text-xs text-cream/55">{lesson.minutes} min · continue learning</span>
            </span>
            <Button size="sm" variant="cream" asChild>
              <Link to="/learn">Sit it</Link>
            </Button>
          </li>
        ) : null}
        {quizOpen ? (
          <li className="flex items-center justify-between gap-3 rounded-lg bg-cream/10 px-3 py-2">
            <span className="min-w-0">
              <span className="block truncate text-sm">Today's challenge — diagnose this circuit</span>
              <span className="block text-xs text-cream/55">Prove it. Not a claim in a headline.</span>
            </span>
            <Button size="sm" variant="cream" asChild>
              <Link to="/challenges">Open</Link>
            </Button>
          </li>
        ) : null}
        {tickets.slice(0, 1).map((t) => (
          <li key={t.id} className="flex items-center justify-between gap-3 rounded-lg bg-cream/10 px-3 py-2">
            <span className="min-w-0">
              <span className="block truncate text-sm">{t.name}</span>
              <span className="block text-xs text-cream/55">{ticketStatusLabel(t)} · next call fails</span>
            </span>
            <Button size="sm" variant="cream" asChild>
              <Link to="/wallet">License desk</Link>
            </Button>
          </li>
        ))}
        {fit ? (
          <li className="flex items-center justify-between gap-3 rounded-lg bg-cream/10 px-3 py-2">
            <span className="min-w-0">
              <span className="block truncate text-sm">{fit.c.title}</span>
              <span className="block text-xs text-cream/55">
                {fit.c.shop} · {fit.c.city} · {fitList.length} matching calls
              </span>
            </span>
            <Button
              size="sm"
              variant="cream"
              onClick={() => {
                applyToCall(fit.c.id);
                toast("Hand raised.");
              }}
            >
              Raise a hand
            </Button>
          </li>
        ) : null}
        {event ? (
          <li className="flex items-center justify-between gap-3 rounded-lg bg-cream/10 px-3 py-2">
            <span className="min-w-0">
              <span className="block truncate text-sm">{event.title}</span>
              <span className="block text-xs text-cream/55">
                {event.when} · {event.place}
              </span>
            </span>
            <Button size="sm" variant="cream" asChild>
              <Link to="/events">Events</Link>
            </Button>
          </li>
        ) : null}
        {fund ? (
          <li className="flex items-center justify-between gap-3 rounded-lg bg-cream/10 px-3 py-2">
            <span className="min-w-0">
              <span className="block truncate text-sm">{fund.title}</span>
              <span className="block text-xs text-cream/55">{fund.who} · sits the class</span>
            </span>
            <Button size="sm" variant="cream" asChild>
              <Link to="/fund">Funding</Link>
            </Button>
          </li>
        ) : null}
        {unread[0] ? (
          <li className="flex items-center justify-between gap-3 rounded-lg bg-cream/10 px-3 py-2">
            <span className="min-w-0">
              <span className="block truncate text-sm">{unread[0].subject}</span>
              <span className="block text-xs text-cream/55">
                {unread.length} unread · hall mail
              </span>
            </span>
            <Button size="sm" variant="cream" asChild>
              <Link to="/mail" search={{ to: unread[0].fromId }}>
                Open
              </Link>
            </Button>
          </li>
        ) : null}
        {deal ? (
          <li className="flex items-center justify-between gap-3 rounded-lg bg-cream/10 px-3 py-2">
            <span className="min-w-0">
              <span className="block truncate text-sm">
                {DEAL_STAGES.find((s) => s.id === deal.stage)?.label} · {deal.address}
              </span>
              <span className="block text-xs text-cream/55">Deal sitting · {deal.next || "next step"}</span>
            </span>
            <Button size="sm" variant="cream" asChild>
              <Link to="/p/$id" params={{ id: deal.personId }}>
                Advance
              </Link>
            </Button>
          </li>
        ) : null}
        {owed[0] ? (
          <li className="flex items-center justify-between gap-3 rounded-lg bg-cream/10 px-3 py-2">
            <span className="min-w-0">
              <span className="block truncate text-sm">
                Vouch {owed[0].person.name} · {owed[0].call.title}
              </span>
              <span className="block text-xs text-cream/55">You hired them. The vouch is the proof.</span>
            </span>
            <Button
              size="sm"
              variant="cream"
              onClick={() => {
                addVouch(
                  owed[0].person.id,
                  `On ${owed[0].call.title}. Showed up with the tickets. I'd take them again.`,
                  owed[0].call.title,
                  ["quality", "reliability"],
                );
                toast(`Vouch on ${owed[0].person.name}.`);
              }}
            >
              Vouch the work
            </Button>
          </li>
        ) : null}
        {hands ? (
          <li className="flex items-center justify-between gap-3 rounded-lg bg-cream/10 px-3 py-2">
            <span className="min-w-0">
              <span className="block truncate text-sm">
                {hands} hand{hands === 1 ? "" : "s"} on your calls
              </span>
              <span className="block text-xs text-cream/55">Hire from the card</span>
            </span>
            <Button size="sm" variant="cream" asChild>
              <Link to="/calls">Calls</Link>
            </Button>
          </li>
        ) : null}
        <li className="flex items-center justify-between gap-3 rounded-lg bg-cream/10 px-3 py-2">
          <span className="min-w-0">
            <span className="block truncate text-sm">Bring a third-year</span>
            <span className="block text-xs text-cream/55">They get the hall. You get a crew.</span>
          </span>
          <Button size="sm" variant="cream" asChild>
            <Link to="/you">Invite</Link>
          </Button>
        </li>
      </ul>
    </section>
  );
}
