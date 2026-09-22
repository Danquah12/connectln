/** 11-char YouTube id, or empty. */
export function youtubeId(raw?: string) {
  if (!raw) return "";
  const t = raw.trim();
  if (/^[A-Za-z0-9_-]{11}$/.test(t)) return t;
  const m = t.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?.*v=|embed\/|shorts\/))([A-Za-z0-9_-]{11})/);
  return m?.[1] ?? "";
}

export function youtubeThumb(id: string, size: "wide" | "hq" = "hq") {
  return size === "wide"
    ? `https://i.ytimg.com/vi/${id}/sddefault.jpg`
    : `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
}

export function youtubeWatch(id: string) {
  return `https://www.youtube.com/watch?v=${id}`;
}

export function youtubeEmbed(id: string, opts?: { autoplay?: boolean; mute?: boolean; jsapi?: boolean; controls?: boolean; start?: number }) {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const q = new URLSearchParams({
    rel: "0",
    modestbranding: "1",
    playsinline: "1",
    iv_load_policy: "3",
    cc_load_policy: "0",
  });
  if (opts?.controls) {
    q.set("controls", "1");
    q.set("fs", "1");
  } else {
    q.set("controls", "0");
    q.set("fs", "0");
    q.set("disablekb", "1");
  }
  if (origin) q.set("origin", origin);
  if (opts?.autoplay) q.set("autoplay", "1");
  q.set("mute", opts?.mute === false ? "0" : "1");
  if (opts?.start && opts.start >= 1) q.set("start", String(Math.floor(opts.start)));
  if (opts?.jsapi !== false) q.set("enablejsapi", "1");
  return `https://www.youtube-nocookie.com/embed/${id}?${q.toString()}`;
}

export function youtubeCommand(iframe: HTMLIFrameElement | null, func: string, args: unknown[] = []) {
  iframe?.contentWindow?.postMessage(JSON.stringify({ event: "command", func, args }), "*");
}

export function youtubeListen(iframe: HTMLIFrameElement | null) {
  iframe?.contentWindow?.postMessage(JSON.stringify({ event: "listening", id: "1" }), "*");
}

export function youtubeSeek(iframe: HTMLIFrameElement | null, seconds: number) {
  if (!iframe || !Number.isFinite(seconds) || seconds < 1) return;
  youtubeCommand(iframe, "seekTo", [Math.floor(seconds), true]);
}

export function youtubeTimeFromMessage(data: unknown): number | null {
  if (!data || typeof data !== "object") return null;
  const row = data as { event?: string; info?: unknown };
  if (row.event !== "infoDelivery" && row.event !== "onStateChange") return null;
  if (typeof row.info === "number") return null;
  if (!row.info || typeof row.info !== "object") return null;
  const t = (row.info as { currentTime?: number }).currentTime;
  return typeof t === "number" && t >= 0 ? t : null;
}
