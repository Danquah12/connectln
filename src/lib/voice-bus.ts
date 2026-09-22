import { useForge } from "./store";

/** One voice at a time on the hall — wheel, reels, and feed share this. */

let clip: HTMLAudioElement | null = null;
let quietUntil = 0;
let userBroke = false;
let gen = 0;
const listeners = new Set<() => void>();

export function stopHallVoice() {
  if (!clip) return;
  clip.onended = null;
  clip.pause();
  clip.src = "";
  clip = null;
}

/** Kill every talking thing: clip, speech, picture-in-picture, feed. */
export function silenceHall() {
  gen += 1;
  userBroke = true;
  stopHallVoice();
  window.speechSynthesis?.cancel();
  void leavePictureInPicture();
  for (const fn of listeners) fn();
}

export function onHallSilence(fn: () => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export function playHallVoice(src: string, onEnded?: () => void) {
  stopHallVoice();
  window.speechSynthesis?.cancel();
  if (!src) {
    onEnded?.();
    return;
  }
  const token = ++gen;
  useForge.getState().markHeard();
  const a = new Audio(src);
  a.muted = false;
  a.volume = 1;
  clip = a;
  a.onended = () => {
    if (clip === a) clip = null;
    if (token === gen) onEnded?.();
  };
  void a.play().catch(() => {
    if (token === gen) onEnded?.();
  });
}

export async function leavePictureInPicture() {
  if (document.pictureInPictureElement) {
    await document.exitPictureInPicture().catch(() => undefined);
  }
}

export function markProgrammaticScroll() {
  quietUntil = Date.now() + 1000;
}

export function armHallScroll() {
  userBroke = false;
}

export function userBrokeTour() {
  return userBroke;
}

export function onUserPageScroll(cb: () => void) {
  const fn = () => {
    if (Date.now() < quietUntil) return;
    userBroke = true;
    cb();
  };
  window.addEventListener("scroll", fn, { passive: true });
  return () => window.removeEventListener("scroll", fn);
}

export function scrollHallInto(el: HTMLElement | null, inline: ScrollLogicalPosition = "center") {
  if (!el) return;
  markProgrammaticScroll();
  el.scrollIntoView({ behavior: "smooth", block: "nearest", inline });
}
