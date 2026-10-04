import { CLIP_POSTER, clipPosters } from "./clip-posters";
import { sourcesForBelt, type ClipSource } from "./clip-sources";
import { hallEnglish } from "./hall-lang";
import { vetClip } from "./clip-vet";
import type { Person, Post, PostKind, Reel, ReelKind } from "./types";
import { youtubeThumb } from "./youtube";

export type ClipPullItem = {
  youtube: string;
  title: string;
  author: string;
  handle: string;
  trade: string;
  topic: string;
  license?: string;
};

export type ClipPullReport = {
  id: string;
  at: string;
  nextAt: string;
  added: number;
  skipped: number;
  failed: { handle: string; reason: string }[];
  items: (ClipPullItem & { added: boolean })[];
};

export type ClipBatch = {
  people: Person[];
  posts: Post[];
  reels: Reel[];
  items: ClipPullItem[];
  failed: { handle: string; reason: string }[];
};

export type ClipStatus = "pending" | "live" | "held" | "killed";

export function clipState(
  youtube: string | undefined,
  status?: Record<string, ClipStatus>,
  id?: string,
): ClipStatus {
  if (!youtube) return "live";
  if (status?.[youtube]) return status[youtube];
  return String(id ?? "").startsWith("in-") ? "pending" : "live";
}

export function hallClipLive(youtube: string | undefined, status?: Record<string, ClipStatus>, id?: string) {
  const st = clipState(youtube, status, id);
  return st === "live" || st === "pending";
}

export function isLecturePost(post: { sitTo?: string; kind?: string }) {
  return post.sitTo === "l3";
}

export function isLectureReel(reel: { kind?: string }) {
  return reel.kind === "classroom";
}

export function isSyncedTalk(post: { id?: string; youtube?: string; sitTo?: string }) {
  if (!post.youtube || isLecturePost(post)) return false;
  return String(post.id ?? "").startsWith("in-");
}

/** Follow-the-sun 8-hour belts (UTC). New clips and a new Shop Talk order at each turn. */
export const TALK_BELTS = [
  { id: "apac", from: 0, label: "Asia / Pacific" },
  { id: "emea", from: 8, label: "Europe / Africa" },
  { id: "americas", from: 16, label: "Americas" },
] as const;

export type TalkBelt = (typeof TALK_BELTS)[number]["id"];

export function talkBelt(at = Date.now()): TalkBelt {
  const h = new Date(at).getUTCHours();
  if (h < 8) return "apac";
  if (h < 16) return "emea";
  return "americas";
}

export function talkBeltEnd(at = Date.now()) {
  const d = new Date(at);
  const h = d.getUTCHours();
  const end = h < 8 ? 8 : h < 16 ? 16 : 24;
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), end, 0, 0, 0);
}

export function talkShuffle(id: string, at = Date.now()) {
  const day = new Date(at).toISOString().slice(0, 10);
  let n = 0;
  for (const c of `${day}:${talkBelt(at)}:${id}`) n = (Math.imul(n, 33) + c.charCodeAt(0)) | 0;
  return n;
}

export const CLIP_PULL_MS = 5 * 60 * 1000;
export const CLIP_PULL_REV = 20;

export type ClipDayRow = {
  day: string;
  ingested: number;
  skipped: number;
  failed: number;
  pulls: number;
  trades: { trade: string; n: number }[];
};

