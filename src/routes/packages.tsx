import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PACKS, type PackId } from "@/lib/packages";
import { HOUSE_BILL, TAKE, takeLabel } from "@/lib/money";
import { personById, useForge } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/packages")({ component: PackagesPage });

function PackagesPage() {
  const youId = useForge((s) => s.youId);
  const you = personById(useForge((s) => s.people), youId);
  const asks = useForge((s) => s.packageAsks);
  const askPackage = useForge((s) => s.askPackage);
  const buyShopSeat = useForge((s) => s.buyShopSeat);
  const ledger = useForge((s) => s.ledger);
  const shopSeats = useForge((s) => s.shopSeats);
  const ticketSeats = useForge((s) => s.ticketSeats);
  const hasShop = shopSeats.includes(youId);
  const hasTicket = ticketSeats.includes(youId);

  function ask(id: PackId) {
    if (!you) {
      toast("Sign in so the desk knows who is asking.");
      return;
    }
    askPackage(id);
    toast("The desk has your ask. No charge yet.");
  }

  function billShop() {
    if (!you) {
      toast("Sign in so the shop seat is yours.");
      return;
    }
    buyShopSeat();
    toast(`Billed ${HOUSE_BILL} · $${TAKE.shop}. Shop board is on.`);
  }

  return (
    <div className="flex flex-col gap-4">
      <header className="rounded-xl bg-ink px-5 py-6 text-cream">
        <p className="text-[11px] font-medium tracking-[0.16em] text-cream/50 uppercase">Hall packages</p>
        <h1 className="mt-1 font-display text-4xl tracking-wide">What we sell</h1>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-cream/70">
          Four things. The card stays free. Shop board is the paid seat — post, find, hire.
          Ticket can be checked. Stall takes a cut when it sells. Shops pay {HOUSE_BILL}.
        </p>
      </header>

      <ul className="grid gap-3 sm:grid-cols-2">
        {PACKS.map((pack) => {
          const asked = asks.some((a) => a.pack === pack.id && a.fromId === youId);
          const held = (pack.id === "shop" && hasShop) || (pack.id === "ticket" && hasTicket);
          return (
            <li
              key={pack.id}
              className={cn(
                "flex flex-col rounded-xl p-5 shadow-[var(--shadow-border)]",
                pack.id === "shop" ? "bg-ink text-cream sm:col-span-2" : "bg-cream",
              )}
            >
              <p
                className={cn(
                  "text-[11px] font-medium tracking-wide uppercase",
                  pack.id === "shop" ? "text-cream/50" : "text-muted-foreground",
                )}
              >
                {pack.who}
              </p>
              <div className="mt-1 flex items-baseline justify-between gap-3">
                <h2 className="font-display text-3xl tracking-wide">{pack.name}</h2>
                <p className="font-display text-xl tracking-wide tabular-nums">{pack.price}</p>
              </div>
              <p
                className={cn(
                  "mt-2 text-sm leading-relaxed",
                  pack.id === "shop" ? "text-cream/75" : "text-muted-foreground",
                )}
              >
                {pack.blurb}
              </p>
              <ul className="mt-4 space-y-1.5 text-sm">
                {pack.gets.map((g) => (
                  <li key={g}>{g}</li>
                ))}
              </ul>
              <div className="mt-5 flex flex-wrap gap-2">
                {pack.paid ? (
                  held ? (
                    <Button variant={pack.id === "shop" ? "cream" : "ink"} asChild>
                      <Link to={pack.href}>
                        {pack.id === "shop" ? "On your card · post a call" : "On your card · license desk"}
                      </Link>
                    </Button>
                  ) : (
                    <Button
                      variant={pack.id === "shop" ? "cream" : "ink"}
                      disabled={asked}
                      onClick={() => (pack.id === "shop" ? billShop() : ask(pack.id))}
                    >
                      {pack.id === "shop"
                        ? `Bill $${TAKE.shop} · ${HOUSE_BILL}`
                        : asked
                          ? "Asked — wait on the desk"
                          : "Ask the desk"}
                    </Button>
                  )
                ) : (
                  <Button variant="ink" asChild>
                    <Link to={pack.href}>{pack.hrefLabel}</Link>
                  </Button>
                )}
                {pack.paid ? (
                  <Button
                    variant="outline"
                    className={pack.id === "shop" ? "border-cream/20 bg-transparent text-cream" : undefined}
                    asChild
                  >
                    <Link to={pack.href}>{pack.hrefLabel}</Link>
                  </Button>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>

      <section className="rounded-xl bg-cream p-4 shadow-[var(--shadow-border)]">
        <h2 className="font-display text-2xl tracking-wide">Take</h2>
        <p className="text-xs text-muted-foreground">
          {HOUSE_BILL}. Shop ${TAKE.shop}/mo · call ${TAKE.listing} · SOS ${TAKE.urgent} · fill ${TAKE.fill}.
        </p>
        {ledger.filter((l) => l.shopId === youId).length ? (
          <ul className="mt-3 space-y-2 text-sm">
            {ledger
              .filter((l) => l.shopId === youId)
              .slice(0, 8)
              .map((l) => (
                <li key={l.id} className="flex justify-between gap-2 rounded-lg bg-canvas px-3 py-2">
                  <span>
                    {takeLabel(l.kind)} · {l.label}
                  </span>
                  <span className="tabular-nums">${l.gross}</span>
                </li>
              ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">No bills yet. Take a shop seat to post.</p>
        )}
      </section>

      <p className="text-xs text-muted-foreground">
        Simulated bill — no card numbers here. Workers raise a hand free.
      </p>
    </div>
  );
}
