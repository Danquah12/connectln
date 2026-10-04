import type { Trade } from "./types";

/**
 * The job title has to name the calling.
 * "Electrical engineer" is not an electrician. "Business developer" is not a developer.
 */
const RULES: [Trade, RegExp][] = [
  ["Dental hygienist", /\bdental hygienist\b|\brdh\b/i],
  ["Pharmacist", /\bpharmacist\b/i],
  ["Dentist", /\b(dentist|orthodontist)\b/i],
  ["Respiratory therapist", /\brespiratory therapist\b|\brrt\b/i],
  ["Midwife", /\b(midwife|cnm)\b/i],
  ["Paramedic", /\bparamedic\b/i],
  ["Therapist", /\b(therapist|counselor|psychotherapist)\b|\b(lcsw|lmft|lpc|lmhc)\b/i],
  ["Veterinarian", /\b(veterinarian|dvm)\b/i],
  ["Firefighter", /\bfirefighter\b/i],
  ["Nurse", /\b(registered nurse|nurse practitioner|licensed practical nurse|staff nurse|travel nurse|icu nurse|nurse)\b|\b(rn|lpn|cna)\b/i],
  ["Physician", /\b(physician|hospitalist|psychiatrist|surgeon|pediatrician|cardiologist|anesthesiologist)\b/i],
  ["Faculty", /\b(professor|lecturer)\b/i],
  ["Teacher", /\b(teacher|schoolteacher)\b/i],
  ["Lineman", /\blineman\b|\blineworker\b/i],
  ["Electrician", /\b(electrician|wireman|electrical technician|electrical apprentice)\b/i],
  ["Pipefitter", /\bpipefitter\b|\bsteamfitter\b/i],
  ["Sheet metal", /\bsheet metal\b/i],
  ["Sprinkler fitter", /\bsprinkler fitter\b/i],
  ["HVAC", /\bhvac\b|\b(refrigeration|heating) technician\b/i],
  ["Plumber", /\b(plumber|plumbing technician|plumbing apprentice)\b/i],
  ["Welder", /\bwelder\b/i],
  ["Carpenter", /\bcarpenter\b/i],
  ["Mason", /\bmason\b/i],
  ["Roofer", /\broofer\b/i],
  ["Ironworker", /\bironworker\b/i],
  ["Millwright", /\bmillwright\b/i],
  ["Machinist", /\bmachinist\b/i],
  ["Diesel technician", /\bdiesel (technician|mechanic)\b/i],
  ["Solar", /\bsolar (installer|technician|apprentice)\b/i],
  ["Elevator", /\belevator (mechanic|technician|constructor|apprentice)\b/i],
  ["Truck driver", /\b(truck driver|cdl)\b/i],
  ["Chef", /\bchef\b/i],
  ["Barber", /\bbarber\b/i],
  ["Inspector", /\b(building inspector|home inspector|inspector)\b/i],
  ["Appraiser", /\bappraiser\b/i],
  ["Bookkeeper", /\bbookkeeper\b/i],
  ["Equipment", /\b(heavy )?equipment operator\b/i],
  ["Realtor", /\brealtor\b/i],
  ["Agent", /\breal estate agent\b/i],
  ["Advisor", /\b(investment adviser|investment advisor|wealth manager|financial planner|portfolio manager|financial advisor|wealth advisor|asset manager)\b/i],
  ["Developer", /\b(software|web|frontend|front-end|backend|back-end|full[- ]stack|ios|android|mobile) (engineer|developer)\b|\bsoftware developer\b/i],
];

export function callingOf(title: string): Trade | null {
  const text = title.replace(/\s+/g, " ").trim();
  if (!text) return null;
  let hit: Trade | null = null;
  for (const [trade, rule] of RULES) {
    if (rule.test(text)) {
      hit = trade;
      break;
    }
  }
  if (!hit) return null;
  if (/\b(recruiter|recruiting|sales|marketing|account executive)\b/i.test(text)) return null;
  if (hit !== "Developer" && /\b(engineer|engineering)\b/i.test(text)) return null;
  return hit;
}

/** Public listings must prove the calling in the title. A shop's own post can keep the trade they set. */
export function seatOf(call: { title: string; trade: Trade; wire?: boolean }): Trade | null {
  const fromTitle = callingOf(call.title);
  if (call.wire) return fromTitle;
  return fromTitle ?? call.trade;
}
