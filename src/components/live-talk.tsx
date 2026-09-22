import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CameraBooth } from "@/components/camera-booth";
import { Dictate } from "@/components/dictate";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { blobToDataUrl, inEmbeddedFrame, listenForClip, openCameraBooth } from "@/lib/camera";
import { makeSplitReel } from "@/lib/split-reel";
import { personById, useForge } from "@/lib/store";
import { cn } from "@/lib/utils";

const CAPS = [
  { id: 5, label: "5 min" },
  { id: 10, label: "10 min" },
  { id: 30, label: "30 min" },
] as const;

type Mode = "record" | "paste";

export function LiveTalk({ onDone }: { onDone?: () => void }) {
  const { user, isPending } = useCurrentUserState();
  const youId = useForge((s) => s.youId);
  const people = useForge((s) => s.people);
  const you = personById(people, youId);
  const createPost = useForge((s) => s.createPost);
  const postReel = useForge((s) => s.postReel);
  const [mode, setMode] = useState<Mode>("record");
  const [cap, setCap] = useState<(typeof CAPS)[number]["id"]>(5);
  const [script, setScript] = useState("");
  const [caption, setCaption] = useState("");
  const [video, setVideo] = useState<string>();
  const [busy, setBusy] = useState(false);
  const nested = typeof window !== "undefined" && inEmbeddedFrame();
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => listenForClip((clip) => {
    setVideo(clip);
    setMode("record");
    toast("Clip landed from the recorder.");
  }), []);

  if (isPending) return <div className="h-40 animate-pulse rounded-xl bg-cream" />;
  if (!user) {
    return (
      <p className="rounded-xl bg-cream p-4 text-sm shadow-[var(--shadow-border)]">
        <Link to="/login" search={{ seat: "member" }} className="text-brick hover:underline">
          Sign in
        </Link>{" "}
        to go live on shop talk.
      </p>
    );
  }

  async function publish() {
    setBusy(true);
    try {
      let clip = video;
      let poster = you?.photo;
      if (mode === "paste") {
        if (!script.trim()) {
          toast("Paste what you want said.");
          return;
        }
        if (you) {
          const made = await makeSplitReel({
            portrait: you.photo || "/sites/hall.jpg",
            name: you.name,
            title: caption.trim() || "Shop talk",
            script: script.trim(),
          });
          clip = made.video ?? clip;
          poster = made.still;
        }
      }
      if (!clip && mode === "record") {
        toast("Record a clip first.");
        return;
      }
      const body = caption.trim() || script.trim() || "Live from the hall.";
      createPost(body, "work", poster, clip);
      if (clip && you) {
        postReel({
          id: `reel-${Date.now().toString(36)}`,
          personId: youId,
          title: caption.trim() || "Live on the hall",
          caption: body,
          script: script.trim() || undefined,
          kind: "work",
          video: clip,
          still: poster || you.photo,
          createdAt: new Date().toISOString(),
          likes: 0,
        });
      }
      toast("On shop talk.");
      onDone?.();
    } finally {
      setBusy(false);
    }
  }

  function openBooth() {
    const popup = openCameraBooth({ mode: "talk", cap });
    if (!popup) toast("Allow pop-ups for ConnectLn, then tap Open recorder again.");
  }

  return (
    <div className="rounded-xl bg-cream p-4 shadow-[var(--shadow-border)]">
      <p className="font-display text-2xl tracking-wide">Go live</p>
      <p className="mt-1 text-xs text-muted-foreground">
        5, 10, or 30 minutes — like a short. Can’t speak? Paste the words. We put your face
        next to the line and post it to shop talk.
      </p>
      <div className="mt-3 flex gap-1">
        {(
          [
            ["record", "Record"],
            ["paste", "Paste to video"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setMode(id)}
            className={cn(
              "h-10 flex-1 rounded-lg text-sm font-medium",
              mode === id ? "bg-ink text-cream" : "bg-canvas text-muted-foreground",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {mode === "record" ? (
        <div className="mt-3 flex flex-col gap-3">
          <div className="flex gap-1">
            {CAPS.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setCap(c.id)}
                className={cn(
                  "h-9 flex-1 rounded-full text-sm",
                  cap === c.id ? "bg-ink text-cream" : "bg-canvas text-muted-foreground",
                )}
              >
                {c.label}
              </button>
            ))}
          </div>
          {nested ? (
            <>
              <p className="text-sm">
                This preview cannot show the Allow camera prompt. Open the recorder so the
                browser can ask.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="ink" onClick={openBooth}>
                  Open recorder
                </Button>
                <Button type="button" variant="ghost" onClick={() => fileRef.current?.click()}>
                  Use this device’s camera
                </Button>
              </div>
            </>
          ) : (
            <CameraBooth maxMs={cap * 60 * 1000} onClip={setVideo} label="Allow camera" />
          )}
          <input
            ref={fileRef}
            type="file"
            accept="video/*"
            capture="user"
            className="sr-only"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              void blobToDataUrl(f).then(setVideo);
            }}
          />
          {video ? (
            <video src={video} className="mx-auto aspect-[9/16] w-full max-w-[12rem] rounded-lg bg-ink" controls />
          ) : null}
        </div>
      ) : (
        <div className="mt-3">
          <Textarea
            className="bg-canvas"
            rows={6}
            value={script}
            onChange={(e) => setScript(e.target.value)}
            placeholder="Paste what you want said. We’ll put you on the left, the words on the right, and read it on shop talk."
          />
          <div className="mt-2">
            <Dictate onText={(t) => setScript((s) => (s ? `${s} ${t}` : t))} label="Speak it" />
          </div>
          {you?.photo ? (
            <div className="mt-3 flex overflow-hidden rounded-lg">
              <img src={you.photo} alt="" className="h-44 w-[52%] object-cover object-top" />
              <p className="h-44 w-[48%] overflow-hidden bg-canvas p-3 text-xs leading-relaxed">
                {script || "Your words land here."}
              </p>
            </div>
          ) : null}
        </div>
      )}

      <input
        className="mt-3 h-10 w-full rounded-md border border-input bg-canvas px-3 text-sm"
        value={caption}
        onChange={(e) => setCaption(e.target.value)}
        placeholder="One line under the clip — optional"
      />
      <Button className="mt-3" type="button" disabled={busy} onClick={() => void publish()}>
        {busy ? "Posting…" : "Post to shop talk"}
      </Button>
    </div>
  );
}
