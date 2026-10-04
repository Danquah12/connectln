import { funds, meets } from "./hall-seed";
import { seedLectures } from "./lecture-seed";
import { listings as seedListings } from "./market-seed";
import { guilds, shops, TRADES } from "./seed";
import { indexCalls, queryCallIndex } from "./contract-index";
import type { CrewCall, Listing, Person, Post, Trade } from "./types";

export type HitKind =
  | "call"
  | "post"
  | "person"
  | "shop"
  | "listing"
  | "event"
  | "fund"
  | "circle"
  | "talk";

export type Hit = {
  kind: HitKind;
  id: string;
  title: string;
  blurb: string;
  photo?: string;
  score: number;
  meta?: string;
};

function rows<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function names(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (typeof item === "string") return item;
      if (item && typeof item === "object" && "name" in item) return String((item as { name?: unknown }).name ?? "");
      return "";
    })
    .filter(Boolean);
}

function hay(...parts: unknown[]) {
  return parts
    .flatMap((part) => (Array.isArray(part) ? part : [part]))
    .filter((part) => typeof part === "string" && part.trim())
    .join(" ")
    .toLowerCase();
}

function score(text: string, tokens: string[]) {
  if (!tokens.length) return 0;
  let n = 0;
  for (const t of tokens) {
    if (!t) continue;
    if (text.includes(t)) n += t.length > 3 ? 3 : 2;
  }
  return n;
}

const STATE_NAME: Record<string, string> = {
  AL: "alabama", AK: "alaska", AZ: "arizona", AR: "arkansas", CA: "california", CO: "colorado",
  CT: "connecticut", DE: "delaware", FL: "florida", GA: "georgia", HI: "hawaii", ID: "idaho",
  IL: "illinois", IN: "indiana", IA: "iowa", KS: "kansas", KY: "kentucky", LA: "louisiana",
  ME: "maine", MD: "maryland", MA: "massachusetts", MI: "michigan", MN: "minnesota", MS: "mississippi",
  MO: "missouri", MT: "montana", NE: "nebraska", NV: "nevada", NH: "new hampshire", NJ: "new jersey",
  NM: "new mexico", NY: "new york", NC: "north carolina", ND: "north dakota", OH: "ohio", OK: "oklahoma",
  OR: "oregon", PA: "pennsylvania", RI: "rhode island", SC: "south carolina", SD: "south dakota",
  TN: "tennessee", TX: "texas", UT: "utah", VT: "vermont", VA: "virginia", WA: "washington",
  WV: "west virginia", WI: "wisconsin", WY: "wyoming", DC: "district of columbia",
};

const TRADE_ALIAS: [RegExp, Trade][] = [
  [/\b(pharmd|rph|pharmacist|pharmacy)\b/, "Pharmacist"],
  [/\b(rn|lpn|bsn|msn|nurse|nursing)\b/, "Nurse"],
  [/\b(physician|doctor|md|do|locums)\b/, "Physician"],
  [/\b(hvac|nate)\b/, "HVAC"],
  [/\b(electrician|journeyman|jw)\b/, "Electrician"],
  [/\b(dental hygienist|hygienist)\b/, "Dental hygienist"],
  [/\b(respiratory|rrt)\b/, "Respiratory therapist"],
  [/\b(paramedic|emt)\b/, "Paramedic"],
  [/\b(dentist|dds)\b/, "Dentist"],
  [/\b(therapist|lcsw)\b/, "Therapist"],
  [/\b(teacher|faculty|classroom)\b/, "Teacher"],
];

function askedTrade(query: string): Trade | undefined {
  for (const [re, trade] of TRADE_ALIAS) if (re.test(query)) return trade;
  return TRADES.find((trade) => query.includes(trade.toLowerCase()));
}

const CALL_HINT = /\b(job|jobs|call|calls|contract|contracts|hiring|gig|gigs|shift|shifts|work)\b/;

