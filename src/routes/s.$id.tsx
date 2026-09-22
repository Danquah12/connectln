import { createFileRoute, Link } from "@tanstack/react-router";
import { Portrait } from "@/components/portrait";
import { projects, shops } from "@/lib/seed";
import { personById, useForge } from "@/lib/store";

export const Route = createFileRoute("/s/$id")({ component: ShopPage });

function ShopPage() {
  const { id } = Route.useParams();
  const people = useForge((s) => s.people);
  const shop = shops.find((s) => s.id === id);
  if (!shop) return <p className="py-16 text-center text-sm text-muted-foreground">No shop.</p>;
  const staff = shop.staffIds.map((i) => personById(people, i)).filter(Boolean);
  const jobs = projects.filter((p) => shop.projectIds.includes(p.id));
  const r = shop.ratings;

  return (
    <div className="flex flex-col gap-4">
      <header>
        <p className="text-[11px] uppercase text-muted-foreground">
          <Link to="/shops" className="hover:text-ink">
            Shops
          </Link>
        </p>
        <h1 className="font-display text-4xl tracking-wide">{shop.name}</h1>
        <p className="text-sm text-muted-foreground">
          {shop.city}, {shop.state} · {staff.length} verified on jobs
          {shop.partner ? " · Partner" : ""}
        </p>
        {shop.url ? (
          <a
            href={shop.url}
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-flex h-11 items-center rounded-full bg-brick px-4 text-sm font-medium text-cream"
          >
            Open {shop.name}
          </a>
        ) : null}
      </header>
      {r ? (
        <section className="rounded-xl bg-cream p-4 shadow-[var(--shadow-border)]">
          <h2 className="font-display text-2xl tracking-wide">Reality check</h2>
          <p className="text-xs text-muted-foreground">Anonymous, from people who were on the floor.</p>
          <ul className="mt-3 space-y-2 text-sm">
            {(
              [
                ["Pay", r.pay],
                ["Safety", r.safety],
                ["Management", r.management],
                ["Overtime", r.overtime],
                ["Equipment", r.equipment],
                ["Training", r.training],
                ["Balance", r.balance],
              ] as const
            ).map(([k, v]) => (
              <li key={k} className="flex justify-between">
                <span>{k}</span>
                <span className="tabular-nums">{v.toFixed(1)}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      <section className="rounded-xl bg-cream p-4 shadow-[var(--shadow-border)]">
        <h2 className="font-display text-2xl tracking-wide">People</h2>
        <ul className="mt-3 flex flex-col gap-2">
          {staff.map((p) =>
            p ? (
              <li key={p.id}>
                <Link to="/p/$id" params={{ id: p.id }} className="flex items-center gap-2">
                  <Portrait person={p} size="sm" link={false} />
                  <span className="text-sm">{p.name}</span>
                </Link>
              </li>
            ) : null,
          )}
        </ul>
      </section>
      <section className="rounded-xl bg-cream p-4 shadow-[var(--shadow-border)]">
        <h2 className="font-display text-2xl tracking-wide">Projects</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {jobs.map((p) => (
            <li key={p.id}>
              <Link to="/proj/$id" params={{ id: p.id }} className="hover:underline">
                {p.name} · {p.when}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