export function clipDayLedger(reports: ClipPullReport[]): ClipDayRow[] {
  const map = new Map<string, ClipDayRow>();
  for (const r of reports) {
    const day = r.at.slice(0, 10);
    const row = map.get(day) ?? { day, ingested: 0, skipped: 0, failed: 0, pulls: 0, trades: [] };
    row.pulls += 1;
    row.ingested += r.added;
    row.skipped += r.skipped;
    row.failed += r.failed.length;
    const counts = new Map(row.trades.map((t) => [t.trade, t.n]));
    for (const it of r.items) {
      if (!it.added) continue;
      const key = it.trade || it.topic || "Open";
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    row.trades = [...counts.entries()]
      .map(([trade, n]) => ({ trade, n }))
      .sort((a, b) => b.n - a.n);
    map.set(day, row);
  }
  return [...map.values()].sort((a, b) => b.day.localeCompare(a.day));
}

export function clipDayLabel(day: string) {
  const [y, m, d] = day.split("-").map(Number);
  if (!y || !m || !d) return day;
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

const HOUSE = "Expedite Consults LLC";
const KNOWN = new Set(Object.keys(CLIP_POSTER));
const ALIAS: Record<string, string> = {
  registerednursern: "nurse-sarah",
  "hvac school": "bryan-orr",
  weldingtipsandtricks: "jody-collier",
  "ryan hughes hvac": "ryan-hughes",
  "ryan hughes": "ryan-hughes",
  "med gas life": "med-gas-life",
  "acoem usa": "patrick-lawrence",
  acoem: "patrick-lawrence",
  buildwitt: "jason-witt",
  "dental school online": "dental-school",
  osha: "osha-outreach",
  "u.s. department of labor": "dol-apprentice",
  "us department of labor": "dol-apprentice",
  "u.s. department of veterans affairs": "va-education",
};

let cache: { at: number; batch: ClipBatch } | null = null;
const TTL = CLIP_PULL_MS;

function idsFromHtml(html: string) {
  const out: string[] = [];
  const seen = new Set<string>();
  const re = /"videoId":"([A-Za-z0-9_-]{11})"/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    if (seen.has(m[1]) || KNOWN.has(m[1])) continue;
    seen.add(m[1]);
    out.push(m[1]);
    if (out.length >= 24) break;
  }
  return out;
}

async function oembed(id: string) {
  const url = `https://www.youtube.com/oembed?url=${encodeURIComponent(`https://www.youtube.com/watch?v=${id}`)}&format=json`;
  const res = await fetch(url, { headers: { "User-Agent": "ConnectLn/1.0" } });
  if (!res.ok) return null;
  const row = (await res.json()) as { title?: string; author_name?: string };
  if (!row.title) return null;
  return { title: row.title.replace(/\s+/g, " ").trim(), author: (row.author_name || "").trim() };
}

async function channelIds(handle: string) {
  const res = await fetch(`https://www.youtube.com/@${handle}/videos`, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Accept-Language": "en-US,en;q=0.9",
    },
  });
  if (!res.ok) return [];
  return idsFromHtml(await res.text());
}

function slug(name: string) {
  const s = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40);
  return s ? `in-${s}` : "in-poster";
}

function posterOf(author: string, src: ClipSource, youtube: string, title: string): Person {
  const alias = ALIAS[author.toLowerCase()];
  const hit = alias ? clipPosters.find((p) => p.id === alias) : clipPosters.find((p) => p.name.toLowerCase() === author.toLowerCase());
  if (hit) return hit;
  const research = src.topic === "research";
  const still = youtubeThumb(youtube);
  return {
    id: `in-${slug(author || src.handle)}`,
    name: author || src.handle,
    trade: src.trade,
    level: research ? "Staff" : src.trade === "HVAC" || src.trade === "Welder" ? "Journeyman" : "Staff",
    city: research ? "Open" : "On the tools",
    state: "Open",
    years: 10,
    travelMiles: 40,
    availability: "open",
    bio: `${author} posted this work. ${title}`,
    photo: still,
    cover: still,
    specialties: research ? ["Research findings"] : [title.slice(0, 32)],
    tickets: [{ id: "t1", name: "Posted this work", issuer: HOUSE }],
    history: [{ id: "h1", name: "Posted this work", role: "On camera", when: "2026", city: "Open" }],
    example: false,
  };
}

function lowLevelTitle(title: string) {
  return /\b(beginner|beginners|for kids|kids'|elementary|preschool|kindergarten|grade [0-9]|dummy|dummies|101\b|absolute beginner|getting started|intro(?:duction)? to|basics for|easy diy|simple way|first day|learn in 5|in 10 minutes|for dummies)\b/i.test(
    title,
  );
}

function teachingTitle(title: string) {
  if (lowLevelTitle(title)) return false;
  return /advanced|master(?:class|y)?|journeyman|foreman|leadership|career|licensure|certif|professional|continuing ed|strategy|improv(?:e|ing)|earning|management|specialist|board exam|osha 30|nec |protocol|fellowship|residency|supervision|estimator|inspector|graduate|workforce|apprenticeship|safety culture|clinical|evidence|research|policy|code change|compliance|troubleshooting|diagnosis|critical care|charge nurse|department|practice standard/i.test(
    title,
  );
}

function kinds(src: ClipSource, title: string): { post: PostKind; reel: ReelKind } {
  const t = title.toLowerCase();
  if (src.topic === "research") return { post: "brief", reel: "classroom" };
  if (src.topic === "training" || /osha|loto|lockout|ppe|safety|fall protection/.test(t)) return { post: "safety", reel: "safety" };
  if (src.topic === "care") return { post: "talk", reel: "care" };
  if (src.topic === "classroom") return { post: "talk", reel: "classroom" };
  return { post: "work", reel: "work" };
}

