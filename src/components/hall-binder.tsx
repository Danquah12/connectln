import { useEffect } from "react";
import { loadHall } from "@/lib/hall";
import { loadMhccBook } from "@/lib/mhcc-book";
import { useForge } from "@/lib/store";

/** Pull the shared hall so a new login shows up on People without a hard refresh. */
export function HallBinder() {
  const hydrated = useForge((s) => s.hydrated);
  const youId = useForge((s) => s.youId);

  useEffect(() => {
    if (!hydrated) return;
    let cancelled = false;
    const pull = () => {
      void loadHall()
        .then((hall) => {
          if (!cancelled) useForge.getState().mergeHall(hall);
        })
        .catch(() => undefined);
      void loadMhccBook()
        .then((people) => {
          if (!cancelled) useForge.getState().mergeMhcc(people);
        })
        .catch(() => undefined);
    };
    pull();
    const tick = window.setInterval(pull, 20000);
    const onFocus = () => pull();
    window.addEventListener("focus", onFocus);
    return () => {
      cancelled = true;
      window.clearInterval(tick);
      window.removeEventListener("focus", onFocus);
    };
  }, [hydrated, youId]);

  return null;
}