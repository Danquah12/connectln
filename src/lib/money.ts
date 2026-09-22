export const HOUSE_BILL = "Expedite Consults LLC";

export const TAKE = {
  shop: 79,
  listing: 149,
  urgent: 299,
  fill: 250,
  ticket: 12,
} as const;

export type LedgerKind = "shop" | "listing" | "fill" | "ticket";

export type LedgerLine = {
  id: string;
  kind: LedgerKind;
  at: string;
  shopId: string;
  shop: string;
  label: string;
  gross: number;
  callId?: string;
  personId?: string;
};

export function takeLabel(kind: LedgerKind) {
  switch (kind) {
    case "shop":
      return "Shop board · month";
    case "listing":
      return "Call seat";
    case "fill":
      return "Fill receipt";
    case "ticket":
      return "Ticket check";
  }
}
