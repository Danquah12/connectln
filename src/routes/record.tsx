import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { CameraBooth } from "@/components/camera-booth";
import { LightingTips } from "@/components/lighting-tips";
import { Mark } from "@/components/mark";
import { postClipToOpener } from "@/lib/camera";

export const Route = createFileRoute("/record")({
  validateSearch: (raw: Record<string, unknown>): { mode?: string; cap?: number } => {
    const mode = typeof raw.mode === "string" ? raw.mode : undefined;
    const cap = typeof raw.cap === "string" ? Number(raw.cap) : typeof raw.cap === "number" ? raw.cap : undefined;
    return {
      ...(mode ? { mode } : {}),
      ...(cap && Number.isFinite(cap) ? { cap } : {}),
    };
  },
  component: RecordPage,
});

function RecordPage() {
  const { cap } = Route.useSearch();
  const maxMs = Math.min(30, Math.max(0.25, cap ?? 0.25)) * 60 * 1000;
  const hasOpener = typeof window !== "undefined" && Boolean(window.opener);

  function useClip(video: string) {
    if (hasOpener) {
      postClipToOpener(video);
      toast("Clip sent. You can close this window.");
      window.setTimeout(() => window.close(), 400);
      return;
    }
    toast("Clip is ready on this page.");
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col gap-4 bg-canvas px-4 py-6 text-ink">
      <header className="flex items-center gap-2">
        <Mark className="size-7" />
        <div>
          <p className="font-display text-2xl tracking-wide">Recorder</p>
          <p className="text-xs text-muted-foreground">
            This is a real window, so the browser can ask for camera and mic.
          </p>
        </div>
      </header>
      <LightingTips />
      <CameraBooth maxMs={maxMs} onClip={useClip} label="Allow camera" />
      {!hasOpener ? (
        <Link to="/reels" search={{ post: true }} className="text-sm text-brick hover:underline">
          Back to reels
        </Link>
      ) : null}
    </main>
  );
}
