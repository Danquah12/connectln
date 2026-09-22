import type { Level, Person, Trade } from "./types";

export type MhccRow = {
  id: string;
  license: string;
  firstName: string;
  lastName: string;
  profession: string;
  trade: Trade;
  status: string;
  city: string;
  county: string;
  state: string;
  zip: string;
  issued?: string;
  expires?: string;
  board: string;
  source: string;
  sample: boolean;
};

const CARE: { test: RegExp; trade: Trade; level: Level }[] = [
  { test: /\b(rn|registered nurse|lpn|nurse practitioner|np|bsn|msn)\b/i, trade: "Nurse", level: "Charge" },
  { test: /\b(md|do|physician|doctor|attending)\b/i, trade: "Physician", level: "Attending" },
  { test: /\b(pharm|rph|pharmacist)\b/i, trade: "Pharmacist", level: "Staff" },
  { test: /\b(dds|dmd|dentist|dental)\b/i, trade: "Dentist", level: "Staff" },
  { test: /\b(pt|ot|slp|lcsw|lgpc|therapist|counselor|psycholog)\b/i, trade: "Therapist", level: "Staff" },
  { test: /\b(electrician|jw|inside wire)\b/i, trade: "Electrician", level: "Journeyman" },
  { test: /\b(plumb)\b/i, trade: "Plumber", level: "Journeyman" },
  { test: /\b(hvac|refrigerat)\b/i, trade: "HVAC", level: "Journeyman" },
  { test: /\b(weld)\b/i, trade: "Welder", level: "Journeyman" },
  { test: /\b(teacher|educator)\b/i, trade: "Teacher", level: "Staff" },
];

export function tradeOfProfession(profession: string): { trade: Trade; level: Level } {
  for (const row of CARE) {
    if (row.test.test(profession)) return { trade: row.trade, level: row.level };
  }
  return { trade: "Nurse", level: "Staff" };
}

function cell(row: Record<string, string>, names: string[]) {
  for (const n of names) {
    const v = row[n];
    if (v) return v;
  }
  return "";
}

function normKey(k: string) {
  return k.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

export function parseMhccCsv(raw: string): MhccRow[] {
  const text = raw.replace(/^\uFEFF/, "").trim();
  if (!text) return [];
  const lines = splitCsv(text);
  if (lines.length < 2) return [];
  const header = lines[0].map(normKey);
  const out: MhccRow[] = [];
  const seen = new Set<string>();
  for (const cells of lines.slice(1)) {
    const rec: Record<string, string> = {};
    header.forEach((h, i) => {
      rec[h] = (cells[i] ?? "").trim();
    });
    const license = cell(rec, ["license number", "license no", "license", "lic no", "lic", "number"]);
    const first = cell(rec, ["first name", "firstname", "first", "given name"]);
    const last = cell(rec, ["last name", "lastname", "last", "surname"]);
    if (!license || !last) continue;
    const profession = cell(rec, ["profession", "occupation", "license type", "type", "credential", "board profession"]);
    const { trade } = tradeOfProfession(profession || "Nurse");
    const id = `mhcc-${license.replace(/[^a-zA-Z0-9-]/g, "")}`.slice(0, 48);
    if (seen.has(id)) continue;
    seen.add(id);
    out.push({
      id,
      license,
      firstName: first || "Maryland",
      lastName: last,
      profession: profession || "Healthcare professional",
      trade,
      status: cell(rec, ["status", "license status"]) || "Active",
      city: cell(rec, ["city", "municipality"]) || "Baltimore",
      county: cell(rec, ["county"]),
      state: (cell(rec, ["state"]) || "MD").slice(0, 2).toUpperCase(),
      zip: cell(rec, ["zip", "zip code", "postal"]),
      issued: cell(rec, ["issue date", "issued", "date issued"]) || undefined,
      expires: cell(rec, ["expiration date", "expires", "expiry", "expiration"]) || undefined,
      board: cell(rec, ["board", "agency", "issuer"]) || "Maryland Labor · MHCC",
      source: "maryland-labor",
      sample: false,
    });
    if (out.length >= 5000) break;
  }
  return out;
}

function splitCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cur = "";
  let q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"' && text[i + 1] === '"') {
        cur += '"';
        i++;
      } else if (c === '"') q = false;
      else cur += c;
    } else if (c === '"') q = true;
    else if (c === ",") {
      row.push(cur);
      cur = "";
    } else if (c === "\n" || (c === "\r" && text[i + 1] !== "\n")) {
      row.push(cur);
      cur = "";
      if (row.some((x) => x.trim())) rows.push(row);
      row = [];
    } else if (c !== "\r") cur += c;
  }
  row.push(cur);
  if (row.some((x) => x.trim())) rows.push(row);
  return rows;
}

const CARE_PHOTOS = [
  "/portraits/camila-ruiz.jpg",
  "/portraits/priya-shah.jpg",
  "/portraits/imani-cole.jpg",
  "/portraits/linh-phan.jpg",
  "/portraits/omar-haddad.jpg",
  "/portraits/member.jpg",
];

