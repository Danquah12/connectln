import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/hub")({ component: HubPage });

const BLOCKS = [
  { to: "/", title: "Social", blurb: "Shop talk, your hall, safety." },
  { to: "/learn", title: "Learn", blurb: "Ten minutes, JATC, library, interview." },
  { to: "/events", title: "Events", blurb: "Classes, CE, fairs, drills — a start time." },
  { to: "/fund", title: "Funding", blurb: "GI Bill seats, stipends, CE a shop reimburses." },
  { to: "/showcase", title: "Showcase", blurb: "Demos, walkthroughs, presentations." },
  { to: "/present", title: "Talks", blurb: "Five minutes. Professors explain the unit." },
  { to: "/reels", title: "Reels", blurb: "Six seconds of the work. Post yours." },
  { to: "/market", title: "Market", blurb: "Guides, tools, classes — and software shops buy." },
  { to: "/work", title: "Work", blurb: "Calls, contracts, gigs, intern seats." },
  { to: "/hands", title: "Hands", blurb: "Raised, looking, hired, vouch." },
  { to: "/saved", title: "Saved", blurb: "Cards, calls, and talk you pulled aside." },
  { to: "/build", title: "Build", blurb: "Crews, shops, collaborators, milestones." },
  { to: "/passport", title: "Professional", blurb: "Passport, tickets, vouches, reputation." },
] as const;

function HubPage() {
  return (
    <div className="flex flex-col gap-4">
      <header>
        <h1 className="font-display text-4xl tracking-wide">The board as a system</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Learn a ticket. Prove it. List it. Get hired. Teach the next one. Not seven apps — one
          card that actually compounds.
        </p>
      </header>
      <ul className="grid gap-2 sm:grid-cols-2">
        {BLOCKS.map((b) => (
          <li key={b.to}>
            <Link
              to={b.to}
              className="block rounded-xl bg-cream p-4 shadow-[var(--shadow-border)] hover:shadow-[var(--shadow-border-hover)]"
            >
              <p className="font-display text-2xl tracking-wide">{b.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{b.blurb}</p>
            </Link>
          </li>
        ))}
      </ul>
      <p className="text-sm text-muted-foreground">
        Apprentice sits OSHA → posts a panel still → a shop buys the notes → a GC finds the crew →
        they bid a kitchen → the j-man teaches the third-year → the class lists on the market.
      </p>
    </div>
  );
}
