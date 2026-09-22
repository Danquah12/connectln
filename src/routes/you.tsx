import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { Portrait } from "@/components/portrait";
import { ThemePicker } from "@/components/theme-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { personById, useForge } from "@/lib/store";
import type { Availability, OpenTo } from "@/lib/types";

export const Route = createFileRoute("/you")({ component: YouPage });

const AVAIL: { id: Availability; label: string }[] = [
  { id: "open", label: "Open to calls" },
  { id: "on-job", label: "On a job" },
  { id: "booked", label: "Booked out" },
  { id: "not-looking", label: "Not looking" },
];

function YouPage() {
  const people = useForge((s) => s.people);
  const youId = useForge((s) => s.youId);
  const updateYou = useForge((s) => s.updateYou);
  const you = personById(people, youId);

  const [name, setName] = useState(you?.name ?? "");
  const [bio, setBio] = useState(you?.bio ?? "");
  const [rate, setRate] = useState(you?.rate ?? "");
  const [city, setCity] = useState(you?.city ?? "");
  const [reach, setReach] = useState(you?.reachEmail ?? "");
  const [travel, setTravel] = useState(String(you?.travelMiles ?? 0));
  const [availability, setAvailability] = useState<Availability>(you?.availability ?? "open");
  const [looking, setLooking] = useState(you?.openTo?.looking ?? "");
  const [where, setWhere] = useState(you?.openTo?.locations ?? "");
  const [when, setWhen] = useState(you?.openTo?.when ?? "");
  const [minRate, setMinRate] = useState(you?.openTo?.minRate ?? you?.rate ?? "");
  const [shift, setShift] = useState(you?.openTo?.shift ?? "");
  const [employment, setEmployment] = useState(you?.openTo?.employment ?? "");
  const [offers, setOffers] = useState((you?.offers ?? []).join(", "));
  const [needs, setNeeds] = useState((you?.needs ?? []).join(", "));

  if (!you) return null;

  return (
    <div className="flex flex-col gap-4">
      <header className="flex items-center gap-4">
        <label className="relative cursor-pointer">
          <Portrait person={you} size="xl" link={false} className="ring-4 ring-cream" />
          <input
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onload = () => {
                if (typeof reader.result === "string") updateYou({ photo: reader.result });
              };
              reader.readAsDataURL(file);
            }}
          />
        </label>
        <div>
          <h1 className="font-display text-4xl tracking-wide">Your card</h1>
          <p className="text-sm text-muted-foreground">
            This is what a superintendent, a charge nurse, or a principal sees before they call.
          </p>
          <Button variant="ink" size="sm" className="mt-2" asChild>
            <Link to="/reels" search={{ post: true }}>
              Make a reel
            </Link>
          </Button>
        </div>
      </header>

      <ThemePicker />

      <form
        className="rounded-xl bg-cream p-4 shadow-[var(--shadow-border)] sm:p-5"
        onSubmit={(e) => {
          e.preventDefault();
          updateYou({
            name: name.trim() || you.name,
            bio: bio.trim() || you.bio,
            rate: rate.trim() || undefined,
            city: city.trim() || you.city,
            reachEmail: reach.trim() || undefined,
            travelMiles: Number(travel) || 0,
            availability,
            offers: offers.split(",").map((s) => s.trim()).filter(Boolean),
            needs: needs.split(",").map((s) => s.trim()).filter(Boolean),
            openTo:
              availability === "open"
                ? ({
                    looking: looking.trim() || `${you.level} ${you.trade.toLowerCase()}`,
                    locations: where.trim() || [city, you.state].filter(Boolean).join(", "),
                    when: when.trim() || "Immediately",
                    minRate: minRate.trim() || rate.trim() || "Shop scale",
                    travel: `${Number(travel) || you.travelMiles} miles`,
                    shift: shift.trim() || "Day",
                    employment: employment.trim() || "Full-time / contract",
                  } satisfies OpenTo)
                : you.openTo,
          });
          toast("Card updated.");
        }}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label htmlFor="name">Name on the card</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
          </div>
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label htmlFor="bio">How you work</Label>
            <Textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="offers">I offer</Label>
            <Input id="offers" value={offers} onChange={(e) => setOffers(e.target.value)} placeholder="Hospital panel, weekend call" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="needs">I need</Label>
            <Input id="needs" value={needs} onChange={(e) => setNeeds(e.target.value)} placeholder="Apprentice, second on a TI" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="city">City</Label>
            <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="reach">Outside email (SMTP)</Label>
            <Input
              id="reach"
              type="email"
              value={reach}
              onChange={(e) => setReach(e.target.value)}
              placeholder="you@shop.com"
            />
            <p className="text-[11px] text-muted-foreground">
              Hall mail is always on ConnectLn. This address gets the SMTP copy when the desk has a host.
            </p>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="rate">Rate range</Label>
            <Input id="rate" value={rate} onChange={(e) => setRate(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="travel">Travel radius (miles)</Label>
            <Input
              id="travel"
              inputMode="numeric"
              value={travel}
              onChange={(e) => setTravel(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Availability</Label>
            <div className="flex flex-wrap gap-1.5">
              {AVAIL.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => setAvailability(a.id)}
                  className={
                    availability === a.id
                      ? "h-9 rounded-full bg-ink px-3 text-sm text-cream"
                      : "h-9 rounded-full bg-canvas px-3 text-sm text-muted-foreground"
                  }
                >
                  {a.label}
                </button>
              ))}
            </div>
          </div>
          {availability === "open" ? (
            <div className="sm:col-span-2 grid gap-3 rounded-lg bg-canvas p-3 sm:grid-cols-2">
              <p className="sm:col-span-2 text-xs text-muted-foreground">
                Open to calls is specific: calling, where, when, floor rate, miles, shift.
              </p>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="looking">Looking for</Label>
                <Input
                  id="looking"
                  value={looking}
                  onChange={(e) => setLooking(e.target.value)}
                  placeholder="Journeyman electrician"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="where">Where</Label>
                <Input
                  id="where"
                  value={where}
                  onChange={(e) => setWhere(e.target.value)}
                  placeholder="Baltimore / DC / 50 miles"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="when">When</Label>
                <Input id="when" value={when} onChange={(e) => setWhen(e.target.value)} placeholder="Immediately" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="minRate">Floor rate</Label>
                <Input
                  id="minRate"
                  value={minRate}
                  onChange={(e) => setMinRate(e.target.value)}
                  placeholder="$45/hr"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="shift">Shift</Label>
                <Input id="shift" value={shift} onChange={(e) => setShift(e.target.value)} placeholder="Day" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="employment">How you hire</Label>
                <Input
                  id="employment"
                  value={employment}
                  onChange={(e) => setEmployment(e.target.value)}
                  placeholder="Full-time / contract"
                />
              </div>
            </div>
          ) : null}
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          <Button type="submit">Save card</Button>
          <Button type="button" variant="outline" asChild>
            <Link to="/p/$id" params={{ id: you.id }}>
              View public card
            </Link>
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link to="/gigs">Gig mode</Link>
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link to="/become">What can I become?</Link>
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link to="/wallet">License desk</Link>
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link to="/card/$id" params={{ id: you.id }}>
              Identity card
            </Link>
          </Button>
        </div>
      </form>

      <BringCrew />

      <section className="rounded-xl bg-ink px-5 py-5 text-cream">
        <p className="font-display text-2xl tracking-wide">Why the card looks like this</p>
        <ul className="mt-3 space-y-2 text-sm text-cream/75">
          <li>School is optional. Who will vouch that you showed up is not.</li>
          <li>The wallet shows current, expiring, and lapsed tickets — with a scan if you have one.</li>
          <li>Calls pay in dollars, hours, and a start date. Raise a hand. No giant application.</li>
          <li>Veterans keep the MOS. Civilian language is a translation, not a replacement.</li>
        </ul>
      </section>
    </div>
  );
}

