import { createFileRoute, Link } from "@tanstack/react-router";
import { guilds } from "@/lib/seed";

export const Route = createFileRoute("/groups")({ component: GroupsPage });

function GroupsPage() {
  return (
    <div className="flex flex-col gap-4">
      <header>
        <h1 className="font-display text-4xl tracking-wide">Groups</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Electricians in a city. Veterans on the tools. Apprentices. Not a branding club.
        </p>
      </header>
      <ul className="flex flex-col gap-2">
        {guilds.map((g) => (
          <li key={g.id} className="rounded-xl bg-cream p-4 shadow-[var(--shadow-border)]">
            <p className="font-medium">{g.name}</p>
            <p className="mt-1 text-sm text-muted-foreground">{g.blurb}</p>
            <p className="mt-2 text-xs tabular-nums">{g.memberIds.length} on the board</p>
            <p className="mt-2 flex flex-wrap gap-2 text-xs">
              {g.memberIds.slice(0, 6).map((id) => (
                <Link key={id} to="/p/$id" params={{ id }} className="text-brick hover:underline">
                  {id.replace("-", " ")}
                </Link>
              ))}
            </p>
          </li>
        ))}
      </ul>
      <p className="text-xs text-muted-foreground">
        Cohorts (classes and units) live on{" "}
        <Link to="/cohorts" className="text-brick hover:underline">
          Cohorts
        </Link>
        .
      </p>
    </div>
  );
}
