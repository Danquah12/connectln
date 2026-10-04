import { createServerFn } from "@tanstack/react-start";
import { callingOf } from "./calling";
import type { CrewCall } from "./types";

const FEEDS: { source: string; url: string }[] = [
  { source: "Jobicy", url: "https://jobicy.com/api/v2/remote-jobs?count=30&tag=nurse" },
  { source: "Jobicy", url: "https://jobicy.com/api/v2/remote-jobs?count=20&tag=teacher" },
  { source: "Jobicy", url: "https://jobicy.com/api/v2/remote-jobs?count=15&tag=pharmacist" },
  { source: "Jobicy", url: "https://jobicy.com/api/v2/remote-jobs?count=15&tag=dentist" },
  { source: "Jobicy", url: "https://jobicy.com/api/v2/remote-jobs?count=15&tag=therapist" },
  { source: "Jobicy", url: "https://jobicy.com/api/v2/remote-jobs?count=15&tag=electrician" },
  { source: "Jobicy", url: "https://jobicy.com/api/v2/remote-jobs?count=15&tag=developer" },
  { source: "Jobicy", url: "https://jobicy.com/api/v2/remote-jobs?count=15&tag=physician" },
  { source: "The Muse", url: "https://www.themuse.com/api/public/jobs?category=Healthcare&page=1" },
  { source: "The Muse", url: "https://www.themuse.com/api/public/jobs?category=Education&page=1" },
  { source: "Himalayas", url: "https://himalayas.app/jobs/api?limit=40" },
  { source: "Remotive", url: "https://remotive.com/api/remote-jobs?category=software-dev" },
  { source: "Arbeitnow", url: "https://www.arbeitnow.com/api/job-board-api" },
  { source: "Remote OK", url: "https://remoteok.com/api" },
];

