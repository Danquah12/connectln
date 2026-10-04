import { BRIEFS } from "./briefs";
import { LEARN_PATHS, type LearnPath } from "./learn-paths";
import { LIBRARIES } from "./libraries";
import { TRADE_GROUPS } from "./seed";
import type { Person, Post, Trade, Vouch } from "./types";

export type RelatedKind = "Tools" | "School" | "Vouch" | "The card";

export type RelatedItem = {
  key: string;
  kind: RelatedKind;
  title: string;
  line: string;
  youtube?: string;
  personId?: string;
  href?: string;
};

const TOOLS: Record<Trade, string> = {
  Electrician: "Fluke · Klein · Milwaukee · Greenlee",
  Plumber: "Ridgid · Milwaukee · press tool",
  HVAC: "Fieldpiece · Yellow Jacket · gauges",
  Welder: "Lincoln · Miller · hood",
  Carpenter: "DeWalt · speed square · nailer",
  Ironworker: "Beamer · spud wrench · harness",
  Millwright: "Dial indicator · laser alignment",
  Solar: "Fluke · torque wrench · megger",
  Equipment: "The machine named on the card",
  Elevator: "The hoistway tools on the card",
  Lineman: "Hot stick · hooks · belt",
  Pipefitter: "Wrap-around · grinder · level",
  "Sheet metal": "Pittsburgh · snips · brake",
  Mason: "Trowel · level · line",
  Roofer: "Harness · nailer · the membrane",
  "Sprinkler fitter": "Groover · press · hangers",
  Machinist: "Micrometer · lathe · indicator",
  "Diesel technician": "Scan tool · torque wrench",
  Chef: "Knife · the station · the lowboy",
  "Truck driver": "The truck on the card · the log",
  Barber: "Clippers · shears · the chair",
  Nurse: "The cart · the pump · the chart",
  Physician: "The chart · the board record",
  Pharmacist: "The board record · the cabinet",
  Teacher: "The seating chart · the board",
  Faculty: "The syllabus · the library",
  Developer: "The editor · the repo",
  Realtor: "MLS · the contract",
  Agent: "MLS · the broker's file",
  Therapist: "The note · the session record",
  Dentist: "The chair · the chart",
  Paramedic: "The bag · the monitor",
  "Dental hygienist": "Scaler · the chart",
  Veterinarian: "The table · the clinic record",
  Midwife: "The birth bag · the chart",
  "Respiratory therapist": "The ventilator · the blood gas",
  Firefighter: "SCBA · the hall tools",
  Inspector: "The code book · the camera",
  Appraiser: "The tape · the form",
  Bookkeeper: "The ledger · the receipts",
  Advisor: "The plan · the record",
};

/** A second film the hall already has, used only when the calling's own film is the one playing. */
const TOOL_FILM: Partial<Record<Trade, { youtube: string; title: string }>> = {
  Electrician: { youtube: "5D4L9eWvg6c", title: "Prove it's dead" },
  Solar: { youtube: "5D4L9eWvg6c", title: "Prove it's dead" },
  Lineman: { youtube: "5D4L9eWvg6c", title: "Prove it's dead" },
  HVAC: { youtube: "BLtBaCt81i4", title: "EPA 608 core" },
  Welder: { youtube: "T8ZGl5iK-JA", title: "What a 6G pass looks like" },
  Equipment: { youtube: "nCFSzlxCuqY", title: "Crane hand signals" },
};

function schoolName(house: string, trade: string) {
  const name = house.split("·")[0]?.trim() || trade;
  if (name.length > 32 || /^(a|the)\b/i.test(name)) return trade;
  return name;
}

