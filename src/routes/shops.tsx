import { createFileRoute, Link } from "@tanstack/react-router";
import { shops } from "@/lib/seed";

export const Route = createFileRoute("/shops")({ component: ShopsPage });

function ShopsPage() {
  return (
    <div className="flex flex-col gap-4">
      <header>
        <h1 className="font-display text-4xl tracking-wide">Shops</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          People, projects, and how the floor actually rates them.
        </p>
      </header>
      <ul className="flex flex-col gap-2">
        {shops.map((s) => (
          <li key={s.id}>
            <Link
              to="/s/$id"
              params={{ id: s.id }}
              className="block rounded-xl bg-cream p-4 shadow-[var(--shadow-border)]"
            >
              <p className="font-medium">{s.name}</p>
              <p className="text-sm text-muted-foreground">
                {s.city}, {s.state} · {s.staffIds.length} on the card · {s.projectIds.length}{" "}
                projects
                {s.partner ? " · Partner" : ""}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
