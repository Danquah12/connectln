import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { blobToDataUrl, inEmbeddedFrame, listenForClip, openCameraBooth } from "@/lib/camera";
import { makeSplitReel } from "@/lib/split-reel";
import { personById, useForge } from "@/lib/store";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { cn } from "@/lib/utils";
import type { ReelKind } from "@/lib/types";
import { CameraBooth } from "@/components/camera-booth";
import { LightingTips } from "@/components/lighting-tips";

type Mode = "record" | "upload" | "write";

export function ReelCompose({ onDone }: { onDone: () => void }) {
  const { user, isPending } = useCurrentUserState();
  const youId = useForge((s) => s.youId);
  const people = useForge((s) => s.people);
  const you = personById(people, youId);
  const postReel = useForge((s) => s.postReel);
  const [mode, setMode] = useState<Mode>("write");
  const [title, setTitle] = useState("");
  const [caption, setCaption] = useState("");
  const [script, setScript] = useState("");
  const [kind, setKind] = useState<ReelKind>("work");
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
        to post a reel of the work.
      </p>
    );
  }

  async function publish() {
    if (!title.trim()) return;
    setBusy(true);
    try {
      let clip = video;
      let poster = you?.photo || "/sites/hall.jpg";
      if (mode === "write" && script.trim() && you) {
        const made = await makeSplitReel({
          portrait: you.photo || "/sites/hall.jpg",
          name: you.name,
          title: title.trim(),
          script: script.trim(),
        });
        clip = made.video ?? clip;
        poster = made.still;
      }
      if (!clip && !script.trim() && mode !== "write") {
        toast("Record, upload, or write the words.");
        return;
      }
      postReel({
        id: `reel-${Date.now().toString(36)}`,
        personId: youId,
        title: title.trim(),
        caption: caption.trim() || script.trim() || "Posted from the hall.",
        script: script.trim() || undefined,
        kind,
        video: clip,
        still: poster,
        createdAt: new Date().toISOString(),
        likes: 0,
      });
      toast("On the reel.");
      onDone();
    } finally {
      setBusy(false);
    }
  }

  function openBooth() {
    const popup = openCameraBooth({ mode: "reel" });
    if (!popup) {
      toast("Allow pop-ups for ConnectLn, then tap Open recorder again.");
    }
  }

  return (
    <form
      className="rounded-xl bg-cream p-4 shadow-[var(--shadow-border)]"
      onSubmit={(e) => {
        e.preventDefault();
        void publish();
      }}
    >
      <p className="text-sm font-medium">Post your own</p>
      <p className="mt-1 text-xs text-muted-foreground">
        Record or upload if you can speak. If you can’t — write it. We put your
        face on the left and the words on the right, then read them aloud.
      </p>
      <div className="mt-3 flex gap-1">
        {(
          [
            ["record", "Record"],
            ["upload", "Upload"],
            ["write", "Write it"],
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
          <LightingTips />
          {nested ? (
            <>
              <p className="text-sm">
                This preview cannot show the Allow camera prompt. Open the recorder — a real
                window — and the browser will ask.
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
            <CameraBooth
              maxMs={15_000}
              onClip={(clip) => setVideo(clip)}
              label="Allow camera"
            />
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
            <video src={video} className="aspect-[9/16] w-full max-w-[12rem] rounded-lg bg-ink" controls />
          ) : null}
        </div>
      ) : null}

      {mode === "upload" ? (
        <label className="mt-3 flex h-24 cursor-pointer items-center justify-center rounded-lg bg-canvas text-sm">
          {video ? "Clip ready. Pick another?" : "Choose a video from this device"}
          <input
            type="file"
            accept="video/*"
            className="sr-only"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              void blobToDataUrl(f).then(setVideo);
            }}
          />
        </label>
      ) : null}

      {mode === "write" ? (
        <div className="mt-3">
          <p className="text-xs text-muted-foreground">
            Can’t speak on camera? Write the line. The posted reel is a split
            card: you on one side, the words on the other. Viewers hear it read.
          </p>
          <Textarea
            className="mt-2 bg-canvas"
            value={script}
            onChange={(e) => setScript(e.target.value)}
            placeholder="I set the panel on the night pocket. Inspector didn't send us back. That's the work."
            rows={5}
            required
          />
          {you?.photo ? (
            <div className="mt-3 flex overflow-hidden rounded-lg">
              <img src={you.photo} alt="" className="h-40 w-[52%] object-cover object-top" />
              <p className="h-40 w-[48%] overflow-hidden bg-canvas p-3 text-xs leading-relaxed">
                {script || "Your words land here, next to your face."}
              </p>
            </div>
          ) : null}
        </div>
      ) : null}

      {video && mode === "upload" ? (
        <video src={video} className="mt-3 aspect-[9/16] w-full max-w-[12rem] rounded-lg bg-ink" controls />
      ) : null}

      <input
        className="mt-3 h-10 w-full rounded-md border border-input bg-canvas px-3 text-sm"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="What this is — Hospital panel, night pocket"
        required
      />
      <Textarea
        className="mt-2 bg-canvas"
        value={caption}
        onChange={(e) => setCaption(e.target.value)}
        placeholder="One line under the clip. Skip the brand."
      />
      <div className="mt-2 flex flex-wrap gap-1.5">
        {(["work", "demo", "safety", "classroom", "care"] as const).map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setKind(k)}
            className={cn(
              "h-8 rounded-full px-3 text-xs capitalize",
              kind === k ? "bg-ink text-cream" : "bg-canvas text-muted-foreground",
            )}
          >
            {k}
          </button>
        ))}
      </div>
      <Button className="mt-3" type="submit" disabled={busy}>
        {busy ? "Making the card…" : "Post reel"}
      </Button>
    </form>
  );
}
