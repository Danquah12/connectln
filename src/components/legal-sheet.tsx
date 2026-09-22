import { Link } from "@tanstack/react-router";
import { Mark } from "@/components/mark";
import { TERMS, PRIVACY } from "@/lib/legal";

export function LegalSheet({ kind }: { kind: "terms" | "privacy" }) {
  const blocks = kind === "terms" ? TERMS : PRIVACY;
  const title = kind === "terms" ? "Terms" : "Privacy";
  const kicker = kind === "terms" ? "The door" : "What we keep";
  return (
    <div className="flex flex-col gap-4">
      <header className="rounded-xl bg-ink px-5 py-6 text-cream">
        <p className="text-[11px] font-medium tracking-[0.16em] text-cream/50 uppercase">{kicker}</p>
        <h1 className="mt-1 font-display text-4xl tracking-wide">{title}</h1>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-cream/70">
          ConnectLn. Tickets, vouches, and real work. Not legal theater — what this hall actually does.
        </p>
      </header>
      <ol className="flex flex-col gap-3">
        {blocks.map((b) => (
          <li key={b.title} className="rounded-xl bg-cream p-5 shadow-[var(--shadow-border)]">
            <h2 className="font-display text-2xl tracking-wide">{b.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-ink/90">{b.body}</p>
          </li>
        ))}
      </ol>
      <p className="text-sm text-muted-foreground">
        <Link to={kind === "terms" ? "/privacy" : "/terms"} className="text-brick hover:underline">
          {kind === "terms" ? "Privacy" : "Terms"}
        </Link>
        {" · "}
        <Link to="/login" search={{ seat: "member" }} className="hover:underline">
          Sign in
        </Link>
      </p>
      <p className="flex items-center gap-2 text-xs text-muted-foreground">
        <Mark className="size-5" /> ConnectLn
      </p>
    </div>
  );
}
