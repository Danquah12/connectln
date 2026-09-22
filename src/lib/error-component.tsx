import { Component, useEffect, type ReactNode } from "react";
import type { ErrorComponentProps } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";

const FALLBACK_MESSAGE = "The board hit a snag. Reload and try again.";

function isStaleChunk(raw: string) {
  return /Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module/i.test(
    raw,
  );
}

function errorMessage(error: unknown): string {
  const raw = error instanceof Error ? error.message : typeof error === "string" ? error : "";
  if (isStaleChunk(raw)) return "The hall updated. Reloading the board.";
  if (/removeChild|insertBefore|NotFoundError/i.test(raw)) {
    return "A clip fought the board. Reload and the hall comes back.";
  }
  if (raw) return raw;
  return FALLBACK_MESSAGE;
}

export function AppErrorComponent({ error, reset }: ErrorComponentProps) {
  const raw = error instanceof Error ? error.message : typeof error === "string" ? error : "";
  useEffect(() => {
    if (!isStaleChunk(raw) || typeof window === "undefined") return;
    const key = "cln-chunk-reload";
    if (sessionStorage.getItem(key) === "1") return;
    sessionStorage.setItem(key, "1");
    window.location.reload();
  }, [raw]);

  return (
    <main className="flex min-h-[50vh] flex-col items-center justify-center gap-3 bg-canvas px-6 py-16 text-center text-ink">
      <h1 className="font-display text-3xl tracking-wide">The board stalled</h1>
      <p className="max-w-md text-sm text-muted-foreground">{errorMessage(error)}</p>
      <div className="mt-2 flex flex-wrap items-center justify-center gap-3 text-sm">
        <button
          type="button"
          className="text-brick hover:underline"
          onClick={() => {
            reset();
          }}
        >
          Try again
        </button>
        <button
          type="button"
          className="text-brick hover:underline"
          onClick={() => {
            try {
              sessionStorage.removeItem("cln-chunk-reload");
            } catch {
              /* ignore */
            }
            window.location.reload();
          }}
        >
          Reload
        </button>
        <Link to="/login" search={{ seat: "member" }} className="text-brick hover:underline">
          Sign in
        </Link>
      </div>
    </main>
  );
}

/** Keep a bad clip from taking down shop talk. */
export class QuietBound extends Component<{ children: ReactNode }, { dead: boolean }> {
  state = { dead: false };
  static getDerivedStateFromError() {
    return { dead: true };
  }
  render() {
    return this.state.dead ? null : this.props.children;
  }
}
