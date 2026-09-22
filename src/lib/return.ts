/** Consecutive sit days. Broken if you skip a calendar day. */
export function sitStreak(days: string[]) {
  if (!days.length) return 0;
  const set = new Set(days);
  const today = new Date();
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  let n = 0;
  const cursor = new Date(`${iso(today)}T12:00:00Z`);
  if (!set.has(iso(cursor))) cursor.setUTCDate(cursor.getUTCDate() - 1);
  while (set.has(iso(cursor))) {
    n += 1;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
    if (n > 60) break;
  }
  return n;
}

export function todayIso() {
  return new Date().toISOString().slice(0, 10);
}