async function pullSource(src: ClipSource): Promise<ClipBatch> {
  const raw = await channelIds(src.handle);
  const scored: { id: string; title: string; author: string }[] = [];
  for (const id of raw) {
    const meta = await oembed(id);
    if (!meta) continue;
    const vetted = vetClip(meta.title, meta.author);
    if (!vetted.ok) continue;
    if (lowLevelTitle(vetted.title)) continue;
    scored.push({ id, title: vetted.title, author: meta.author });
    const taught = scored.filter((s) => teachingTitle(s.title)).length;
    if (taught >= src.take || scored.length >= Math.max(8, src.take * 2)) break;
  }
  scored.sort((a, b) => Number(teachingTitle(b.title)) - Number(teachingTitle(a.title)));
  const ids = scored.slice(0, Math.max(src.take, 1));
  const people: Person[] = [];
  const posts: Post[] = [];
  const reels: Reel[] = [];
  const items: ClipPullItem[] = [];
  const have = new Set<string>();
  for (const row of ids) {
    if (posts.length >= Math.max(src.take, 3)) break;
    const vetted = vetClip(row.title, row.author);
    if (!vetted.ok) continue;
    const person = { ...posterOf(row.author, src, row.id, vetted.title), bio: `${HOUSE}. ${vetted.title}` };
    if (!have.has(person.id)) {
      people.push(person);
      have.add(person.id);
    }
    const k = kinds(src, vetted.title);
    const lecture = src.topic === "research" || src.topic === "classroom";
    const createdAt = new Date(Date.now() - posts.length * 3600_000).toISOString();
    posts.push({
      id: `in-${row.id}`,
      authorId: person.id,
      kind: lecture ? "brief" : k.post,
      headline: vetted.headline,
      body: vetted.body,
      youtube: row.id,
      photo: youtubeThumb(row.id),
      createdAt,
      likes: 8 + ((row.id.charCodeAt(0) + row.id.charCodeAt(1)) % 40),
      comments: [],
      sitTo: lecture ? "l3" : src.topic === "training" ? "l1" : src.topic === "care" ? "l2" : undefined,
    });
    if (!lecture) {
      reels.push({
        id: `in-reel-${row.id}`,
        personId: person.id,
        title: vetted.headline,
        caption: vetted.caption,
        kind: k.reel,
        youtube: row.id,
        still: youtubeThumb(row.id),
        createdAt,
        likes: 6 + (row.id.charCodeAt(2) % 24),
      });
    }
    items.push({
      youtube: row.id,
      title: vetted.title,
      author: HOUSE,
      handle: src.handle,
      trade: src.trade,
      topic: src.topic,
      license: src.license ?? "embed",
    });
  }
  return { people, posts, reels, items, failed: [] };
}

export async function pullClips(opts?: { force?: boolean }): Promise<ClipBatch> {
  if (!opts?.force && cache && Date.now() - cache.at < TTL) return cache.batch;
  const belt = talkBelt();
  const sources = sourcesForBelt(belt);
  const chunks = await Promise.allSettled(sources.map((s) => pullSource(s)));
  const batch: ClipBatch = { people: [], posts: [], reels: [], items: [], failed: [] };
  const seenP = new Set<string>();
  const seenV = new Set<string>();
  chunks.forEach((row, i) => {
    const handle = sources[i]?.handle ?? "source";
    if (row.status !== "fulfilled") {
      batch.failed.push({ handle, reason: row.reason instanceof Error ? row.reason.message : "Pull failed" });
      return;
    }
    for (const p of row.value.people) {
      if (seenP.has(p.id)) continue;
      seenP.add(p.id);
      batch.people.push(p);
    }
    for (const p of row.value.posts) {
      if (!p.youtube || seenV.has(p.youtube)) continue;
      seenV.add(p.youtube);
      batch.posts.push(p);
    }
    for (const r of row.value.reels) {
      if (batch.reels.some((x) => x.id === r.id)) continue;
      batch.reels.push(r);
    }
    batch.items.push(...row.value.items.filter((it) => seenV.has(it.youtube) || batch.items.every((x) => x.youtube !== it.youtube)));
  });
  const itemSeen = new Set<string>();
  batch.items = batch.items.filter((it) => {
    if (itemSeen.has(it.youtube)) return false;
    itemSeen.add(it.youtube);
    return true;
  });
  batch.posts.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  cache = { at: Date.now(), batch };
  return batch;
}