export function searchBoard(
  q: string,
  people: Person[],
  posts: Post[],
  calls: CrewCall[],
  extraListings: Listing[],
  pulledListings: string[] = [],
  preferTrade?: Person["trade"],
): Hit[] {
  const query = q.trim().toLowerCase();
  const tokens = query.split(/\s+/).filter((t) => t.length > 1 && t !== "—");
  const asked = askedTrade(query);
  const hits: Hit[] = [];
  const callBoost = CALL_HINT.test(query) ? 4 : 0;
  const callHits = queryCallIndex(query, indexCalls(rows(calls)));
  const callById = new Map(rows<CrewCall>(calls).map((c) => [c.id, c]));
  if (callHits.length) {
    for (const h of callHits) {
      const c = callById.get(h.id);
      if (!c) continue;
      if (asked && c.trade !== asked) continue;
      hits.push({
        kind: "call",
        id: c.id,
        title: c.title,
        blurb: `${c.shop} · ${c.city}, ${c.state} · ${c.rate}`,
        photo: c.photo,
        score: h.score + callBoost,
        meta: `${names(c.tickets).slice(0, 3).join(" · ")}${h.matched.length ? ` · indexed: ${h.matched.slice(0, 4).join(", ")}` : ""}`,
      });
    }
  } else if (CALL_HINT.test(query)) {
    for (const c of rows<CrewCall>(calls)) {
      if (asked && c.trade !== asked) continue;
      hits.push({
        kind: "call",
        id: c.id,
        title: c.title,
        blurb: `${c.shop} · ${c.city}, ${c.state} · ${c.rate}`,
        photo: c.photo,
        score: callBoost,
        meta: names(c.tickets).slice(0, 3).join(" · "),
      });
    }
  }

  for (const p of rows<Person>(people)) {
    if (asked && p.trade !== asked) continue;
    const ticketNames = names(p.tickets);
    const text = hay(
      p.name,
      p.trade,
      p.city,
      p.state,
      STATE_NAME[p.state] ?? "",
      p.bio,
      rows<string>(p.specialties),
      ticketNames,
      p.veteran?.mos,
      p.veteran?.branch,
      p.level,
    );
    const s = score(text, tokens);
    const holds = ticketNames.find((name) => name.toLowerCase().includes(query) || tokens.every((t) => name.toLowerCase().includes(t)));
    const tradeHit = asked && p.trade === asked ? 30 : 0;
    if (s > 0 || tradeHit > 0) {
      hits.push({
        kind: "person",
        id: p.id,
        title: p.name,
        blurb: `${p.level} ${p.trade} · ${p.city}${p.state ? `, ${p.state}` : ""}${holds ? ` · ${holds}` : ""}`,
        photo: p.photo || undefined,
        score: s + tradeHit + (holds ? 12 : 0),
        meta: (holds ? [holds] : ticketNames).slice(0, 2).join(" · "),
      });
    }
  }

  for (const p of rows<Post>(posts)) {
    const author = rows<Person>(people).find((x) => x.id === p.authorId);
    if (asked && author?.trade !== asked) continue;
    const text = hay(p.body, p.kind, author?.name, author?.trade);
    const s = score(text, tokens);
    if (s > 0) {
      const body = typeof p.body === "string" ? p.body : "";
      hits.push({
        kind: "post",
        id: p.id,
        title: author ? `${author.name} · shop talk` : "Shop talk",
        blurb: body.slice(0, 140),
        photo: p.photo,
        score: s,
      });
    }
  }

  for (const l of [...rows<Listing>(extraListings), ...seedListings]) {
    if (rows<string>(pulledListings).includes(l.id)) continue;
    const text = hay(l.title, l.blurb, l.kind, l.stack, l.price);
    const s = score(text, tokens) + (l.kind === "service" && query.includes("service") ? 4 : 0);
    if (s > 0) {
      hits.push({
        kind: "listing",
        id: l.id,
        title: l.title,
        blurb: `${l.kind} · ${l.price} · ${l.blurb}`,
        photo: l.photo,
        score: s,
      });
    }
  }

  for (const s of shops) {
    if (asked && s.trade !== asked) continue;
    const text = hay(s.name, s.city, s.state, s.trade);
    const n = score(text, tokens);
    if (n > 0) {
      hits.push({
        kind: "shop",
        id: s.id,
        title: s.name,
        blurb: `${s.trade} · ${s.city}, ${s.state}`,
        score: n,
      });
    }
  }

  for (const m of meets) {
    if (asked && !(m.trades ?? []).includes(asked)) continue;
    const text = hay(m.title, m.place, m.kind, m.when, m.blurb, m.trades);
    const n = score(text, tokens);
    if (n > 0) {
      hits.push({
        kind: "event",
        id: m.id,
        title: m.title,
        blurb: `${m.place} · ${m.when}${m.blurb ? ` · ${m.blurb}` : ""}`,
        score: n,
      });
    }
  }

  for (const f of funds) {
    if (asked && !(f.trades ?? []).includes(asked)) continue;
    const text = hay(f.title, f.who, f.blurb, f.kind, f.trades, "gi bill stipend grant funding scholarship");
    const n = score(text, tokens);
    if (n > 0) {
      hits.push({
        kind: "fund",
        id: f.id,
        title: f.title,
        blurb: `${f.who} · ${f.blurb}`,
        score: n + 2,
      });
    }
  }

  for (const g of guilds) {
    const text = hay(g.name, g.blurb);
    const n = score(text, tokens);
    if (n > 0) {
      hits.push({
        kind: "circle",
        id: g.id,
        title: g.name,
        blurb: g.blurb,
        score: n,
      });
    }
  }

  for (const t of seedLectures) {
    const who = rows<Person>(people).find((p) => p.id === t.personId);
    if (asked && who?.trade !== asked) continue;
    const chapters = Array.isArray(t.chapters) ? t.chapters : [];
    const text = hay(
      t.title,
      chapters.map((c) => `${c.title ?? ""} ${c.body ?? ""}`),
      who?.name,
      "talk lecture course",
    );
    const n = score(text, tokens);
    if (n > 0) {
      hits.push({
        kind: "talk",
        id: t.id,
        title: t.title,
        blurb: `${who?.name ?? "Faculty"} · 5:00 talk`,
        photo: t.still,
        score: n,
      });
    }
  }

  const home = asked ?? preferTrade;
  if (home && home === (asked ?? home)) {
    for (const h of hits) {
      if (asked && h.kind === "person") continue;
      if (h.kind === "call" && callById.get(h.id)?.trade === home) h.score += asked ? 8 : 14;
      if (!asked && h.kind === "person") {
        const who = rows<Person>(people).find((p) => p.id === h.id);
        if (who?.trade === home) h.score += 14;
      }
      if (h.kind === "post") {
        const post = rows<Post>(posts).find((p) => p.id === h.id);
        const who = post ? rows<Person>(people).find((p) => p.id === post.authorId) : undefined;
        if (who?.trade === home) h.score += asked ? 4 : 10;
      }
    }
  }

  return hits.sort((a, b) => b.score - a.score);
}