const NAMED_SCHOOLS: { re: RegExp; name: string; youtube: string; line: string }[] = [
  { re: /nccer/i, name: "NCCER", youtube: "UdefgRjgiCI", line: "How an NCCER apprenticeship is built" },
  { re: /osha/i, name: "OSHA Outreach", youtube: "s12SO9YUitc", line: "OSHA 30 is the card" },
  { re: /epa/i, name: "EPA Section 608", youtube: "BLtBaCt81i4", line: "EPA 608 core" },
  { re: /nabcep/i, name: "NABCEP", youtube: "Yxt72aDjFgY", line: "How a solar panel makes power" },
  { re: /nccco/i, name: "NCCCO", youtube: "nCFSzlxCuqY", line: "Crane hand signals" },
  { re: /neiep/i, name: "NEIEP", youtube: "rKp4pe92ljg", line: "How an elevator works" },
  { re: /\baws\b/i, name: "AWS", youtube: "Zu2glUXqeUo", line: "6G pipe, carbon TIG" },
  { re: /jatc/i, name: "JATC", youtube: "yMF7CLtAPkw", line: "Lock out before the panel is open" },
  { re: /\bnar\b/i, name: "NAR", youtube: "-ZZPlWdHrI4", line: "The license, before the association" },
  { re: /cs50/i, name: "CS50", youtube: "8mAITcNt710", line: "Harvard CS50" },
];

function mentions(text: string, trade: string) {
  const escaped = trade.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`\\b${escaped}\\b`, "i").test(text);
}

function pathFor(clipId: string | undefined, meaning: string | undefined, youTrade: Trade | undefined, people: Person[], posts: Post[]) {
  if (clipId) {
    const post = posts.find((p) => p.youtube === clipId || p.id === clipId);
    const author = post ? people.find((p) => p.id === post.authorId) : undefined;
    const byAuthor = author ? LEARN_PATHS.find((p) => p.trade === author.trade) : undefined;
    if (byAuthor) return byAuthor;
    const byClip = LEARN_PATHS.find((p) => p.youtube === clipId);
    if (byClip) return byClip;
  }
  const text = meaning ?? "";
  const named = LEARN_PATHS.filter((p) => mentions(text, p.trade));
  named.sort((a, b) => b.trade.length - a.trade.length);
  return named[0] ?? LEARN_PATHS.find((p) => p.trade === youTrade) ?? LEARN_PATHS[0];
}

function canSpeak(person: Person) {
  return !/^(u\.s\.|va )\b/i.test(person.name) && !/\b(department|dept\.|university|college)\b/i.test(person.name);
}

function filmOf(personId: string, posts: Post[], used: Set<string>, clipId?: string) {
  return posts.find((p) => p.authorId === personId && p.youtube && p.youtube !== clipId && !used.has(p.youtube))?.youtube;
}

