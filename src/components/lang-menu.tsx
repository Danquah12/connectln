import { useState } from "react";
import { HALL_LANGS, hallCopy } from "@/lib/lang";
import { useForge } from "@/lib/store";
import { cn } from "@/lib/utils";

export function LangMenu() {
  const [open, setOpen] = useState(false);
  const lang = useForge((s) => s.hallLang);
  const setHallLang = useForge((s) => s.setHallLang);
  const copy = hallCopy(lang);
  const current = HALL_LANGS.find((l) => l.id === lang) ?? HALL_LANGS[0];

  return (
    <div className="relative">
      <button
        type="button"
        aria-label={copy.language}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="grid h-11 min-w-11 place-items-center rounded-full border border-cream/25 px-2 text-xs font-medium tracking-wide text-cream uppercase hover:bg-cream/10"
      >
        {current.id}
      </button>
      {open ? (
        <>
          <button type="button" className="fixed inset-0 z-30 cursor-default" aria-label="Close" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-11 z-50 w-56 rounded-xl bg-ink p-2 text-cream shadow-[var(--shadow-border)]">
            <p className="px-2 py-1 text-[10px] font-medium tracking-[0.18em] text-cream/45 uppercase">{copy.language}</p>
            <ul className="max-h-80 overflow-y-auto">
              {HALL_LANGS.map((l) => {
                const on = l.id === lang;
                return (
                  <li key={l.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setHallLang(l.id);
                        setOpen(false);
                      }}
                      className={cn(
                        "flex w-full items-baseline justify-between gap-3 rounded-lg px-2 py-1.5 text-left text-sm",
                        on ? "bg-cream text-ink" : "hover:bg-cream/10",
                      )}
                    >
                      <span>{l.native}</span>
                      <span className={cn("text-xs", on ? "text-ink/60" : "text-cream/50")}>{l.name}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </>
      ) : null}
    </div>
  );
}
