export type ReportRisk = "low" | "review" | "high";
export type ReportKind = "post" | "reel" | "listing" | "call" | "comment" | "talk" | "person" | "line";
export type ReportReason =
  | "spam"
  | "scam"
  | "fake-call"
  | "harassment"
  | "impersonation"
  | "unsafe";

export type Report = {
  id: string;
  kind: ReportKind;
  target: string;
  targetId?: string;
  reason: ReportReason;
  risk: ReportRisk;
  by: string;
};

export type LedgerRow = {
  id: string;
  listing: string;
  buyer: string;
  seller: string;
  gross: number;
  fee: number;
  status: "paid" | "held" | "refund";
};

export const seedReports: Report[] = [
  {
    id: "q1",
    kind: "listing",
    target: "OSHA 30 notes — $4,900 'masterclass'",
    reason: "scam",
    risk: "high",
    by: "Keisha Owens",
  },
  {
    id: "q2",
    kind: "call",
    target: "Need 40 electricians tomorrow · $18/hr · 'bring own tools'",
    reason: "fake-call",
    risk: "high",
    by: "Tomasz Kowalski",
  },
  {
    id: "q3",
    kind: "comment",
    target: "Reply under Camila's MICU post",
    reason: "harassment",
    risk: "review",
    by: "Camila Ruiz",
  },
  {
    id: "q4",
    kind: "reel",
    target: "Stock footage labeled as a 6G pass",
    reason: "impersonation",
    risk: "review",
    by: "DeShawn Brooks",
  },
  {
    id: "q5",
    kind: "talk",
    target: "Five-minute unit with no license on the card",
    reason: "unsafe",
    risk: "low",
    by: "Denise Harper",
  },
];

export const seedLedger: LedgerRow[] = [
  {
    id: "ord-1",
    listing: "Ticket Wallet",
    buyer: "Apex Electric",
    seller: "Lena Cho",
    gross: 49,
    fee: 5,
    status: "paid",
  },
  {
    id: "ord-2",
    listing: "OSHA 30 — weekend notes",
    buyer: "Keisha Owens",
    seller: "Tomasz Kowalski",
    gross: 49,
    fee: 5,
    status: "paid",
  },
  {
    id: "ord-3",
    listing: "6G coupon stills",
    buyer: "Sam Park",
    seller: "DeShawn Brooks",
    gross: 8,
    fee: 1,
    status: "held",
  },
  {
    id: "ord-4",
    listing: "MICU night board",
    buyer: "St. Joseph",
    seller: "Andre Voss",
    gross: 49,
    fee: 5,
    status: "paid",
  },
];

export const seedAudit = [
  { t: "today 16:10", who: "Desk", action: "Took invite — Keisha Owens (crew)" },
  { t: "today 15:42", who: "Desk", action: "Listed Ticket Wallet on the developer aisle" },
  { t: "today 14:05", who: "Tomasz Kowalski", action: "Opened Aurora hospital call" },
  { t: "yesterday", who: "Desk", action: "OSHA 30 flagged — expires in 49d (Jordan Hale)" },
];

export const defaultFlags = {
  reels: true,
  market: true,
  talks: true,
  calls: true,
  sos: true,
  live: false,
};

export const health = [
  { name: "Board", ok: true },
  { name: "Seats", ok: true },
  { name: "Talks / video", ok: true },
  { name: "Market (simulated)", ok: true },
  { name: "Search", ok: true },
  { name: "Live streaming", ok: false },
];