function BringCrew() {
  const inviteCrew = useForge((s) => s.inviteCrew);
  const crewInvites = useForge((s) => s.crewInvites);
  const [name, setName] = useState("");
  const [trade, setTrade] = useState("");

  return (
    <section className="rounded-xl bg-cream p-4 shadow-[var(--shadow-border)]">
      <h2 className="font-display text-2xl tracking-wide">Bring a third-year</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        They get the hall, the wallet, and a call board. You get a crew — not points.
      </p>
      <form
        className="mt-3 grid gap-3 sm:grid-cols-[1fr_10rem_auto]"
        onSubmit={(e) => {
          e.preventDefault();
          if (!name.trim()) return;
          inviteCrew(name, trade);
          const url = `${window.location.origin}/login?seat=member`;
          void navigator.clipboard?.writeText(url).catch(() => undefined);
          toast(`Invite for ${name.trim()} — hall link copied.`);
          setName("");
          setTrade("");
        }}
      >
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name on their card" />
        <Input value={trade} onChange={(e) => setTrade(e.target.value)} placeholder="Trade" />
        <Button type="submit">Invite</Button>
      </form>
      {crewInvites[0] ? (
        <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
          {crewInvites.slice(0, 4).map((c) => (
            <li key={c.at}>
              {c.name} · {c.trade} · waiting on the hall
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
