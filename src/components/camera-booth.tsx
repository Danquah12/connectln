import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ReelStage } from "@/components/work-frame";
import {
  blobToDataUrl,
  cameraErrorMessage,
  openCamera,
  recorderMime,
} from "@/lib/camera";

export function CameraBooth({
  maxMs = 15_000,
  onClip,
  label = "Start camera",
}: {
  maxMs?: number;
  onClip: (video: string) => void;
  label?: string;
}) {
  const liveRef = useRef<HTMLVideoElement>(null);
  const recRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const tickRef = useRef(0);
  const [recording, setRecording] = useState(false);
  const [left, setLeft] = useState(0);
  const [preview, setPreview] = useState<string>();
  const [blocked, setBlocked] = useState<string>();
  const [asking, setAsking] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(
    () => () => {
      window.clearInterval(tickRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    },
    [],
  );

  function stopStream() {
    window.clearInterval(tickRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    recRef.current = null;
    setRecording(false);
  }

  async function start() {
    setAsking(true);
    setBlocked(undefined);
    try {
      const stream = await openCamera("video");
      streamRef.current = stream;
      if (liveRef.current) {
        liveRef.current.srcObject = stream;
        liveRef.current.muted = true;
        void liveRef.current.play();
      }
      const mime = recorderMime();
      const rec = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
      const chunks: Blob[] = [];
      rec.ondataavailable = (e) => {
        if (e.data.size) chunks.push(e.data);
      };
      rec.onstop = () => {
        const blob = new Blob(chunks, { type: rec.mimeType || "video/webm" });
        void blobToDataUrl(blob).then((url) => {
          setPreview(url);
          stopStream();
        });
      };
      recRef.current = rec;
      rec.start(250);
      setRecording(true);
      setLeft(maxMs);
      const started = Date.now();
      tickRef.current = window.setInterval(() => {
        const remain = maxMs - (Date.now() - started);
        setLeft(Math.max(0, remain));
        if (remain <= 0 && recRef.current?.state === "recording") recRef.current.stop();
      }, 250);
    } catch (err) {
      setBlocked(cameraErrorMessage(err));
      toast(cameraErrorMessage(err));
    } finally {
      setAsking(false);
    }
  }

  const clock = `${Math.floor(left / 60000)}:${String(Math.floor((left % 60000) / 1000)).padStart(2, "0")}`;

  return (
    <div className="flex flex-col gap-3">
      <div className="mx-auto w-full max-w-[18rem]">
      <ReelStage serial="CLN-REC" stamp={recording ? `Rec · ${clock}` : preview ? "Take" : "Booth"}>
        <video
          ref={liveRef}
          src={preview && !recording ? preview : undefined}
          className="size-full object-cover object-top"
          muted={recording || !preview}
          playsInline
          controls={Boolean(preview && !recording)}
        />
        {recording ? (
          <span className="absolute top-3 left-3 bg-brick px-2.5 py-1 text-[11px] font-medium tracking-wide text-cream uppercase">
            Rec · {clock}
          </span>
        ) : null}
      </ReelStage>
      </div>

      {blocked ? <p className="text-sm text-brick">{blocked}</p> : null}

      <div className="flex flex-wrap gap-2">
        {recording ? (
          <Button type="button" variant="ink" onClick={() => recRef.current?.stop()}>
            Stop
          </Button>
        ) : (
          <Button type="button" variant="ink" disabled={asking} onClick={() => void start()}>
            {asking ? "Asking the browser…" : preview ? "Record again" : label}
          </Button>
        )}
        <Button type="button" variant="ghost" onClick={() => fileRef.current?.click()}>
          Use this device’s camera
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept="video/*"
          capture="user"
          className="sr-only"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            void blobToDataUrl(f).then((url) => {
              setPreview(url);
              setBlocked(undefined);
            });
          }}
        />
      </div>

      {preview && !recording ? (
        <Button type="button" onClick={() => onClip(preview)}>
          Use this clip
        </Button>
      ) : (
        <p className="text-xs text-muted-foreground">
          Tap Start camera — the browser should ask Allow. If it does not, use this device’s camera
          (opens the phone camera) or allow pop-ups and open the recorder from Reels.
        </p>
      )}
    </div>
  );
}
