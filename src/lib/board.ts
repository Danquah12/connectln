import { TRADE_GROUPS, TRADES } from "./seed";
import { groupOf } from "./scope";
import type { FieldGroup, Trade } from "./types";

export type BoardSearch = {
  trade?: Trade;
  group?: FieldGroup;
};

export function parseBoardSearch(raw: Record<string, unknown>): BoardSearch {
  const trade =
    typeof raw.trade === "string" && (TRADES as readonly string[]).includes(raw.trade)
      ? (raw.trade as Trade)
      : undefined;
  const groupRaw =
    typeof raw.group === "string" && TRADE_GROUPS.some((g) => g.id === raw.group)
      ? (raw.group as FieldGroup)
      : undefined;
  if (trade && groupRaw && groupOf(trade) !== groupRaw) return { group: groupRaw };
  if (trade) return { trade, group: groupOf(trade) };
  return { trade: undefined, group: groupRaw };
}

export function boardState(
  search: BoardSearch,
  fallback?: Trade,
): { group: "all" | FieldGroup; trade: Trade | "all" } {
  if (search.trade) return { group: groupOf(search.trade), trade: search.trade };
  if (search.group) return { group: search.group, trade: "all" };
  if (fallback) return { group: groupOf(fallback), trade: "all" };
  return { group: "all", trade: "all" };
}

export function boardSearchOf(group: "all" | FieldGroup, trade: Trade | "all"): BoardSearch {
  if (trade !== "all") return { trade, group: groupOf(trade) };
  if (group !== "all") return { group, trade: undefined };
  return {};
}

export function matchesBoard(
  personTrade: Trade | undefined,
  group: "all" | FieldGroup,
  trade: Trade | "all",
) {
  if (!personTrade) return false;
  if (trade !== "all") return personTrade === trade;
  if (group !== "all") return groupOf(personTrade) === group;
  return true;
}
