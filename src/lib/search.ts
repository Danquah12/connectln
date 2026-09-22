import { funds, meets } from "./hall-seed";
import { seedLectures } from "./lecture-seed";
import { listings as seedListings } from "./market-seed";
import { guilds, shops } from "./seed";
import { indexCalls, queryCallIndex } from "./contract-index";
import type { CrewCall, Listing, Person, Post } from "./types";

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

function hay(...parts: (string | undefined | null | string[])[]) {
  return parts
    .flat()
    .filter(Boolean)
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
  const tokens = query.split(/\s+/).filter((t) => t.length > 1);
  const hits: Hit[] = [];
  const callBoost = CALL_HINT.test(query) ? 4 : 0;
  const callHits = queryCallIndex(query, indexCalls(calls));
  const callById = new Map(calls.map((c) => [c.id, c]));
  if (callHits.length) {
    for (const h of callHits) {
      const c = callById.get(h.id);
      if (!c) continue;
      hits.push({
        kind: "call",
        id: c.id,
        title: c.title,
        blurb: `${c.shop} · ${c.city}, ${c.state} · ${c.rate}`,
        photo: c.photo,
        score: h.score + callBoost,
        meta: `${c.tickets.slice(0, 3).join(" · ")}${h.matched.length ? ` · indexed: ${h.matched.slice(0, 4).join(", ")}` : ""}`,
      });
    }
  } else if (CALL_HINT.test(query)) {
    for (const c of calls) {
      hits.push({
        kind: "call",
        id: c.id,
        title: c.title,
        blurb: `${c.shop} · ${c.city}, ${c.state} · ${c.rate}`,
        photo: c.photo,
        score: callBoost,
        meta: c.tickets.slice(0, 3).join(" · "),
      });
    }
  }

  for (const p of people) {
    const text = hay(
      p.name,
      p.trade,
      p.city,
      p.state,
      p.bio,
      p.specialties,
      p.tickets.map((t) => t.name),
      p.veteran?.mos,
      p.veteran?.branch,
      p.level,
    );
    const s = score(text, tokens);
    if (s > 0) {
      hits.push({
        kind: "person",
        id: p.id,
        title: p.name,
        blurb: `${p.level} ${p.trade} · ${p.city}`,
        photo: p.photo || undefined,
        score: s,
        meta: p.tickets.slice(0, 2).map((t) => t.name).join(" · "),
      });
    }
  }

  for (const p of posts) {
    const author = people.find((x) => x.id === p.authorId);
    const text = hay(p.body, p.kind, author?.name, author?.trade);
    const s = score(text, tokens);
    if (s > 0) {
      hits.push({
        kind: "post",
        id: p.id,
        title: author ? `${author.name} · shop talk` : "Shop talk",
        blurb: p.body.slice(0, 140),
        photo: p.photo,
        score: s,
      });
    }
  }

  for (const l of [...extraListings, ...seedListings]) {
    if (pulledListings.includes(l.id)) continue;
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
    const who = people.find((p) => p.id === t.personId);
    const text = hay(t.title, ...t.chapters.map((c) => c.title + " " + c.body), who?.name, "talk lecture course");
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

  if (preferTrade) {
    for (const h of hits) {
      if (h.kind === "call" && callById.get(h.id)?.trade === preferTrade) h.score += 14;
      if (h.kind === "person") {
        const who = people.find((p) => p.id === h.id);
        if (who?.trade === preferTrade) h.score += 14;
      }
      if (h.kind === "post") {
        const post = posts.find((p) => p.id === h.id);
        const who = post ? people.find((p) => p.id === post.authorId) : undefined;
        if (who?.trade === preferTrade) h.score += 10;
      }
      if (h.kind === "talk") {
        const who = people.find((p) => h.blurb.startsWith(p.name));
        if (who?.trade === preferTrade) h.score += 8;
      }
    }
  }

  return hits.sort((a, b) => b.score - a.score);
}
