import { LEARN_PATHS } from "@/lib/learn-paths";
import type { Person, Post, Reel, Trade } from "@/lib/types";

/** New order each time the hall loads. Stable while you stay on the page. */
const salt = (Math.floor(Math.random() * 0x7fffffff) ^ (Date.now() & 0xffff)) >>> 0;

export function tradeRank(trade: string, id: string) {
  let n = salt;
  const key = `${trade}\0${id}`;
  for (let i = 0; i < key.length; i++) n = (Math.imul(n, 33) + key.charCodeAt(i)) | 0;
  return n >>> 0;
}

export function tradeFilms(
  trade: Trade | string,
  posts: Post[],
  reels: Reel[],
  people: Person[],
  live: (youtube: string, id: string) => boolean,
) {
  const out: { youtube: string; title: string }[] = [];
  const seen = new Set<string>();
  function add(youtube: string | undefined, title: string, id: string) {
    if (!youtube || seen.has(youtube) || !live(youtube, id)) return;
    seen.add(youtube);
    out.push({ youtube, title: title.trim() || String(trade) });
  }
  for (const p of posts) {
    if (people.find((x) => x.id === p.authorId)?.trade !== trade) continue;
    add(p.youtube, p.headline || p.body, p.id);
  }
  for (const r of reels) {
    if (people.find((x) => x.id === r.personId)?.trade !== trade) continue;
    add(r.youtube, r.title, r.id);
  }
  const path = LEARN_PATHS.find((p) => p.trade === trade);
  if (path?.youtube) add(path.youtube, path.clip || path.trade, path.trade);
  out.sort((a, b) => tradeRank(String(trade), a.youtube) - tradeRank(String(trade), b.youtube));
  return out;
}
