import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { funds } from "@/lib/hall-seed";
import { personById, useForge } from "@/lib/store";

export const Route = createFileRoute("/fund")({ component: FundPage });

function FundPage() {
  const people = useForge((s) => s.people);
  const you = personById(people, useForge((s) => s.youId));
  const claimed = useForge((s) => s.claimedFundIds);
  const claimFund = useForge((s) => s.claimFund);
  const yours = you ? funds.filter((f) => f.trades.includes(you.trade) || (you.veteran && f.kind === "gi-bill")) : funds;
  const rest = funds.filter((f) => !yours.includes(f));

  return (
    <div className="flex flex-col gap-4">
      <header>
        <h1 className="font-display text-4xl tracking-wide">Money that sits a class</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          GI Bill seats, stipends, CE that a shop actually reimburses. Not a scholarship mill.
        </p>
      </header>
      <Block
        title="Matches your card"
        rows={yours}
        claimed={claimed}
        onClaim={(id, title) => {
          claimFund(id);
          toast(`Claim started · ${title}`);
        }}
      />
      {rest.length ? (
        <Block
          title="Other halls"
          rows={rest}
          claimed={claimed}
          onClaim={(id, title) => {
            claimFund(id);
            toast(`Claim started · ${title}`);
          }}
        />
      ) : null}
      <p className="text-xs text-muted-foreground">
        Then sit it on{" "}
        <Link to="/events" className="text-brick hover:underline">
          Events
        </Link>{" "}
        or{" "}
        <Link to="/learn" className="text-brick hover:underline">
          Learn
        </Link>
        .
      </p>
    </div>
  );
}

function Block({
  title,
  rows,
  claimed,
  onClaim,
}: {
  title: string;
  rows: typeof funds;
  claimed: string[];
  onClaim: (id: string, title: string) => void;
}) {
  return (
    <section className="rounded-xl bg-cream p-4 shadow-[var(--shadow-border)]">
      <h2 className="font-display text-2xl tracking-wide">{title}</h2>
      <ul className="mt-3 space-y-3">
        {rows.map((f) => {
          const on = claimed.includes(f.id);
          return (
            <li key={f.id} className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium">{f.title}</p>
                <p className="text-xs text-muted-foreground">
                  {f.who} · {f.kind} · {f.trades.join(", ")}
                </p>
                <p className="mt-1 text-sm">{f.blurb}</p>
              </div>
              <Button
                variant={on ? "ink" : "outline"}
                size="sm"
                disabled={on}
                onClick={() => onClaim(f.id, f.title)}
              >
                {on ? "Claimed" : "Claim"}
              </Button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
