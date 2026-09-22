/** Camera access that actually prompts — nested preview windows never do. */

export const CLIP_MESSAGE = "connectln-clip";

export type ClipMessage = { source: typeof CLIP_MESSAGE; video: string };

export function inEmbeddedFrame() {
  if (typeof window === "undefined") return false;
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
}

export function cameraErrorMessage(err: unknown) {
  const name = err instanceof DOMException ? err.name : "";
  if (name === "NotAllowedError" || name === "PermissionDeniedError" || name === "SecurityError") {
    if (inEmbeddedFrame()) {
      return "This nested window cannot ask for the camera. Open the recorder — the browser will prompt there.";
    }
    return "Camera was blocked. Tap the lock in the address bar, allow camera and mic, then try again.";
  }
  if (name === "NotFoundError") return "No camera on this device. Upload a clip or write the line.";
  if (name === "OverconstrainedError") return "This camera cannot use those settings. Trying a simpler open.";
  if (name === "NotReadableError") return "Camera is in use by another app. Close it and try again.";
  if (name === "NotSupportedError") return "This browser will not open a camera. Upload a clip instead.";
  return "Could not open the camera. Upload a clip or write the line.";
}

export async function openCamera(kind: "video" | "audio" = "video"): Promise<MediaStream> {
  if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
    throw new DOMException("Camera API missing", "NotSupportedError");
  }
  const video = kind === "video" ? { facingMode: "user" as const } : false;
  try {
    return await navigator.mediaDevices.getUserMedia({ video, audio: true });
  } catch (err) {
    if (kind === "video" && err instanceof DOMException && err.name === "OverconstrainedError") {
      return await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    }
    throw err;
  }
}

export function recorderMime() {
  if (typeof MediaRecorder === "undefined") return "";
  for (const t of ["video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm", "video/mp4"]) {
    if (MediaRecorder.isTypeSupported(t)) return t;
  }
  return "";
}

export function blobToDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(typeof reader.result === "string" ? reader.result : "");
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

export function openCameraBooth(opts: { mode?: string; cap?: number } = {}) {
  const url = new URL("/record", window.location.origin);
  if (opts.mode) url.searchParams.set("mode", opts.mode);
  if (opts.cap) url.searchParams.set("cap", String(opts.cap));
  return window.open(url.toString(), `connectln-cam-${Date.now()}`, "popup,width=420,height=780");
}

export function listenForClip(onClip: (video: string) => void) {
  const onMessage = (event: MessageEvent) => {
    if (event.origin !== window.location.origin) return;
    const data = event.data as ClipMessage | undefined;
    if (data?.source !== CLIP_MESSAGE || typeof data.video !== "string") return;
    onClip(data.video);
  };
  window.addEventListener("message", onMessage);
  return () => window.removeEventListener("message", onMessage);
}

export function postClipToOpener(video: string) {
  const payload: ClipMessage = { source: CLIP_MESSAGE, video };
  window.opener?.postMessage(payload, window.location.origin);
}
