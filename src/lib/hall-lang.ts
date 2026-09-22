/** Hall copy stays English. Arabic, Hebrew, Cyrillic, CJK, Thai stay off the board. */
const OTHER =
  /[\u0400-\u04FF\u0590-\u08FF\u0E00-\u0E7F\u3040-\u30FF\u3400-\u9FFF\uAC00-\uD7AF]/;

const SPANISH =
  /\b(para la|aspectos|niños|ninos|crianza|recompensas|español|espanol|información|informacion|vacunación|vacunacion)\b/i;

const BLOCK =
  /\b(suicid(?:e|al)?|self[-\s]?harm|kill yourself|end your life|take your (?:own )?life)\b/i;

export function hallEnglish(...parts: (string | undefined | null)[]): boolean {
  const t = parts.filter(Boolean).join(" ");
  if (!t.trim()) return true;
  if (BLOCK.test(t)) return false;
  if (SPANISH.test(t)) return false;
  return !OTHER.test(t);
}

export function scrubHallCopy<
  P extends { id: string; name?: string; bio?: string },
  T extends { body?: string; headline?: string; authorId: string },
  R extends { caption?: string; title?: string; personId: string },
>(people: P[], posts: T[], reels: R[]) {
  const peopleOut = people.filter((p) => hallEnglish(p.name, p.bio) || !p.id.startsWith("in-"));
  const keep = new Set(peopleOut.map((p) => p.id));
  const postsOut = posts.filter(
    (p) => hallEnglish(p.body, p.headline) && (keep.has(p.authorId) || !p.authorId.startsWith("in-")),
  );
  const reelsOut = reels.filter(
    (r) => hallEnglish(r.caption, r.title) && (keep.has(r.personId) || !r.personId.startsWith("in-")),
  );
  return { people: peopleOut, posts: postsOut, reels: reelsOut };
}
