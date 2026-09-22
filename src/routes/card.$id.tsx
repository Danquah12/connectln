import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { IdentityCard } from "@/components/identity-card";
import { QrMark } from "@/components/qr-mark";
import { Button } from "@/components/ui/button";
import { personById, useForge } from "@/lib/store";
import type { CardLayout } from "@/lib/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/card/$id")({ component: CardPage });

const LAYOUTS: { id: CardLayout; label: string; blurb: string }[] = [
  { id: "shop", label: "Shop", blurb: "Ink card. Name on cream type, never on the photo." },
  { id: "plate", label: "Plate", blurb: "Paper card. Name labeled at the top of the type." },
  { id: "ticket", label: "Ticket", blurb: "Wallet size. Name left of the QR." },
];

function CardPage() {
  const { id } = Route.useParams();
  const people = useForge((s) => s.people);
  const vouches = useForge((s) => s.vouches);
  const person = personById(people, id);
  const layout = useForge((s) => s.cardLayout);
  const setCardLayout = useForge((s) => s.setCardLayout);

  if (!person) {
    return <p className="py-16 text-center text-sm text-muted-foreground">No card on file.</p>;
  }

  return (
    <div className="mx-auto flex max-w-md flex-col gap-4">
      <header>
        <h1 className="font-display text-4xl tracking-wide">Identity card</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Name sits in its own field — labeled Name — not on the picture. Screenshot for a wallet or a resume.
        </p>
      </header>

      <div className="flex flex-wrap gap-1.5">
        {LAYOUTS.map((l) => (
          <button
            key={l.id}
            type="button"
            onClick={() => setCardLayout(l.id)}
            className={cn(
              "h-9 rounded-full px-3.5 text-sm",
              layout === l.id ? "bg-ink text-cream" : "bg-cream text-muted-foreground",
            )}
          >
            {l.label}
          </button>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">{LAYOUTS.find((l) => l.id === layout)?.blurb}</p>

      <IdentityCard person={person} vouches={vouches} share layout={layout} />

      {layout !== "ticket" ? (
        <div className="flex justify-center">
          <QrMark seed={person.id} label="Scan to verify tickets" />
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Button
          variant="ink"
          onClick={() => {
            const url = `${window.location.origin}/p/${person.id}`;
            void navigator.clipboard.writeText(url);
            toast("Profile link copied.");
          }}
        >
          Copy profile link
        </Button>
        <Button variant="outline" asChild>
          <Link to="/p/$id" params={{ id: person.id }}>
            Open profile
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link to="/you">Name on the card</Link>
        </Button>
      </div>
    </div>
  );
}
