import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { hostedOn } from "@/lib/live-url";
import { listings as seedListings } from "@/lib/market-seed";
import { personById, useForge } from "@/lib/store";

export const Route = createFileRoute("/listing/$id")({ component: ListingPage });

function ListingPage() {
  const { id } = Route.useParams();
  const extra = useForge((s) => s.extraListings);
  const listing = extra.find((l) => l.id === id) ?? seedListings.find((l) => l.id === id);
  const people = useForge((s) => s.people);
  const bought = useForge((s) => s.bought);
  const buyListing = useForge((s) => s.buyListing);
  const startThread = useForge((s) => s.startThread);
  if (!listing) return <p className="py-16 text-center text-sm text-muted-foreground">No listing.</p>;
  const seller = personById(people, listing.sellerId);
  const own = bought.includes(listing.id);
  const software = listing.kind === "software";

  return (
    <div className="flex flex-col gap-4">
      <img src={listing.photo} alt="" className="aspect-[5/2] w-full rounded-xl object-cover" />
      <header>
        <p className="text-[11px] uppercase text-muted-foreground">
          <Link to="/market" className="hover:text-ink">
            Market
          </Link>
          {software ? " · Developer" : ""}
        </p>
        <h1 className="font-display text-4xl tracking-wide">{listing.title}</h1>
        <p className="text-sm text-muted-foreground">
          {listing.price}
          {listing.rating ? ` · ${listing.rating.toFixed(1)}` : " · new"}
          {listing.views != null ? ` · ${listing.views.toLocaleString()} views` : ""}
          {listing.downloads != null ? ` · ${listing.downloads.toLocaleString()} installs` : ""}
        </p>
      </header>
      <p className="text-sm leading-relaxed">{listing.blurb}</p>
      {listing.stack?.length ? (
        <p className="text-xs text-muted-foreground">Stack: {listing.stack.join(" · ")}</p>
      ) : null}
      {listing.docs ? <p className="text-sm text-muted-foreground">{listing.docs}</p> : null}
      {listing.screenshots?.length ? (
        <div className="flex gap-2 overflow-x-auto">
          {listing.screenshots.map((src) => (
            <img key={src} src={src} alt="" className="h-28 rounded-lg object-cover" />
          ))}
        </div>
      ) : null}
      {seller ? (
        <p className="text-sm">
          {software ? "Developer" : "Seller"}:{" "}
          <Link to="/p/$id" params={{ id: seller.id }} className="text-brick hover:underline">
            {seller.name}
          </Link>
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <Button
          variant="ink"
          disabled={own}
          onClick={() => {
            buyListing(listing.id);
            toast(software ? "Seat on your card." : listing.kind === "physical" ? "Held. Arrange pickup on the job." : "It's on your card.");
          }}
        >
          {own ? "On your card" : software ? "Buy now" : "Take it"}
        </Button>
        {listing.liveUrl ? (
          <Button variant="ink" asChild>
            <a href={listing.liveUrl} target="_blank" rel="noreferrer">
              Open live app{hostedOn(listing.liveUrl) ? ` · ${hostedOn(listing.liveUrl)}` : ""}
            </a>
          </Button>
        ) : null}
        {listing.demo && !listing.liveUrl ? (
          <Button variant="outline" asChild>
            <Link to="/try/$id" params={{ id: listing.id }}>
              Try demo
            </Link>
          </Button>
        ) : null}
        {seller ? (
          <Button
            variant="outline"
            onClick={() => {
              startThread(seller.id, `About ${listing.title} — need this on a job.`);
              toast("Thread opened.");
            }}
          >
            Hire the builder
          </Button>
        ) : null}
      </div>
      {listing.reviews?.length ? (
        <section className="rounded-xl bg-cream p-4 shadow-[var(--shadow-border)]">
          <h2 className="font-display text-2xl tracking-wide">From people who used it</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {listing.reviews.map((r) => (
              <li key={r.by}>
                <span className="font-medium">{r.by}</span>
                <span className="text-muted-foreground"> · {r.stars}/5 — {r.body}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
