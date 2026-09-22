/** One hall clip in view plays. The rest are stopped. */

import { stopHallVoice } from "./voice-bus";

type ClipCtl = { play: () => void; pause: () => void };

const nodes = new Map<Element, ClipCtl>();
let focused: Element | null = null;
let ticking = false;
let listening = false;
let soundOn = false;

export function hallSoundOn() {
  return soundOn;
}

export function armHallSound(on = true) {
  soundOn = on;
}

function choose() {
  const mid = window.innerHeight * 0.45;
  let best: { el: Element; dist: number; ratio: number } | null = null;
  for (const el of nodes.keys()) {
    const r = el.getBoundingClientRect();
    const vis = Math.min(r.bottom, window.innerHeight) - Math.max(r.top, 0);
    if (vis < 48) continue;
    const ratio = vis / Math.max(r.height, 1);
    if (ratio < 0.22) continue;
    const dist = Math.abs((r.top + r.bottom) / 2 - mid);
    if (!best || dist < best.dist || (Math.abs(dist - best.dist) < 12 && ratio > best.ratio)) {
      best = { el, dist, ratio };
    }
  }
  const next = best?.el ?? null;
  if (next === focused) return;
  for (const [el, ctl] of nodes) {
    if (el !== next) ctl.pause();
  }
  focused = next;
  if (next) {
    stopHallVoice();
    nodes.get(next)?.play();
  }
}

function schedule() {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(() => {
    ticking = false;
    choose();
  });
}

function ensureListen() {
  if (listening) return;
  listening = true;
  window.addEventListener("scroll", schedule, { passive: true, capture: true });
  window.addEventListener("resize", schedule);
  document.addEventListener("scroll", schedule, { passive: true, capture: true });
}

export function registerHallClip(el: Element, ctl: ClipCtl) {
  nodes.set(el, ctl);
  ensureListen();
  const io = new IntersectionObserver(() => schedule(), {
    threshold: [0, 0.2, 0.4, 0.6, 0.8, 1],
  });
  io.observe(el);
  schedule();
  return () => {
    io.disconnect();
    nodes.delete(el);
    if (focused === el) {
      ctl.pause();
      focused = null;
    }
    schedule();
  };
}

export function scrollToNextFeedPost(from: Element | null) {
  if (!from) return;
  const posts = [...document.querySelectorAll("[data-feed-post]")];
  const card = from.closest("[data-feed-post]");
  if (!(card instanceof Element)) return;
  const next = posts[posts.indexOf(card) + 1];
  if (!(next instanceof HTMLElement)) return;
  next.scrollIntoView({ behavior: "smooth", block: "center" });
}

export function pauseAllHallClips() {
  for (const ctl of nodes.values()) ctl.pause();
  focused = null;
}

export function playNextHallClip(from: Element | null) {
  const card = from?.closest("[data-feed-post]");
  if (focused) {
    nodes.get(focused)?.pause();
    focused = null;
  }
  scrollToNextFeedPost(from);
  window.setTimeout(() => {
    if (card instanceof Element) {
      const clip = card.querySelector("[data-hall-clip]");
      if (clip instanceof Element) nodes.get(clip)?.pause();
    }
    schedule();
  }, 420);
}
