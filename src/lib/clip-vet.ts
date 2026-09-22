import { hallEnglish } from "./hall-lang";

const HOUSE = "Expedite Consults LLC";

const YOUTUBE_MARK =
  /\b(youtube|youtu\.be|youtubers?|watch\?v=|more videos|subscribe now|official channel)\b/i;

const CHANNEL_TAIL =
  /\s*[\-|–—|:]\s*(.{0,48})$/;

export function stripYoutubeMark(raw?: string | null) {
  if (!raw) return "";
  return raw
    .replace(/https?:\/\/\S*youtu(?:\.be|be\.com)\S*/gi, "")
    .replace(/\b(youtube|youtu\.be|youtubers?)\b/gi, "")
    .replace(/\bmore videos\b/gi, "")
    .replace(/\bsubscribe(?:\s+now)?\b/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function dropChannelTail(title: string) {
  const m = title.match(CHANNEL_TAIL);
  if (!m) return title.trim();
  if (YOUTUBE_MARK.test(m[1]) || /\b(school|official|tv|media|channel|network)\b/i.test(m[1])) {
    return title.slice(0, m.index).trim();
  }
  return title.trim();
}

export type ClipVet = {
  ok: boolean;
  reason?: string;
  title: string;
  headline: string;
  body: string;
  caption: string;
};

/** Run before a clip is allowed on Shop talk or the wheel. */
export function vetClip(title: string, author = ""): ClipVet {
  if (!hallEnglish(title, author)) return { ok: false, reason: "not hall copy", title: "", headline: "", body: "", caption: "" };
  let clean = dropChannelTail(stripYoutubeMark(title));
  if (!clean) return { ok: false, reason: "empty after vet", title: "", headline: "", body: "", caption: "" };
  if (YOUTUBE_MARK.test(clean)) return { ok: false, reason: "youtube mark", title: "", headline: "", body: "", caption: "" };
  const headline = clean.slice(0, 56);
  return {
    ok: true,
    title: clean,
    headline,
    body: clean,
    caption: clean,
  };
}

export function houseLine(raw?: string | null, headline?: string) {
  const t = dropChannelTail(stripYoutubeMark(raw));
  if (!t) return HOUSE;
  if (t.toLowerCase().startsWith(HOUSE.toLowerCase())) return t;
  return `${HOUSE}. ${headline || t}`;
}

export function scrubYoutubeCopy<
  T extends { body?: string; headline?: string },
  R extends { caption?: string; title?: string },
>(posts: T[], reels: R[]) {
  const nextPosts: T[] = [];
  for (const p of posts) {
    const v = vetClip(p.headline || p.body || "", p.body);
    if (!v.ok) continue;
    nextPosts.push({ ...p, headline: v.headline, body: v.body });
  }
  const nextReels: R[] = [];
  for (const r of reels) {
    const v = vetClip(r.title || r.caption || "", r.caption);
    if (!v.ok) continue;
    nextReels.push({ ...r, title: v.headline, caption: v.caption });
  }
  return { posts: nextPosts, reels: nextReels };
}
