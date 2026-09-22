import { useEffect, useRef, useState } from "react";
import { Mic, Square } from "lucide-react";
import { canListen, startListening } from "@/lib/listen";
import { cn } from "@/lib/utils";

export function Dictate({
  onText,
  label = "Dictate",
}: {
  onText: (text: string) => void;
  label?: string;
}) {
  const [on, setOn] = useState(false);
  const stop = useRef<(() => void) | null>(null);

  useEffect(() => () => stop.current?.(), []);

  if (!canListen()) return null;

  function toggle() {
    if (on) {
      stop.current?.();
      stop.current = null;
      setOn(false);
      return;
    }
    setOn(true);
    stop.current = startListening((text, done) => {
      if (text.trim()) onText(text.trim());
      if (done) {
        stop.current = null;
        setOn(false);
      }
    });
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className={cn(
        "inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-sm",
        on ? "bg-brick text-cream" : "bg-canvas text-muted-foreground",
      )}
      aria-pressed={on}
    >
      {on ? <Square className="size-3.5" /> : <Mic className="size-3.5" />}
      {on ? "Listening…" : label}
    </button>
  );
}
