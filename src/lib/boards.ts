import type { BoardResult, Ticket, TicketSource } from "./types";
import { deskForTicket, reportToSource, runProtocol } from "./verify-protocol";

export type Board = {
  id: string;
  name: string;
  url: string;
  match: RegExp;
};

/** Public lookup desks we can send a person to. No private API keys. */
export const BOARDS: Board[] = [
  { id: "nursys", name: "Nursys QuickConfirm", url: "https://www.nursys.com/LQC/LQCSearch.aspx", match: /nlc|nursys|compact|bon texas|board of nursing|rn —|rn\s/i },
  { id: "dora", name: "Colorado DORA", url: "https://apps2.colorado.gov/dora/licensing/lookup/licenselookup.aspx", match: /dora|state of colorado|colorado dpo|real estate/i },
  { id: "azbom", name: "Arizona BOM", url: "https://azmd.gov/DoctorSearch/DoctorSearch", match: /arizona bom|abim|md — arizona/i },
  { id: "mdbop", name: "Maryland Board of Pharmacy", url: "https://mdbop.mylicense.com/verification/", match: /md board of pharmacy|pharmd/i },
  { id: "gapsc", name: "GaPSC", url: "https://www.gapsc.com/Certification/Lookup.aspx", match: /gapsc|ga teaching/i },
  { id: "widpi", name: "Wisconsin DPI", url: "https://license.wi.gov", match: /dpi wisconsin|wi lifetime/i },
  { id: "tsbde", name: "Texas Dental Board", url: "https://www.tsbde.texas.gov/look-up-a-license/", match: /tsbde|dds — texas/i },
  { id: "mhcc", name: "Maryland Labor / MHCC", url: "https://www.labor.maryland.gov/", match: /mhcc|maryland labor|mbon|maryland board of/i },
  { id: "finra", name: "FINRA BrokerCheck", url: "https://brokercheck.finra.org", match: /finra|series 7|series 66/i },
  { id: "cfp", name: "CFP Board", url: "https://www.cfp.net/verify-a-cfp-professional", match: /cfp board|^cfp$/i },
  { id: "dea", name: "DEA", url: "https://apps.deadiversion.usdoj.gov/webforms2/spring/validationLogin", match: /^dea$/i },
  { id: "pa", name: "Pennsylvania L&I", url: "https://www.pals.pa.gov/", match: /pennsylvania/i },
  { id: "tx", name: "Texas TDLR", url: "https://www.tdlr.texas.gov/LicenseSearch/", match: /state of texas/i },
  { id: "il", name: "IDFPR", url: "https://online-dfpr.micropact.com/lookup/licenselookup.aspx", match: /illinois/i },
  { id: "mo", name: "Missouri DOR", url: "https://s1.sos.mo.gov/BusinessEntity/soskb/csearch.asp", match: /missouri/i },
];

export function boardFor(ticket: Pick<Ticket, "issuer" | "name">): Board | undefined {
  const hay = `${ticket.issuer} ${ticket.name}`;
  return BOARDS.find((b) => b.match.test(hay));
}

/** Seeded numbers we treat as on the public roll. A fake number fails. */
const ROLL = new Set(
  [
    "JE-441902",
    "M-22941",
    "ME-10028",
    "EL-8821",
    "MW-441",
    "RN-448201",
    "MD-33104",
    "P-22081",
    "T-882194",
    "EL-22910",
    "RN-10442",
    "EA-441902",
    "EA-882014",
    "LCSW-C-19442",
    "1841729301",
    "DDS-33108",
    "CFP-188204",
    "INS-44102",
    "SY0-44119",
    "608-U",
  ].map((n) => n.replace(/\s+/g, "").toUpperCase()),
);

function clean(n?: string) {
  return (n ?? "").replace(/\s+/g, "").toUpperCase();
}

export function checkBoard(ticket: Ticket, holder?: string): { source: TicketSource; verify: Ticket["verify"] } {
  const desk = deskForTicket(ticket);
  if (desk) {
    const report = runProtocol({
      desk,
      number: ticket.number,
      holder,
      ticketName: ticket.name,
      claimsCompact: /compact|nlc|multistate/i.test(`${ticket.name} ${ticket.issuer}`),
      completed: ticket.osha?.completed || ticket.issued,
      trainer: ticket.osha?.trainer,
      trainerId: ticket.osha?.trainerId,
      ato: ticket.osha?.ato,
      qr: ticket.osha?.qr,
      document: Boolean(ticket.document),
      hours: ticket.osha?.hours,
      industry: ticket.osha?.industry,
    });
    const verify: Ticket["verify"] =
      report.result === "match" || report.result === "stale"
        ? "verified"
        : report.result === "needs-paper" || report.result === "unconfirmed"
          ? "pending"
          : "unverified";
    return {
      source: reportToSource(report),
      verify,
    };
  }

  const board = boardFor(ticket);
  const checkedAt = new Date().toISOString();

  if (!clean(ticket.number)) {
    return {
      source: { board: board?.name ?? ticket.issuer, url: board?.url, checkedAt, result: "needs-number" },
      verify: "unverified",
    };
  }

  if (!board) {
    return {
      source: { board: ticket.issuer, checkedAt, result: "no-lookup" },
      verify: ticket.verify ?? "pending",
    };
  }

  const onRoll = ROLL.has(clean(ticket.number));
  const result: BoardResult = onRoll ? "match" : "no-record";
  return {
    source: { board: board.name, url: board.url, checkedAt, result, protocol: "other" },
    verify: onRoll ? "verified" : "unverified",
  };
}

export function boardResultLabel(result: BoardResult) {
  if (result === "match") return "On the board";
  if (result === "no-record") return "No record";
  if (result === "needs-number") return "Needs a number";
  if (result === "needs-paper") return "Needs photo / trainer";
  if (result === "stale") return "Confirmed · stale for shop recency";
  if (result === "unconfirmed") return "Waiting on trainer / ATO";
  return "No public lookup";
}