function plain(html: string) {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&/g, "&")
    .replace(/&#39;/g, "'")
    .replace(/"/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

function place(raw: string) {
  const s = raw.trim();
  if (!s || /remote|worldwide|anywhere|global/i.test(s)) return { city: "Remote", state: "—" };
  const parts = s.split(",").map((x) => x.trim()).filter(Boolean);
  if (parts.length >= 2) return { city: parts[0].slice(0, 40), state: parts[1].slice(0, 24) };
  return { city: s.slice(0, 40), state: "—" };
}

function money(row: Record<string, unknown>) {
  const salary = typeof row.salary === "string" ? row.salary.trim() : "";
  if (salary) return salary.slice(0, 48);
  const min = typeof row.salaryMin === "number" ? row.salaryMin : null;
  const max = typeof row.salaryMax === "number" ? row.salaryMax : null;
  const cur = typeof row.salaryCurrency === "string" ? row.salaryCurrency : "$";
  const period = typeof row.salaryPeriod === "string" ? row.salaryPeriod : "";
  if (min && max) return `${cur}${min.toLocaleString()}–${max.toLocaleString()}${period ? ` / ${period}` : ""}`;
  if (min) return `from ${cur}${min.toLocaleString()}`;
  return "Shop scale";
}

function rowsOf(data: unknown): Record<string, unknown>[] {
  if (Array.isArray(data)) {
    return data.filter((row) => row && typeof row === "object" && !("legal" in (row as object))) as Record<string, unknown>[];
  }
  if (!data || typeof data !== "object") return [];
  const bag = data as { jobs?: unknown; data?: unknown; results?: unknown };
  const list = bag.jobs || bag.results || bag.data;
  return Array.isArray(list) ? (list.filter((row) => row && typeof row === "object") as Record<string, unknown>[]) : [];
}

function textList(value: unknown) {
  if (!Array.isArray(value)) return "";
  return value
    .map((item) => (typeof item === "string" ? item : item && typeof item === "object" ? String((item as { name?: string }).name || "") : ""))
    .filter(Boolean)
    .join(" ");
}

function normalize(row: Record<string, unknown>): Record<string, unknown> {
  const company = row.company;
  const companyName =
    company && typeof company === "object"
      ? String((company as { name?: string }).name || "")
      : String(row.companyName || row.company_name || row.company || "");
  const refs = row.refs && typeof row.refs === "object" ? (row.refs as { landing_page?: string }) : undefined;
  const places = textList(row.locations) || textList(row.locationRestrictions);
  let pub: unknown = row.pubDate || row.publication_date || row.date || row.created_at || "";
  if (typeof pub === "number") pub = new Date(pub > 1e12 ? pub : pub * 1000).toISOString();
  const min = typeof row.minSalary === "number" ? row.minSalary : typeof row.salary_min === "number" ? row.salary_min : undefined;
  const max = typeof row.maxSalary === "number" ? row.maxSalary : typeof row.salary_max === "number" ? row.salary_max : undefined;
  return {
    ...row,
    jobTitle: row.jobTitle || row.title || row.name || row.position,
    companyName,
    url: row.url || row.applicationLink || refs?.landing_page || "",
    jobGeo: row.jobGeo || row.candidate_required_location || row.location || places || "Remote",
    jobExcerpt: row.jobExcerpt || row.excerpt || (typeof row.contents === "string" ? row.contents : "") || row.description,
    category: String(row.category || row.jobIndustry || "") + " " + textList(row.categories),
    tags: Array.isArray(row.tags) ? row.tags : [],
    pubDate: pub,
    salaryMin: min,
    salaryMax: max,
  };
}

function asCall(raw: Record<string, unknown>, source: string): CrewCall | null {
  const row = normalize(raw);
  const title = String(row.jobTitle || "").replace(/\s+/g, " ").trim();
  const shop = String(row.companyName || row.company_name || "").trim();
  const url = String(row.url || "");
  if (!title || !shop || !url.startsWith("http")) return null;
  const trade = callingOf(title);
  if (!trade) return null;
  const loc = place(String(row.jobGeo || row.candidate_required_location || row.location || "Remote"));
  const blurb = plain(String(row.jobExcerpt || row.description || title)).slice(0, 320);
  const id = `wire-${source.toLowerCase()}-${row.id ?? title.slice(0, 24)}`;
  const when = String(row.pubDate || row.publication_date || row.created_at || "");
  return {
    id: id.replace(/[^\w.-]+/g, "-").slice(0, 80),
    title: title.slice(0, 120),
    trade,
    shop: shop.slice(0, 80),
    city: loc.city,
    state: loc.state,
    rate: money(row),
    duration: String(row.jobType || row.job_type || "As posted").replace(/_/g, " ").slice(0, 40),
    start: when ? when.slice(0, 10) : "Now",
    tickets: [],
    union: false,
    travel: /remote/i.test(loc.city),
    spots: 1,
    filled: 0,
    description: blurb || title,
    wire: true,
    listingUrl: url,
    source,
  };
}

async function readFeed(source: string, url: string): Promise<CrewCall[]> {
  const res = await fetch(url, {
    headers: { Accept: "application/json", "User-Agent": "ConnectLn/1.0" },
    signal: AbortSignal.timeout(12000),
  });
  if (!res.ok) return [];
  const rows = rowsOf(await res.json());
  return rows.map((row) => asCall(row, source)).filter((c): c is CrewCall => Boolean(c));
}

let cache: { at: number; rows: CrewCall[] } | null = null;

export const pullOpenings = createServerFn({ method: "GET" }).handler(async (): Promise<CrewCall[]> => {
  if (cache && Date.now() - cache.at < 30 * 60 * 1000) return cache.rows;
  const batches = await Promise.all(FEEDS.map((f) => readFeed(f.source, f.url).catch(() => [] as CrewCall[])));
  const seen = new Set<string>();
  const rows: CrewCall[] = [];
  for (const call of batches.flat()) {
    const key = `${call.shop}|${call.title}`.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    rows.push(call);
    if (rows.length >= 120) break;
  }
  cache = { at: Date.now(), rows };
  return rows;
});