export function relatedItems({
  clipId,
  meaning,
  youTrade,
  youId,
  speakerId,
  people,
  posts,
  vouches,
}: {
  clipId?: string;
  meaning?: string;
  youTrade?: Trade;
  youId?: string;
  /** Person already on this film. Someone else should vouch. */
  speakerId?: string;
  people: Person[];
  posts: Post[];
  vouches: Vouch[];
}): RelatedItem[] {
  const path = pathFor(clipId, meaning, youTrade, people, posts);
  const used = new Set<string>();
  if (clipId) used.add(clipId);

  const group = TRADE_GROUPS.find((g) => g.trades.includes(path.trade));
  const siblings = LEARN_PATHS.filter(
    (p): p is LearnPath & { youtube: string } =>
      Boolean(p.youtube) && p.trade !== path.trade && Boolean(group?.trades.includes(p.trade)),
  );
  const mates = new Set(people.filter((p) => p.trade === path.trade).map((p) => p.id));
  const mateFilm = posts.find(
    (p) => p.youtube && mates.has(p.authorId) && p.youtube !== clipId && p.youtube !== path.youtube,
  );

  const items: RelatedItem[] = [];

  const own = path.youtube && path.youtube !== clipId ? path : undefined;
  const fallback = TOOL_FILM[path.trade];
  const toolYoutube = own?.youtube ?? (mateFilm?.youtube && !used.has(mateFilm.youtube) ? mateFilm.youtube : undefined) ?? (fallback && fallback.youtube !== clipId ? fallback.youtube : undefined);
  const toolTitle = own?.clip ?? mateFilm?.headline ?? fallback?.title;
  if (toolYoutube) used.add(toolYoutube);
  items.push({
    key: "tools",
    kind: "Tools",
    title: TOOLS[path.trade],
    line: toolTitle || "What this calling carries.",
    youtube: toolYoutube,
  });

  const schools: RelatedItem[] = [];
  const seenSchools = new Set<string>();
  function addSchool(item: RelatedItem) {
    if (schools.length >= 2 || seenSchools.has(item.title)) return;
    seenSchools.add(item.title);
    if (item.youtube) used.add(item.youtube);
    schools.push(item);
  }
  for (const named of NAMED_SCHOOLS) {
    if (!named.re.test(path.house) && !named.re.test(path.steps)) continue;
    if (used.has(named.youtube)) continue;
    addSchool({
      key: `school-${named.name}`,
      kind: "School",
      title: named.name,
      line: named.line,
      youtube: named.youtube,
      href: path.href,
    });
  }
  for (const sib of siblings) {
    if (used.has(sib.youtube)) continue;
    addSchool({
      key: `school-${sib.trade}`,
      kind: "School",
      title: schoolName(sib.house, sib.trade),
      line: `${sib.trade} · ${sib.clip || "The training film"}`,
      youtube: sib.youtube,
      href: sib.href,
    });
  }
  const library = LIBRARIES[path.trade];
  if (!seenSchools.has(library.house)) {
    addSchool({
      key: "school-library",
      kind: "School",
      title: library.house,
      line: library.seat,
      href: library.href,
    });
  }
  items.push(...schools);

  const vouchers: RelatedItem[] = [];
  const seenPeople = new Set<string>();
  function addPerson(person: Person, line: string) {
    if (vouchers.length >= 2) return;
    if (person.id === youId || person.id === speakerId || seenPeople.has(person.id)) return;
    seenPeople.add(person.id);
    const youtube = filmOf(person.id, posts, used, clipId);
    if (youtube) used.add(youtube);
    vouchers.push({
      key: `vouch-${person.id}`,
      kind: "Vouch",
      title: person.name,
      line,
      youtube,
      personId: person.id,
    });
  }

  for (const vouch of vouches) {
    const author = people.find((p) => p.id === vouch.fromId);
    const to = people.find((p) => p.id === vouch.toId);
    if (!author) continue;
    if (to?.trade !== path.trade && author.trade !== path.trade) continue;
    const sentence = vouch.body.split(/(?<=\.)\s+/)[0] ?? vouch.body;
    addPerson(author, sentence);
  }
  for (const person of people) {
    if (person.trade !== path.trade || !canSpeak(person)) continue;
    if (!person.id.startsWith("seat-") && !person.mentoring) continue;
    const school = person.history[0]?.name || schoolName(path.house, path.trade);
    const line = person.id.startsWith("seat-")
      ? `Trained through ${school}. Will speak for that school.`
      : `${person.level} in ${person.city}. Will speak for this training.`;
    addPerson(person, line);
  }
  if (vouchers.length === 0 && group) {
    for (const person of people) {
      if (!group.trades.includes(person.trade) || !canSpeak(person)) continue;
      if (!person.id.startsWith("seat-") && !person.mentoring) continue;
      const school = person.history[0]?.name || schoolName(path.house, person.trade);
      addPerson(person, `${person.trade} · ${school}. Will speak for that training.`);
    }
  }
  items.push(...vouchers);

  const brief = BRIEFS[path.trade];
  const spare = posts.find((p) => p.youtube && mates.has(p.authorId) && !used.has(p.youtube));
  items.push({
    key: "card",
    kind: "The card",
    title: spare?.headline || "Directions",
    line: `${brief.directions[0]} ${brief.guidelines[0]}`,
    youtube: spare?.youtube,
  });

  return items;
}
