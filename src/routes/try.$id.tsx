import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { TicketPlate } from "@/components/ticket-plate";
import { listings as seedListings } from "@/lib/market-seed";
import { personById, useForge } from "@/lib/store";

export const Route = createFileRoute("/try/$id")({ component: TryPage });

function TryPage() {
  const { id } = Route.useParams();
  const extra = useForge((s) => s.extraListings);
  const listing = extra.find((l) => l.id === id) ?? seedListings.find((l) => l.id === id);
  const people = useForge((s) => s.people);
  const you = personById(people, useForge((s) => s.youId));
  const buyListing = useForge((s) => s.buyListing);
  if (!listing) return <p className="py-16 text-center text-sm text-muted-foreground">No demo.</p>;

  return (
    <div className="flex flex-col gap-4">
      <p className="text-[11px] uppercase text-muted-foreground">
        <Link to="/listing/$id" params={{ id: listing.id }} className="hover:text-ink">
          {listing.title}
        </Link>{" "}
        · live demo
      </p>
      <h1 className="font-display text-4xl tracking-wide">Try {listing.title}</h1>
      <p className="text-sm text-muted-foreground">{listing.blurb}</p>

      {listing.id === "l-wallet" && you ? (
        <section className="rounded-xl bg-cream p-4 shadow-[var(--shadow-border)]">
          <p className="text-xs tracking-wide text-muted-foreground uppercase">Your tickets — what lapses</p>
          <div className="mt-3 flex gap-2 overflow-x-auto">
            {you.tickets.map((t) => (
              <TicketPlate key={t.id} ticket={t} />
            ))}
          </div>
        </section>
      ) : null}

      {listing.id === "l-osha-quiz" ? (
        <p className="text-sm">
          The drill is the same board as{" "}
          <Link to="/challenges" className="text-brick hover:underline">
            Challenges
          </Link>
          . Pass it, it writes to the passport.
        </p>
      ) : null}

      {listing.id === "l-shift" ? (
        <ul className="rounded-xl bg-cream p-4 text-sm shadow-[var(--shadow-border)]">
          <li>RN — Night · Sept 18 · Baltimore · $52/hr</li>
          <li className="mt-2">RN — Weekend · Sept 20–21 · $60/hr</li>
        </ul>
      ) : null}

      {listing.liveUrl ? (
        <section className="rounded-xl bg-ink px-5 py-5 text-cream">
          <p className="font-display text-2xl tracking-wide">This one already ships</p>
          <p className="mt-2 text-sm text-cream/75">
            The demo is the live app. Open it. If it holds, buy a seat.
          </p>
          <a
            href={listing.liveUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-flex h-11 items-center rounded-md bg-brick px-4 text-sm font-medium text-cream"
          >
            Open live app
          </a>
        </section>
      ) : listing.id.startsWith("listed-") ? (
        <section className="rounded-xl bg-ink px-5 py-5 text-cream">
          <p className="font-display text-2xl tracking-wide">Just listed</p>
          <p className="mt-2 text-sm text-cream/75">
            This is the working demo: a shop opens it, sees the pitch, and decides. No login tutorial.
          </p>
        </section>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Button
          variant="ink"
          onClick={() => {
            buyListing(listing.id);
            toast("Seat on your card.");
          }}
        >
          Buy now · {listing.price}
        </Button>
        <Button variant="outline" asChild>
          <Link to="/listing/$id" params={{ id: listing.id }}>
            Back to product
          </Link>
        </Button>
      </div>
    </div>
  );
}
