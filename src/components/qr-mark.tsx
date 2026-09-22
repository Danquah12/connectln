/** Visual scan mark from an id — not a real ISO QR, good enough for a card. */
export function QrMark({ seed, label, compact }: { seed: string; label: string; compact?: boolean }) {
  const bits: boolean[] = [];
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  for (let i = 0; i < 121; i++) {
    h = (h * 1664525 + 1013904223) >>> 0;
    bits.push(h % 3 !== 0);
  }
  return (
    <div className="inline-flex flex-col items-center gap-1">
      <svg viewBox="0 0 11 11" className={compact ? "size-12 bg-cream" : "size-28 bg-cream"} aria-hidden="true">
        {bits.map((on, i) => {
          const x = i % 11;
          const y = Math.floor(i / 11);
          const finder =
            (x < 3 && y < 3) || (x > 7 && y < 3) || (x < 3 && y > 7);
          return (
            <rect
              key={i}
              x={x}
              y={y}
              width="1"
              height="1"
              fill={finder || on ? "#1a1714" : "#f3ece1"}
            />
          );
        })}
      </svg>
      <span className="max-w-[7rem] text-center text-[10px] text-muted-foreground">{label}</span>
    </div>
  );
}
