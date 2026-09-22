import type { Vouch, VouchKind } from "./types";

export const VOUCH_KINDS: { id: VouchKind; label: string }[] = [
  { id: "quality", label: "Quality of work" },
  { id: "troubleshooting", label: "Troubleshooting" },
  { id: "leadership", label: "Leadership" },
  { id: "reliability", label: "Reliability" },
  { id: "safety", label: "Safety" },
  { id: "teaching", label: "Teaching" },
];

export function vouchKindLabel(id: VouchKind) {
  return VOUCH_KINDS.find((k) => k.id === id)?.label ?? id;
}

export function kindsForBody(body: string): VouchKind[] {
  const b = body.toLowerCase();
  const k = new Set<VouchKind>(["quality"]);
  if (/show|early|again|on time|reliab/.test(b)) k.add("reliability");
  if (/teach|explain|student|lesson|apprentice|faculty/.test(b)) k.add("teaching");
  if (/fall|safety|osha|protect|punch/.test(b)) k.add("safety");
  if (/foreman|crew|lead|staff|department|charge/.test(b)) k.add("leadership");
  if (/weld|troubleshoot|gearbox|panel|pipe|vent|census/.test(b)) k.add("troubleshooting");
  return [...k];
}

export function withVouchKinds(v: Vouch): Vouch {
  return v.kinds?.length ? v : { ...v, kinds: kindsForBody(v.body) };
}
