import { useEffect, useState } from "react";
import { HALL_THEMES } from "@/lib/theme";
import { useForge } from "@/lib/store";
import { cn } from "@/lib/utils";

export function ThemeBinder() {
  const theme = useForge((s) => s.hallTheme);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);
  return null;
}

export function ThemePicker({ compact = false }: { compact?: boolean }) {
  const theme = useForge((s) => s.hallTheme);
  const setHallTheme = useForge((s) => s.setHallTheme);
  const current = HALL_THEMES.find((t) => t.id === theme) ?? HALL_THEMES[4];

  return (
    <div
      className={cn(
        "rounded-2xl bg-ink p-4 text-cream shadow-[var(--shadow-border)]",
        compact ? "w-[min(16.5rem,calc(100vw-1.5rem))]" : "w-full",
      )}
    >
      <p className="text-[10px] font-medium tracking-[0.18em] text-cream/45">CHANGE BACKGROUND THEME</p>
      <p className="mt-1 text-base font-medium">{current.name}</p>
      <div className="mt-3 flex items-center gap-2.5">
        {HALL_THEMES.map((t) => {
          const on = t.id === theme;
          return (
            <button
              key={t.id}
              type="button"
              aria-label={t.name}
              aria-pressed={on}
              title={t.name}
              onClick={() => setHallTheme(t.id)}
              className={cn(
                "size-8 rounded-full transition-[transform,box-shadow] duration-150",
                on ? "scale-110 ring-2 ring-cream ring-offset-2 ring-offset-ink" : "hover:scale-105",
              )}
              style={{ background: t.swatch }}
            />
          );
        })}
      </div>
    </div>
  );
}

export function ThemeMenu() {
  const [open, setOpen] = useState(false);
  const theme = useForge((s) => s.hallTheme);
  const current = HALL_THEMES.find((t) => t.id === theme) ?? HALL_THEMES[4];

  return (
    <div className="relative">
      <button
        type="button"
        aria-label="Change background theme"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="grid size-11 place-items-center rounded-full border border-cream/25 text-cream hover:bg-cream/10"
      >
        <span className="size-3.5 rounded-full" style={{ background: current.swatch }} />
      </button>
      {open ? (
        <>
          <button type="button" className="fixed inset-0 z-30 cursor-default" aria-label="Close" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-11 z-50">
            <ThemePicker compact />
          </div>
        </>
      ) : null}
    </div>
  );
}
