export function deskSearch(raw: Record<string, unknown>): { bay?: string } {
  return typeof raw.bay === "string" ? { bay: raw.bay } : {};
}

export const COMMAND_HOME = "/admin";
export const COMMAND_LOGIN = "/admin/login";
export const HALL_LOGIN = "/login";
