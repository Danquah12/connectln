import { Link } from "@tanstack/react-router";
import { meets, tradeNews } from "@/lib/hall-seed";
import { ticketNeedsRefresh, ticketStatusLabel } from "@/lib/format";
import { hallEnglish } from "@/lib/hall-lang";
import { personById, useForge } from "@/lib/store";

export function HallBrief() {
  const posts = useForge((s) => s.posts);
  const people = useForge((s) => s.people);
  const youId = useForge((s) => s.youId);
  const you = personById(people, youId);
  if (!you) return null;

  const briefs = posts
    .filter((p) => {
      const who = personById(people, p.authorId);
      return (
        who &&
        hallEnglish(p.body, p.headline, who.name) &&
        (who.trade === you.trade || p.kind === "safety") &&
        (p.kind === "safety" || p.kind === "call" || p.kind === "brief")
      );
    })
    .slice(0, 3);
  const due = you.tickets.filter(ticketNeedsRefresh)[0];
  const news = tradeNews.find((n) => n.trade === you.trade) ?? tradeNews.find((n) => n.trade === "all");
  const next = meets.find((m) => !m.trades?.length || m.trades.includes(you.trade) || you.veteran);

  return (
    <section className="rounded-xl bg-cream p-4 shadow-[var(--shadow-border)]">
      <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">In your trade today</p>
      <p className="mt-1 text-[11px] text-muted-foreground">{news?.line}</p>
      <ul className="mt-3 flex flex-col gap-3">
        {due ? (
          <li>
            <Link to="/wallet" className="block hover:opacity-80">
              <p className="text-sm font-medium">{due.name}</p>
              <p className="text-xs text-warn">{ticketStatusLabel(due)}</p>
            </Link>
          </li>
        ) : null}
        {next ? (
          <li>
            <Link to="/events" className="block hover:opacity-80">
              <p className="text-sm font-medium">{next.title}</p>
              <p className="text-xs text-muted-foreground">
                {next.when} · {next.place}
              </p>
            </Link>
          </li>
        ) : null}
        {briefs.map((p) => {
          const who = personById(people, p.authorId);
          return (
            <li key={p.id}>
              <Link to="/" className="block hover:opacity-80">
                <p className="line-clamp-2 text-sm font-medium">{p.body}</p>
                <p className="text-xs text-muted-foreground">
                  {who?.name} · {p.kind === "safety" ? "Safety" : p.kind === "call" ? "Call" : "Brief"}
                </p>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}