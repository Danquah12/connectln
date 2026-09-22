import { useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { BoardFilters } from "@/components/board-filters";
import { ExampleMark } from "@/components/example-mark";
import { Portrait } from "@/components/portrait";
import { TicketMark } from "@/components/ticket-plate";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { boardSearchOf, boardState, matchesBoard, parseBoardSearch } from "@/lib/board";
import { availabilityLabel, rankLabel, veteranLabel } from "@/lib/format";
import { presenceLabel, presenceOf } from "@/lib/presence";
import { hallRoster, isExample } from "@/lib/example";
import { groupOf, hallLabel } from "@/lib/scope";
import { reputation } from "@/lib/reputation";
import { personById, useForge } from "@/lib/store";
import type { FieldGroup, Person, Trade } from "@/lib/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/people")({
  validateSearch: (raw: Record<string, unknown>) => ({
    q: typeof raw.q === "string" ? raw.q : undefined,
    ...parseBoardSearch(raw),
  }),
  component: PeoplePage,
});

function PeoplePage() {
  const people = useForge((s) => s.people);
  const vouches = useForge((s) => s.vouches);
  const youId = useForge((s) => s.youId);
  const you = personById(people, youId);
  const { q: qSearch, trade: tradeSearch, group: groupSearch } = Route.useSearch();
  const navigate = useNavigate({ from: "/people" });
  const [q, setQ] = useState(qSearch ?? "");
  const fromUrl = boardState({ trade: tradeSearch, group: groupSearch }, you?.trade);
  const [picked, setPicked] = useState<{ group: "all" | FieldGroup; trade: Trade | "all" } | null>(null);
  const group = picked?.group ?? (you ? groupOf(you.trade) : fromUrl.group);
  const trade = picked?.trade ?? (you ? you.trade : fromUrl.trade);

  function setBoard(nextGroup: "all" | FieldGroup, nextTrade: Trade | "all") {
    setPicked({ group: nextGroup, trade: nextTrade });
    const next = boardSearchOf(nextGroup, nextTrade);
    void navigate({
      search: () => ({
        q: qSearch,
        trade: next.trade,
        group: next.group,
      }),
    });
  }
  const [openOnly, setOpenOnly] = useState(false);
  const [veteransOnly, setVeteransOnly] = useState(false);
  const [mentorsOnly, setMentorsOnly] = useState(false);
  const [near, setNear] = useState<"all" | "city" | "state">("all");
  const [blind, setBlind] = useState(false);
  const [onHall, setOnHall] = useState(false);
  const [mhccOnly, setMhccOnly] = useState(false);

  const visible = useMemo(() => {
    const query = q.trim().toLowerCase();
    return hallRoster(people)
      .slice()
      .sort((a, b) => {
        const rank = { online: 0, away: 1, offline: 2 };
        const open = Number(b.availability === "open") - Number(a.availability === "open");
        return (
          Number(isExample(a)) - Number(isExample(b)) ||
          open ||
          rank[presenceOf(a)] - rank[presenceOf(b)]
        );
      })
      .filter((p) => {
        if (!matchesBoard(p.trade, group, trade)) return false;
        if (openOnly && p.availability !== "open") return false;
        if (veteransOnly && !p.veteran) return false;
        if (mentorsOnly && !p.mentoring) return false;
        if (onHall && presenceOf(p) !== "online") return false;
        if (mhccOnly && p.book !== "mhcc") return false;
        if (you && near === "city" && p.city !== you.city) return false;
        if (you && near === "state" && p.state !== you.state) return false;
        if (!query) return true;
        const hay = [
          p.name,
          p.trade,
          p.city,
          p.state,
          p.union ?? "",
          p.veteran?.branch ?? "",
          p.veteran?.mos ?? "",
          ...p.specialties,
          ...p.tickets.map((t) => t.name),
        ]
          .join(" ")
          .toLowerCase();
        return hay.includes(query);
      });
  }, [people, q, group, trade, openOnly, veteransOnly, mentorsOnly, near, you, onHall, mhccOnly]);

  const open = visible.filter((p) => p.availability === "open");

  return (
    <div className="flex flex-col gap-4">
      <header>
        <p className="text-[11px] font-medium tracking-[0.16em] text-muted-foreground uppercase">Roster</p>
        <h1 className="font-display text-3xl tracking-wide sm:text-4xl">People</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Who is on the hall — tickets, vouches, open this week. Talk stays on Shop talk.
          {you ? ` ${hallLabel(you.trade)} first.` : ""}
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          <Link to="/find" className="text-brick hover:underline">
            Find crew
          </Link>
          {" · "}
          <Link to="/mentors" className="text-brick hover:underline">
            Mentors
          </Link>
          {" · "}
          <Link to="/you" className="text-brick hover:underline">
            Your card
          </Link>
        </p>
      </header>

      <Input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="OSHA-30 · 11B · Maryland RN · journeyman…"
        aria-label="Search the roster"
      />

      <BoardFilters
        quiet
        group={group}
        trade={trade}
        onGroup={(g) => setBoard(g, "all")}
        onTrade={(t) => setBoard(group, t)}
        flags={[
          { id: "open", label: "Open this week", active: openOnly, onClick: () => setOpenOnly((v) => !v) },
          { id: "vets", label: "Veterans", active: veteransOnly, onClick: () => setVeteransOnly((v) => !v) },
          { id: "mentors", label: "Mentors", active: mentorsOnly, onClick: () => setMentorsOnly((v) => !v) },
          { id: "city", label: "This city", active: near === "city", onClick: () => setNear((n) => (n === "city" ? "all" : "city")) },
          { id: "on", label: "On the hall", active: onHall, onClick: () => setOnHall((v) => !v) },
          { id: "mhcc", label: "Maryland book", active: mhccOnly, onClick: () => setMhccOnly((v) => !v) },
          { id: "blind", label: "Blind hire", active: blind, onClick: () => setBlind((v) => !v) },
        ]}
      />

      {open.length > 0 && !openOnly ? (
        <section>
          <p className="mb-2 text-[11px] font-medium tracking-[0.16em] text-muted-foreground uppercase">
            Open this week · {open.length}
          </p>
          <ul className="flex gap-3 overflow-x-auto pb-1">
            {open.slice(0, 12).map((p) => (
              <li key={p.id} className="shrink-0">
                <Link to="/p/$id" params={{ id: p.id }} className="flex w-[4.5rem] flex-col items-center gap-1">
                  <Portrait person={p} size="lg" link={false} className={blind ? "opacity-0" : undefined} />
                  <span className="w-full truncate text-center text-[11px] font-medium">
                    {blind ? p.trade : p.name.split(" ")[0]}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {visible.map((p) => (
          <li key={p.id}>
            <RosterPlate person={p} vouches={vouches.filter((v) => v.toId === p.id).length} score={reputation(p, vouches).overall} blind={blind} />
          </li>
        ))}
      </ul>
      {visible.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          Nobody matches that. Try another ticket, MOS, or city.
        </p>
      ) : null}
    </div>
  );
}

function RosterPlate({
  person,
  vouches,
  score,
  blind,
}: {
  person: Person;
  vouches: number;
  score: number;
  blind: boolean;
}) {
  return (
    <Link
      to="/p/$id"
      params={{ id: person.id }}
      className="flex h-full gap-3 rounded-xl bg-cream p-3 shadow-[var(--shadow-border)] transition-[box-shadow] duration-150 hover:shadow-[var(--shadow-border-hover)]"
    >
      <Portrait person={person} size="xl" link={false} className={cn("size-20", blind && "opacity-0")} />
      <div className="min-w-0 flex-1">
        <p className="font-display text-2xl leading-none tracking-wide">
          {blind ? `${person.trade}` : person.name}
          {isExample(person) ? <ExampleMark className="ml-1.5 align-middle" /> : null}
        </p>
        <p className="mt-1 truncate text-sm text-muted-foreground">
          {rankLabel(person.level, person.trade)}
          {person.city ? ` · ${person.city}` : ""}
          {` · ${presenceLabel(person)}`}
        </p>
        <div className="mt-2 flex flex-wrap gap-1">
          {person.tickets.slice(0, 3).map((t) => (
            <TicketMark key={t.id} ticket={t} />
          ))}
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <Badge
            variant={
              person.availability === "open" ? "ok" : person.availability === "on-job" ? "warn" : "muted"
            }
          >
            {availabilityLabel(person.availability)}
          </Badge>
          {person.mentoring ? <Badge variant="outline">Mentor</Badge> : null}
          {person.book === "mhcc" ? <Badge variant="outline">MHCC</Badge> : null}
          {veteranLabel(person) ? <Badge variant="outline">{person.veteran?.branch}</Badge> : null}
          <span className="ml-auto font-display text-lg tabular-nums text-ink">{score}</span>
          <span className="text-[11px] text-muted-foreground">
            {vouches} vouch{vouches === 1 ? "" : "es"}
          </span>
        </div>
      </div>
    </Link>
  );
}
