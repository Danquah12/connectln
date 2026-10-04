/** One hall clip in view plays. Scroll past it and it keeps going in the corner. */

import { stopHallVoice } from "./voice-bus";

type ClipCtl = { play: () => void; pause: () => void };

const nodes = new Map<Element, ClipCtl>();
let focused: Element | null = null;
let skip: Element | null = null;
let dismissed: Element | null = null;
let pin: Element | null = null;
let pinUntil = 0;
let ticking = false;
let listening = false;
let soundOn = false;

export function hallSoundOn() {
  return soundOn;
}

export function armHallSound(on = true) {
  soundOn = on;
}

let holds = 0;

function spacerOf(el: Element) {
  const prev = el.previousElementSibling;
  if (prev instanceof HTMLElement && prev.dataset.hallPipSpacer === "1") return prev;
  return null;
}

function anchorRect(el: Element) {
  return (spacerOf(el) ?? el).getBoundingClientRect();
}

function seen(el: Element) {
  const r = anchorRect(el);
  const vis = Math.min(r.bottom, window.innerHeight) - Math.max(r.top, 0);
  const ratio = vis / Math.max(r.height, 1);
  return { vis, ratio };
}

function undock(el: Element) {
  if (!(el instanceof HTMLElement)) return;
  el.classList.remove("hall-pip");
  spacerOf(el)?.remove();
  el.querySelector("[data-pip-close]")?.remove();
}

function dock(el: HTMLElement) {
  if (el.classList.contains("hall-pip") || dismissed === el) return;
  if (el.offsetHeight < 72) return;
  const spacer = document.createElement("div");
  spacer.dataset.hallPipSpacer = "1";
  spacer.style.height = `${el.offsetHeight}px`;
  spacer.setAttribute("aria-hidden", "true");
  el.before(spacer);
  el.classList.add("hall-pip");
  const close = document.createElement("button");
  close.type = "button";
  close.dataset.pipClose = "1";
  close.className = "hall-pip-close";
  close.setAttribute("aria-label", "Close the small film");
  close.textContent = "×";
  close.addEventListener("click", (e) => {
    e.stopPropagation();
    e.preventDefault();
    dismissed = el;
    undock(el);
    nodes.get(el)?.pause();
    if (focused === el) focused = null;
  });
  el.appendChild(close);
}

/** Pause the feed while a related film is open, and keep scroll from starting another. */
export function holdHall(on: boolean) {
  holds += on ? 1 : -1;
  if (holds < 0) holds = 0;
  if (holds > 0) {
    if (focused) undock(focused);
    for (const ctl of nodes.values()) ctl.pause();
    focused = null;
    return;
  }
  schedule();
}

function choose() {
  if (holds > 0) {
    if (focused) undock(focused);
    for (const ctl of nodes.values()) ctl.pause();
    focused = null;
    return;
  }
  if (pin && Date.now() < pinUntil && nodes.has(pin)) {
    for (const [el, ctl] of nodes) {
      if (el !== pin) ctl.pause();
    }
    focused = pin;
    return;
  }
  pin = null;
  const mid = window.innerHeight * 0.45;
  let best: { el: Element; dist: number; ratio: number } | null = null;
  for (const el of nodes.keys()) {
    if (el === skip) continue;
    const { vis, ratio } = seen(el);
    if (el === dismissed) {
      if (ratio >= 0.45) dismissed = null;
      else continue;
    }
    if (vis < 48 || ratio < 0.22) continue;
    const r = anchorRect(el);
    const dist = Math.abs((r.top + r.bottom) / 2 - mid);
    if (!best || dist < best.dist || (Math.abs(dist - best.dist) < 12 && ratio > best.ratio)) {
      best = { el, dist, ratio };
    }
  }
  const next = best?.el ?? null;
  if (next === focused) {
    if (focused instanceof HTMLElement && focused.classList.contains("hall-pip") && best && best.ratio >= 0.22) {
      undock(focused);
    }
    return;
  }
  if (!next && focused && nodes.has(focused)) {
    if (focused instanceof HTMLElement) dock(focused);
    return;
  }
  for (const [el, ctl] of nodes) {
    if (el !== next) {
      undock(el);
      ctl.pause();
    }
  }
  focused = next;
  if (next) skip = null;
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
    undock(el);
    if (focused === el) {
      ctl.pause();
      focused = null;
    }
    if (dismissed === el) dismissed = null;
    schedule();
  };
}

export function pinHallClip(el: Element | null, ms = 800) {
  if (!el || !nodes.has(el)) return;
  pin = el;
  pinUntil = Date.now() + ms;
  for (const [node, ctl] of nodes) {
    if (node !== el) {
      undock(node);
      ctl.pause();
    }
  }
  focused = el;
  dismissed = null;
  skip = null;
  nodes.get(el)?.play();
}

export function bringHallClipToTop(from: Element | null) {
  const clip = from?.closest("[data-hall-clip]");
  if (!(clip instanceof HTMLElement)) return;
  if (!clip.closest("[data-feed-post]")) return;
  pin = clip;
  pinUntil = Date.now() + 900;
  clip.style.scrollMarginTop = "5.5rem";
  clip.scrollIntoView({ behavior: "smooth", block: "start" });
  for (const [el, ctl] of nodes) {
    if (el !== clip) {
      undock(el);
      ctl.pause();
    }
  }
  focused = clip;
  skip = null;
  nodes.get(clip)?.play();
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
  if (focused) undock(focused);
  for (const ctl of nodes.values()) ctl.pause();
  focused = null;
}

export function playNextHallClip(from: Element | null) {
  const clip = from?.closest("[data-hall-clip]") ?? from;
  skip = clip instanceof Element ? clip : null;
  if (focused) {
    undock(focused);
    nodes.get(focused)?.pause();
    focused = null;
  }
  scrollToNextFeedPost(from);
  window.setTimeout(() => schedule(), 480);
}