export function personFromMhcc(row: MhccRow): Person {
  const name = `${row.firstName} ${row.lastName}`.trim();
  const { level } = tradeOfProfession(row.profession);
  const active = /active|current|valid/i.test(row.status);
  const photo = CARE_PHOTOS[Math.abs(hash(row.id)) % CARE_PHOTOS.length];
  return {
    id: row.id,
    name,
    trade: row.trade,
    level,
    city: row.city || "Baltimore",
    state: row.state || "MD",
    years: 5,
    travelMiles: 40,
    availability: active ? "open" : "not-looking",
    bio: `${row.profession}. Maryland Labor / MHCC book. ${row.board}.`,
    photo,
    cover: "/sites/hospital.jpg",
    specialties: [row.profession, row.county].filter(Boolean) as string[],
    tickets: [
      {
        id: `${row.id}-lic`,
        name: row.profession,
        issuer: row.board,
        number: row.license,
        issued: row.issued,
        expires: row.expires,
        verify: active ? "verified" : "unverified",
        source: {
          board: "Maryland Labor · MHCC",
          url: "https://www.labor.maryland.gov/",
          checkedAt: new Date().toISOString(),
          result: active ? "match" : "no-record",
          protocol: "other",
          holder: name,
          status: row.status,
        },
      },
    ],
    history: [],
    example: row.sample,
    deskVerified: !row.sample && active,
    book: "mhcc",
  };
}

function hash(s: string) {
  let n = 0;
  for (let i = 0; i < s.length; i++) n = (n * 31 + s.charCodeAt(i)) | 0;
  return n;
}

export const MHCC_SAMPLE: MhccRow[] = [
  { id: "mhcc-R248110", license: "R248110", firstName: "Amina", lastName: "Diallo", profession: "Registered Nurse", trade: "Nurse", status: "Active", city: "Baltimore", county: "Baltimore City", state: "MD", zip: "21201", issued: "2016-04-12", expires: "2027-04-30", board: "MBON", source: "maryland-labor", sample: true },
  { id: "mhcc-R190442", license: "R190442", firstName: "Keisha", lastName: "Owens", profession: "Registered Nurse", trade: "Nurse", status: "Active", city: "Silver Spring", county: "Montgomery", state: "MD", zip: "20910", issued: "2014-09-01", expires: "2026-09-30", board: "MBON", source: "maryland-labor", sample: true },
  { id: "mhcc-D33104", license: "D33104", firstName: "Priya", lastName: "Shah", profession: "Physician MD", trade: "Physician", status: "Active", city: "Baltimore", county: "Baltimore City", state: "MD", zip: "21287", issued: "2012-06-01", expires: "2027-09-30", board: "Maryland Board of Physicians", source: "maryland-labor", sample: true },
  { id: "mhcc-P22081", license: "P22081", firstName: "Imani", lastName: "Cole", profession: "Pharmacist", trade: "Pharmacist", status: "Active", city: "Baltimore", county: "Baltimore City", state: "MD", zip: "21201", issued: "2015-03-20", expires: "2026-12-31", board: "MD Board of Pharmacy", source: "maryland-labor", sample: true },
  { id: "mhcc-LCSW19442", license: "LCSW-C-19442", firstName: "Linh", lastName: "Phan", profession: "LCSW-C", trade: "Therapist", status: "Active", city: "Rockville", county: "Montgomery", state: "MD", zip: "20850", issued: "2018-01-15", expires: "2027-01-31", board: "MD Board of Social Work", source: "maryland-labor", sample: true },
  { id: "mhcc-DDS33108", license: "DDS-33108", firstName: "Omar", lastName: "Haddad", profession: "Dentist DDS", trade: "Dentist", status: "Active", city: "Bethesda", county: "Montgomery", state: "MD", zip: "20814", issued: "2013-08-08", expires: "2026-08-31", board: "Maryland State Board of Dental Examiners", source: "maryland-labor", sample: true },
  { id: "mhcc-R301228", license: "R301228", firstName: "Marisol", lastName: "Vega", profession: "Registered Nurse", trade: "Nurse", status: "Active", city: "Annapolis", county: "Anne Arundel", state: "MD", zip: "21401", issued: "2019-11-02", expires: "2027-11-30", board: "MBON", source: "maryland-labor", sample: true },
  { id: "mhcc-R277019", license: "R277019", firstName: "James", lastName: "Whitaker", profession: "Registered Nurse", trade: "Nurse", status: "Active", city: "Frederick", county: "Frederick", state: "MD", zip: "21701", issued: "2017-05-19", expires: "2026-05-31", board: "MBON", source: "maryland-labor", sample: true },
  { id: "mhcc-NP44102", license: "NP44102", firstName: "Camila", lastName: "Ruiz", profession: "Nurse Practitioner", trade: "Nurse", status: "Active", city: "Baltimore", county: "Baltimore City", state: "MD", zip: "21205", issued: "2018-02-11", expires: "2027-02-28", board: "MBON", source: "maryland-labor", sample: true },
  { id: "mhcc-MD11820", license: "MD11820", firstName: "Helen", lastName: "Cho", profession: "Physician MD", trade: "Physician", status: "Active", city: "Columbia", county: "Howard", state: "MD", zip: "21044", issued: "2010-07-01", expires: "2027-09-30", board: "Maryland Board of Physicians", source: "maryland-labor", sample: true },
];

export const MHCC_CSV_HINT =
  "License Number,First Name,Last Name,Profession,Status,City,County,State,ZIP,Issue Date,Expiration Date,Board";
