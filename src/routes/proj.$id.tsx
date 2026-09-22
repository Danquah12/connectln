import { createFileRoute, Link } from "@tanstack/react-router";
import { Portrait } from "@/components/portrait";
import { projects } from "@/lib/seed";
import { personById, useForge } from "@/lib/store";

export const Route = createFileRoute("/proj/$id")({ component: ProjectPage });

function ProjectPage() {
  const { id } = Route.useParams();
  const people = useForge((s) => s.people);
  const project = projects.find((p) => p.id === id);
  if (!project) return <p className="py-16 text-center text-sm text-muted-foreground">No project.</p>;
  const crew = project.memberIds.map((i) => personById(people, i)).filter(Boolean);

  return (
    <div className="flex flex-col gap-4">
      {project.photo ? (
        <img src={project.photo} alt="" className="aspect-[5/2] w-full rounded-xl object-cover" />
      ) : null}
      <header>
        <p className="text-[11px] uppercase text-muted-foreground">
          <Link to="/projects" className="hover:text-ink">
            Projects
          </Link>
        </p>
        <h1 className="font-display text-4xl tracking-wide">{project.name}</h1>
        <p className="text-sm text-muted-foreground">
          {project.shop} · {project.city} · {project.when}
        </p>
      </header>
      <section className="rounded-xl bg-cream p-4 shadow-[var(--shadow-border)]">
        <h2 className="font-display text-2xl tracking-wide">Who worked with who</h2>
        <ul className="mt-3 flex flex-col gap-2">
          {crew.map((p) =>
            p ? (
              <li key={p.id}>
                <Link to="/p/$id" params={{ id: p.id }} className="flex items-center gap-3">
                  <Portrait person={p} size="sm" link={false} />
                  <span className="text-sm">
                    {p.name} · {p.trade}
                  </span>
                </Link>
              </li>
            ) : null,
          )}
        </ul>
      </section>
    </div>
  );
}
