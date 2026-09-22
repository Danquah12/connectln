import { createFileRoute, Link } from "@tanstack/react-router";
import { projects } from "@/lib/seed";

export const Route = createFileRoute("/projects")({ component: ProjectsPage });

function ProjectsPage() {
  return (
    <div className="flex flex-col gap-4">
      <header>
        <h1 className="font-display text-4xl tracking-wide">Projects</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Crews, not logos. Who was actually on the floor.
        </p>
      </header>
      <ul className="flex flex-col gap-3">
        {projects.map((p) => (
          <li key={p.id}>
            <Link
              to="/proj/$id"
              params={{ id: p.id }}
              className="block overflow-hidden rounded-xl bg-cream shadow-[var(--shadow-border)]"
            >
              {p.photo ? (
                <img src={p.photo} alt="" className="aspect-[5/2] w-full object-cover" />
              ) : null}
              <div className="p-4">
                <p className="font-medium">{p.name}</p>
                <p className="text-sm text-muted-foreground">
                  {p.shop} · {p.city} · {p.when} · {p.memberIds.length} on the crew
                </p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
