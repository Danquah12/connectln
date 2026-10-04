import { talkScript } from "./talk-scripts";
import type { Person, Trade } from "./types";

export type LineKind = "call" | "meet" | "voice" | "mail";

export type LineSession = {
  id: string;
  withId: string;
  kind: LineKind;
  startedAt: string;
  endedAt: string;
  transcript: string;
  summary: string;
  followSubject: string;
  followBody: string;
  audio?: string;
};

export type CrmAction = {
  id: string;
  personId: string;
  title: string;
  done: boolean;
  fromSession?: string;
};

export type DealStage = "lead" | "showing" | "offer" | "contract" | "closed" | "lost";

export type DealNote = {
  id: string;
  personId: string;
  address: string;
  stage: DealStage;
  next: string;
  notes: string;
  ai?: string;
};

type Pack = {
  opener: string;
  actions: string[];
  follow: string;
  deal?: boolean;
};

const PACK: Record<Trade, Pack> = {
  Electrician: {
    opener: "the tickets, the panel, when they can show",
    actions: ["Confirm OSHA / 70E on the card", "Send start window and shop address", "Ask who vouches the last hospital job"],
    follow: "Following the line. Tickets, start, who vouches the last job. Reply with the window.",
  },
  Plumber: {
    opener: "the ticket, the site, medical gas if they claim it",
    actions: ["Confirm license number", "Send site access hours", "Ask about the last medical-gas job"],
    follow: "Following the line. License, site hours, last job. Reply if you can take it.",
  },
  HVAC: {
    opener: "EPA 608, the unit, when they can be on the roof",
    actions: ["Confirm 608 on the card", "Send equipment list", "Lock a start morning"],
    follow: "Following the line. 608, gear, start. Reply with the morning you can take.",
  },
  Welder: {
    opener: "the process, the ticket, the booth or the site",
    actions: ["Confirm process and ticket", "Send WPS / coupon need", "Lock a start"],
    follow: "Following the line. Process, ticket, start. Reply if the coupon is current.",
  },
  Carpenter: {
    opener: "the scope, the hours, who ran the last crew",
    actions: ["Confirm scope and hours", "Ask who vouches the last job", "Send site time"],
    follow: "Following the line. Scope, hours, who vouches. Reply with the start.",
  },
  Ironworker: {
    opener: "the raising, Subpart R, when they can be in the air",
    actions: ["Confirm Subpart R", "Send site and raise time", "Ask who vouches"],
    follow: "Following the line. Subpart R, raise time. Reply if you can take it.",
  },
  Millwright: {
    opener: "the alignment, the ticket, the outage window",
    actions: ["Confirm millwright ticket", "Send outage window", "Ask last plant"],
    follow: "Following the line. Ticket, outage window. Reply with the hours you can cover.",
  },
  Solar: {
    opener: "the roof, fall protection, the interconnect",
    actions: ["Confirm fall protection", "Send array size", "Lock a weather window"],
    follow: "Following the line. Fall protection, array, weather. Reply with the day.",
  },
  Equipment: {
    opener: "the CDL, the machine, the hours",
    actions: ["Confirm CDL class", "Send machine and site", "Lock call time"],
    follow: "Following the line. CDL, machine, call time. Reply if you can take it.",
  },
  Elevator: {
    opener: "the hoistway, the ticket, the building window",
    actions: ["Confirm mechanic ticket", "Send building access", "Ask last modernization"],
    follow: "Following the line. Ticket, access, last job. Reply with the window.",
  },
  Lineman: {
    opener: "the climb, the ticket, the utility or the contractor",
    actions: ["Confirm the journeyman card", "Send the pole or the yard", "Ask who vouches the last hot job"],
    follow: "Following the line. Card, yard, who vouches. Reply if you can climb.",
  },
  Pipefitter: {
    opener: "the NCCER card, the system, the turnaround window",
    actions: ["Confirm pipefitting level", "Send the system and the outage", "Ask last steam or process job"],
    follow: "Following the line. Card, system, window. Reply if you can take it.",
  },
  "Sheet metal": {
    opener: "the layout, the fitting, the install",
    actions: ["Confirm the journeyman card", "Send the drawing", "Ask who ran the last shop"],
    follow: "Following the line. Card, drawing, shop. Reply if you can lay out.",
  },
  Mason: {
    opener: "the wall, the mortar, the hours on the trowel",
    actions: ["Confirm the masonry ticket", "Send the wall and the mix", "Ask last restoration"],
    follow: "Following the line. Ticket, wall, mix. Reply if you have laid this.",
  },
  Roofer: {
    opener: "the slope, the fall protection, the crew",
    actions: ["Confirm fall protection", "Send the roof and the start", "Ask who vouches the last steep job"],
    follow: "Following the line. Harness, roof, start. Reply if you can go up.",
  },
  "Sprinkler fitter": {
    opener: "the system, the UA card, the heads",
    actions: ["Confirm the fitter apprenticeship", "Send wet or dry and the floor", "Ask last tenant finish"],
    follow: "Following the line. Card, system, floor. Reply if you have hung heads.",
  },
  Machinist: {
    opener: "the print, the tolerance, the machine",
    actions: ["Confirm the shop hours", "Send the print", "Ask manual or CNC"],
    follow: "Following the line. Print, machine, hours. Reply if you can hold it.",
  },
  "Diesel technician": {
    opener: "the ASE card, the fleet, what is actually down",
    actions: ["Confirm ASE diesel", "Send the unit and the fault", "Ask last aftertreatment job"],
    follow: "Following the line. ASE, unit, fault. Reply if you can take the truck.",
  },
  Chef: {
    opener: "the station, the covers, who has run the line",
    actions: ["Confirm the kitchen years", "Send the station and the service", "Ask last house"],
    follow: "Following the line. Station, service, last house. Reply if you can hold it.",
  },
  "Truck driver": {
    opener: "the CDL, the lane, the MVR",
    actions: ["Confirm Class A", "Send the lane and home time", "Ask endorsements if the freight needs them"],
    follow: "Following the line. CDL, lane, home time. Reply if the MVR is clean.",
  },
  Barber: {
    opener: "the license on the wall, the chair, the book",
    actions: ["Confirm the state license", "Send the chair and the split", "Ask last shop"],
    follow: "Following the line. License, chair, split. Reply if you can take it.",
  },
  Nurse: {
    opener: "the compact, the unit, the block they can take",
    actions: ["Confirm compact / ACLS", "Send unit and shift", "Ask last hospital"],
    follow: "Following the line. Compact, unit, block. Reply if you can take the shift.",
  },
  Physician: {
    opener: "privileges, the census, the locums window",
    actions: ["Confirm privileges / DEA", "Send facility and dates", "Ask VA or locums last"],
    follow: "Following the line. Privileges, dates. Reply if the window works.",
  },
  Pharmacist: {
    opener: "the license, the Pyxis, the coverage block",
    actions: ["Confirm RPh", "Send coverage hours", "Ask last hospital pharmacy"],
    follow: "Following the line. License, coverage. Reply if you can take the block.",
  },
  Teacher: {
    opener: "the certificate, the room, the start",
    actions: ["Confirm state certificate", "Send campus and start", "Ask last assignment"],
    follow: "Following the line. Certificate, campus, start. Reply if you can take the room.",
  },
  Faculty: {
    opener: "the ticket they teach, the cohort, the hours",
    actions: ["Confirm CNE / license", "Send cohort dates", "Ask last clinical"],
    follow: "Following the line. License, cohort. Reply if you can take it.",
  },
  Developer: {
    opener: "the demo, the stack, when a shop can open it",
    actions: ["Ask for the live URL", "Confirm stack on the card", "Lock a walkthrough"],
    follow: "Following the line. Live URL, stack, walkthrough. Reply with the link.",
  },
  Realtor: {
    opener: "the listing, the showing, the next close",
    actions: ["Log the address and stage", "Send showing window", "Draft the follow-up to the other side"],
    follow: "Following the line. Address, showing, next. Reply with the window that actually works.",
    deal: true,
  },
  Agent: {
    opener: "the buyer, the showing, the license on the card",
    actions: ["Log buyer and stage", "Send showing list", "Ask VA or first-time if they claimed it"],
    follow: "Following the line. Showings, license, next. Reply with the list.",
    deal: true,
  },
  Therapist: {
    opener: "the license, the hour, whether the panel fits",
    actions: ["Confirm LCSW", "Send intake window", "Ask insurance / private"],
    follow: "Following the line. License, intake. Reply if the hour is open.",
  },
  Dentist: {
    opener: "the chair, the license, Thursday coverage",
    actions: ["Confirm DDS / DEA", "Send chair hours", "Ask Medicaid if they claimed it"],
    follow: "Following the line. License, chair hours. Reply if you can cover.",
  },
  Paramedic: {
    opener: "the registry, the truck, the block",
    actions: ["Confirm National Registry", "Send the shift", "Ask last service"],
    follow: "Following the line. Registry, shift, last service. Reply if you can take the truck.",
  },
  "Dental hygienist": {
    opener: "the RDH, the column, the state permit",
    actions: ["Confirm the hygiene license", "Send the columns", "Ask local anesthesia if the state wants it"],
    follow: "Following the line. License, columns, permit. Reply if you can take the week.",
  },
  Veterinarian: {
    opener: "the DVM, the license, the relief day",
    actions: ["Confirm the state license", "Send the practice and the day", "Ask DEA if they will write"],
    follow: "Following the line. License, day, DEA. Reply if you can cover.",
  },
  Midwife: {
    opener: "the CNM, the coverage, the hospital or the birth center",
    actions: ["Confirm CNM", "Send nights and the unit", "Ask last privileges"],
    follow: "Following the line. CNM, nights, privileges. Reply if you can cover.",
  },
  "Respiratory therapist": {
    opener: "the RRT, the vents, the night",
    actions: ["Confirm RRT", "Send the unit", "Ask last ICU"],
    follow: "Following the line. RRT, unit, night. Reply if you can take it.",
  },
  Firefighter: {
    opener: "the academy seal, the EMT, the lateral",
    actions: ["Confirm the state seal", "Send the department", "Ask EMT card"],
    follow: "Following the line. Seal, EMT, department. Reply if you can test.",
  },
  Inspector: {
    opener: "the ICC cards, the discipline, the department",
    actions: ["Confirm the inspector exams", "Send residential or commercial", "Ask last jurisdiction"],
    follow: "Following the line. Cards, discipline, jurisdiction. Reply with what you can sign.",
  },
  Appraiser: {
    opener: "the state credential, the file, the supervisor hours",
    actions: ["Confirm certified residential or general", "Send the file type", "Ask the board"],
    follow: "Following the line. Credential, file, board. Reply if you can take the month.",
  },
  Bookkeeper: {
    opener: "the books, the software, the sales tax",
    actions: ["Confirm the shops they keep", "Send the ledger and the cadence", "Ask CPA or not"],
    follow: "Following the line. Books, software, tax. Reply if you can take the two shops.",
  },
  Advisor: {
    opener: "the CFP, the book, the next review",
    actions: ["Confirm CFP / 66", "Send review window", "Ask who they sit with (teachers / vets / shops)"],
    follow: "Following the line. CFP, review window. Reply with the hour.",
  },
};

