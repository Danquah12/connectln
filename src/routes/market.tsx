import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { hostedOn, liveHref } from "@/lib/live-url";
import { listings as seedListings } from "@/lib/market-seed";
import { personById, useForge } from "@/lib/store";
import type { ListingKind } from "@/lib/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/market")({ component: MarketPage });

const KINDS: { id: "all" | ListingKind; label: string }[] = [
  { id: "all", label: "All" },
  { id: "software", label: "Developer" },
  { id: "course", label: "Education" },
  { id: "guide", label: "Guides" },
  { id: "physical", label: "Tools / physical" },
  { id: "service", label: "Services" },
];

function MarketPage() {
  const extra = useForge((s) => s.extraListings);
  const publishListing = useForge((s) => s.publishListing);
  const you = personById(useForge((s) => s.people), useForge((s) => s.youId));
  const [kind, setKind] = useState<(typeof KINDS)[number]["id"]>("all");
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [blurb, setBlurb] = useState("");
  const [url, setUrl] = useState("");
  const [stack, setStack] = useState("");
  const catalog = useMemo(() => [...extra, ...seedListings], [extra]);
  const pulled = useForge((s) => s.pulledListings);
  const marketOn = useForge((s) => s.flags.market);
  const visible = (kind === "all" ? catalog : catalog.filter((l) => l.kind === kind)).filter(
    (l) => !pulled.includes(l.id),
  );
  const parsed = liveHref(url);

  return (
    <div className="flex flex-col gap-4">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-4xl tracking-wide">Market</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Notes, tools, hours — and software a shop will actually open. Already on Vercel? List it here. The URL is the demo.{" "}
            <Link to="/packages" className="text-brick hover:underline">
              Hall packages
            </Link>
            — stall is 12%.
          </p>
        </div>
        <Button
          variant="ink"
          onClick={() => {
            setOpen((v) => !v);
            setKind("software");
          }}
        >
          {open ? "Close" : "List software"}
        </Button>
      </header>

      {!marketOn ? (
        <p className="rounded-xl bg-cream px-4 py-3 text-sm shadow-[var(--shadow-border)]">
          Aisle closed from the desk. Flags → Market.
        </p>
      ) : null}

      {open && you ? (
        <form
          className="rounded-xl bg-cream p-4 shadow-[var(--shadow-border)]"
          onSubmit={(e) => {
            e.preventDefault();
            if (!title.trim()) return;
            const live = liveHref(url);
            const id = `listed-${Date.now().toString(36)}`;
            publishListing({
              id,
              title: title.trim(),
              kind: "software",
              sellerId: you.id,
              price: price.trim() || "Contact",
              photo: you.cover || "/sites/panel.jpg",
              blurb: blurb.trim() || "A tool for this board. Demo is the live app.",
              rating: 0,
              demo: Boolean(live),
              views: 0,
              downloads: 0,
              stack: stack
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean)
                .slice(0, 6),
              docs: live
                ? `Live demo: ${live}`
                : "Just listed. Paste a Vercel URL so shops can open it.",
              liveUrl: live,
            });
            setTitle("");
            setPrice("");
            setBlurb("");
            setUrl("");
            setStack("");
            setOpen(false);
            setKind("software");
            toast(live ? "On the developer aisle. The Vercel URL is the demo." : "On the developer aisle.");
          }}
        >
          <h2 className="font-display text-2xl tracking-wide">Advertise software</h2>
          <p className="text-xs text-muted-foreground">
            If it already runs on Vercel, paste the URL. Shops open that — not a pitch deck.
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Product name" required />
            <Input value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Price — $29 / shop seat" />
          </div>
          <Input
            className="mt-3"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://your-app.vercel.app"
            inputMode="url"
            autoComplete="url"
          />
          {url.trim() && !parsed ? (
            <p className="mt-1 text-xs text-brick">Needs a real http(s) URL — vercel.app is fine.</p>
          ) : parsed ? (
            <p className="mt-1 text-xs text-muted-foreground">{hostedOn(parsed) || "Live demo"} · {parsed}</p>
          ) : (
            <p className="mt-1 text-xs text-muted-foreground">Production URL from Vercel. Preview deploys work too.</p>
          )}
          <Input
            className="mt-3"
            value={stack}
            onChange={(e) => setStack(e.target.value)}
            placeholder="Stack — React, Postgres, Stripe"
          />
          <Textarea
            className="mt-3"
            value={blurb}
            onChange={(e) => setBlurb(e.target.value)}
            placeholder="What it does on a Monday morning."
          />
          <Button className="mt-3" type="submit" disabled={!title.trim()}>
            Publish on the market
          </Button>
        </form>
      ) : null}

      <div className="flex flex-wrap gap-1.5">
        {KINDS.map((k) => (
          <button
            key={k.id}
            type="button"
            onClick={() => setKind(k.id)}
            className={cn(
              "h-9 rounded-full px-3 text-sm",
              kind === k.id ? "bg-ink text-cream" : "bg-cream text-muted-foreground",
            )}
          >
            {k.label}
          </button>
        ))}
      </div>
      <ul className="grid gap-3 sm:grid-cols-2">
        {visible.map((l) => (
          <li key={l.id}>
            <Link
              to="/listing/$id"
              params={{ id: l.id }}
              className="block overflow-hidden rounded-xl bg-cream shadow-[var(--shadow-border)]"
            >
              <img src={l.photo} alt="" className="aspect-[5/2] w-full object-cover" />
              <div className="p-3">
                <p className="text-sm font-medium">{l.title}</p>
                <p className="text-xs text-muted-foreground">
                  {l.price} · {l.rating ? l.rating.toFixed(1) : "new"} · {l.kind}
                  {l.kind === "software" && l.downloads != null ? ` · ${l.downloads} installs` : ""}
                </p>
                {l.liveUrl ? (
                  <p className="mt-1 text-[11px] text-brick">{hostedOn(l.liveUrl) || "Live demo"}</p>
                ) : null}
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
