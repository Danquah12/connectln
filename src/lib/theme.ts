export const HALL_THEMES = [
  { id: "night", name: "Night", swatch: "#0B0D10" },
  { id: "paper", name: "Paper", swatch: "#F5F7FA" },
  { id: "nordic", name: "Nordic Blue", swatch: "#2F5F8A" },
  { id: "pine", name: "Pine", swatch: "#1A3A2C" },
  { id: "shop", name: "Shop", swatch: "#EFE8DC" },
] as const;

export type HallTheme = (typeof HALL_THEMES)[number]["id"];

export function isHallTheme(v: unknown): v is HallTheme {
  return HALL_THEMES.some((t) => t.id === v);
}