export function tradePack(trade: Trade): Pack {
  return PACK[trade];
}

export function isDealTrade(trade: Trade) {
  return Boolean(PACK[trade]?.deal);
}

export function fallbackTranscript(you: Person, them: Person, kind: LineKind) {
  const pack = tradePack(them.trade);
  const said = talkScript(them.id);
  const line =
    kind === "voice"
      ? "Voice note on the card."
      : kind === "meet"
        ? "ConnectLn room."
        : kind === "mail"
          ? "Hall mail thread."
          : "ConnectLn line.";
  return [
    `${line} ${you.name} with ${them.name}, ${them.trade}, ${them.city}.`,
    said || `${them.name} on the work: ${them.bio.slice(0, 140)}`,
    `Covered ${pack.opener}.`,
    them.tickets[0] ? `Ticket on the card: ${them.tickets[0].name}.` : "",
    `Next: ${pack.actions[0]}.`,
  ]
    .filter(Boolean)
    .join(" ");
}

export function runLineAi(input: {
  you: Person;
  them: Person;
  kind: LineKind;
  transcript: string;
}) {
  const { you, them, kind, transcript } = input;
  const pack = tradePack(them.trade);
  const text = transcript.trim() || fallbackTranscript(you, them, kind);
  const summary = [
    `${kind === "meet" ? "Room" : kind === "voice" ? "Voice note" : kind === "mail" ? "Hall mail" : "Line"} with ${them.name} (${them.trade}, ${them.city}).`,
    `Covered ${pack.opener}.`,
    them.tickets[0] ? `Ticket: ${them.tickets[0].name}.` : "",
    text.length > 160 ? text.slice(0, 220).trim() + "…" : text,
  ]
    .filter(Boolean)
    .join(" ");
  const actions = pack.actions.slice(0, 3);
  const followSubject = `${them.trade} follow-up · ${them.city}`;
  const followBody = [
    `${them.name} —`,
    "",
    pack.follow,
    "",
    `What we covered: ${pack.opener}.`,
    them.tickets[0] ? `On the card: ${them.tickets[0].name}.` : "",
    you.reachEmail ? `Outside: ${you.reachEmail}` : "",
    "",
    `${you.name}`,
    `${you.trade} · ${you.city}`,
  ]
    .filter((l) => l !== undefined)
    .join("\n");
  const dealNote = pack.deal
    ? `${them.name}. Stage still open. Next: ${pack.actions[1]}. ${text.slice(0, 180)}`
    : undefined;
  return { summary, actions, followSubject, followBody, dealNote, transcript: text };
}

export function runMailAi(input: {
  you: Person;
  them: Person;
  letters: { subject: string; body: string }[];
}) {
  const transcript = input.letters
    .map((l) => `${l.subject}. ${l.body}`)
    .join(" ");
  return runLineAi({ ...input, kind: "mail", transcript });
}

export const DEAL_STAGES: { id: DealStage; label: string }[] = [
  { id: "lead", label: "Lead" },
  { id: "showing", label: "Showing" },
  { id: "offer", label: "Offer" },
  { id: "contract", label: "Under contract" },
  { id: "closed", label: "Closed" },
  { id: "lost", label: "Lost" },
];
