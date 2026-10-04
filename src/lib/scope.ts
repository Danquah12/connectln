import { TRADE_GROUPS } from "./seed";
import type { FieldGroup, Trade } from "./types";

export function groupOf(trade: Trade): FieldGroup {
  return TRADE_GROUPS.find((g) => g.trades.includes(trade))?.id ?? "trades";
}

export function hallLabel(trade: Trade) {
  switch (trade) {
    case "Nurse":
      return "Nurses";
    case "Physician":
      return "Physicians";
    case "Pharmacist":
      return "Pharmacists";
    case "Teacher":
      return "Teachers";
    case "Faculty":
      return "Faculty";
    case "Developer":
      return "Builders";
    case "Realtor":
      return "Realtors";
    case "Agent":
      return "Agents";
    case "Therapist":
      return "Therapists";
    case "Dentist":
      return "Dentists";
    case "Advisor":
      return "Advisors";
    case "Lineman":
      return "Linemen";
    case "Sheet metal":
      return "Sheet metal";
    case "Midwife":
      return "Midwives";
    case "HVAC":
      return "HVAC";
    default:
      return `${trade}s`;
  }
}
