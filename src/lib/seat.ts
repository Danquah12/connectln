export type Seat = "member" | "desk";

const KEY = "connectln-seat";

export function readSeat(): Seat {
  if (typeof window === "undefined") return "member";
  try {
    return window.localStorage.getItem(KEY) === "desk" ? "desk" : "member";
  } catch {
    return "member";
  }
}

export function writeSeat(seat: Seat) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, seat);
  } catch {
    /* ignore */
  }
}

export function seatHome(seat: Seat) {
  return seat === "desk" ? "/admin" : "/goal";
}
