import { createFileRoute, Link } from "@tanstack/react-router";
import { personById, useForge } from "@/lib/store";

export const Route = createFileRoute("/scope")({
  component: ScopePage,
});

function ScopePage() {
  const people = useForge((s) => s.people);
  const you = personById(people, useForge((s) => s.youId));
  const savedPeople = useForge((s) => s.savedPersonIds);
  const savedCalls = useForge((s) => s.savedCallIds);
  const savedPosts = useForge((s) => s.savedPostIds);

  const rows = [
    { title: "People on your hall", detail: `${savedPeople.length} taken`, to: "/people" as const },
    { title: "Seats you saved", detail: `${savedCalls.length} calls`, to: "/calls" as const },
    { title: "Talk you kept", detail: `${savedPosts.length} posts`, to: "/" as const },
    { title: "Learn", detail: "Courses sit here, not in shop talk", to: "/learn" as const },
  ];

  return (
    <div className="flex flex-col gap-4">
      <header>
        <p className="text-[11px] font-medium tracking-[0.16em] text-muted-foreground uppercase">Your bench</p>
        <h1 className="font-display text-4xl tracking-wide">Scope</h1>
        <p className="mt-1 max-w-xl text-sm text-muted-foreground">
          What you keep: people, seats, and talk. The card is still yours
          {you ? `, ${you.name}` : ""}.
        </p>
      </header>
      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {rows.map((row) => (
          <li key={row.title}>
            <Link
              to={row.to}
              className="block rounded-xl bg-cream p-4 shadow-[var(--shadow-border)] hover:shadow-[var(--shadow-border-hover)]"
            >
              <p className="font-display text-2xl tracking-wide">{row.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{row.detail}</p>
            </Link>
          </li>
        ))}
      </ul>
      {you ? (
        <Link to="/you" className="text-sm text-brick hover:underline">
          Open your card
        </Link>
      ) : null}
    </div>
  );
}
