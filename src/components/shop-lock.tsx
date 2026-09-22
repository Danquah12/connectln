import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { useForge } from "@/lib/store";

export function useShopSeat() {
  const youId = useForge((s) => s.youId);
  const seats = useForge((s) => s.shopSeats);
  return seats.includes(youId);
}

export function ShopLock({ action }: { action: string }) {
  return (
    <section className="rounded-xl bg-ink px-5 py-5 text-cream">
      <p className="text-[11px] tracking-wide text-cream/55 uppercase">Shop board · $79/month</p>
      <p className="mt-1 font-display text-2xl tracking-wide">{action}</p>
      <p className="mt-2 text-sm text-cream/75">
        Post $149 · SOS $299 · hire writes a $250 fill receipt. Passport stays free. Raise a hand stays free. Shops pay Expedite Consults LLC.
      </p>
      <Button className="mt-4" variant="cream" asChild>
        <Link to="/packages">Bill the shop seat</Link>
      </Button>
    </section>
  );
}
