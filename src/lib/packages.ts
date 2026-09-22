export type PackId = "card" | "ticket" | "shop" | "stall";

export type Pack = {
  id: PackId;
  name: string;
  who: string;
  price: string;
  blurb: string;
  gets: string[];
  href: "/you" | "/wallet" | "/calls" | "/market";
  hrefLabel: string;
  paid: boolean;
};

export const PACKS: Pack[] = [
  {
    id: "card",
    name: "Card",
    who: "Every person",
    price: "Free",
    blurb: "The passport. Always free. Shops pay. Workers do not.",
    gets: ["Professional passport", "Send a line", "Vouches", "Apply to calls"],
    href: "/you",
    hrefLabel: "Your card",
    paid: false,
  },
  {
    id: "ticket",
    name: "Ticket check",
    who: "The person, or the shop that needs it",
    price: "$12 / year",
    blurb: "A license marked verified — issuer, number, expiry. You pay, or the shop covers it for a hire.",
    gets: ["Verified on the card", "Required to be hired", "Expiry on the 60-day desk", "Shop can cover $12"],
    href: "/wallet",
    hrefLabel: "License desk",
    paid: true,
  },
  {
    id: "shop",
    name: "Shop board",
    who: "Shop, hospital, school, GC",
    price: "$79 / month",
    blurb: "Post a real call. Find crew. Hire. Shops pay. Workers do not. Each call bills a seat. A hire writes a fill receipt.",
    gets: [
      "Post calls — $149 seat, $299 SOS",
      "Hire — $250 fill receipt to Expedite Consults LLC",
      "Find crew",
      "60-day ticket watch",
      "One shop seat",
    ],
    href: "/calls",
    hrefLabel: "Calls",
    paid: true,
  },
  {
    id: "stall",
    name: "Stall",
    who: "Anyone selling on Market",
    price: "12% of the sale",
    blurb: "List notes, tools, hours, software. No monthly fee. We take a cut when it sells.",
    gets: ["One listing", "No monthly fee", "Paid when it sells"],
    href: "/market",
    hrefLabel: "Market",
    paid: true,
  },
];
