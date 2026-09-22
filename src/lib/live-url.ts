/** Accept a paste of a Vercel (or any https) demo. Reject javascript: and relatives. */
export function liveHref(raw: string): string | undefined {
  const t = raw.trim();
  if (!t) return undefined;
  try {
    const u = new URL(/^https?:\/\//i.test(t) ? t : `https://${t}`);
    if (u.protocol !== "http:" && u.protocol !== "https:") return undefined;
    if (!u.hostname) return undefined;
    return u.toString();
  } catch {
    return undefined;
  }
}

export function hostedOn(url?: string) {
  if (!url) return "";
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    if (host.endsWith("vercel.app")) return "Live on Vercel";
    return host;
  } catch {
    return "";
  }
}
