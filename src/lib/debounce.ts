import { useEffect, useState } from "react";

/** Wait until typing pauses before running search. */
export function useDebouncedValue<T>(value: T, ms = 180) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(value), ms);
    return () => window.clearTimeout(t);
  }, [value, ms]);
  return debounced;
}
