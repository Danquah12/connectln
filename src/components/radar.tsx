import { radarAxes } from "@/lib/radar";
import type { Person, Vouch } from "@/lib/types";

export function SkillsRadar({ person, vouches }: { person: Person; vouches: Vouch[] }) {
  const axes = radarAxes(person, vouches);
  const n = axes.length;
  const cx = 110;
  const cy = 110;
  const r = 78;
  const pt = (i: number, value: number) => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / n;
    const rr = (value / 100) * r;
    return [cx + rr * Math.cos(a), cy + rr * Math.sin(a)] as const;
  };
  const ring = (pct: number) =>
    axes
      .map((_, i) => {
        const [x, y] = pt(i, pct);
        return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ") + " Z";
  const poly = axes
    .map((ax, i) => {
      const [x, y] = pt(i, ax.value);
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ") + " Z";

  return (
    <div className="flex flex-col items-center gap-2 sm:flex-row sm:items-start sm:gap-6">
      <svg viewBox="0 0 220 220" className="size-52 shrink-0" aria-hidden="true">
        <polygon points="" className="fill-none" />
        <path d={ring(100)} fill="none" stroke="#c4b8a8" strokeWidth="1" />
        <path d={ring(66)} fill="none" stroke="#c4b8a8" strokeWidth="1" opacity="0.6" />
        <path d={ring(33)} fill="none" stroke="#c4b8a8" strokeWidth="1" opacity="0.4" />
        {axes.map((_, i) => {
          const [x, y] = pt(i, 100);
          return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="#c4b8a8" strokeWidth="1" />;
        })}
        <path d={poly} fill="rgba(176,74,58,0.25)" stroke="#b04a3a" strokeWidth="2" />
      </svg>
      <ul className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
        {axes.map((ax) => (
          <li key={ax.id} className="flex justify-between gap-3">
            <span className="text-muted-foreground">{ax.label}</span>
            <span className="font-medium tabular-nums">{ax.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
