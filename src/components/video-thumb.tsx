import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

/** Grab a real frame from the video instead of a cropped still. */
export function VideoThumb({
  src,
  poster,
  className,
}: {
  src: string;
  poster?: string;
  className?: string;
}) {
  const [url, setUrl] = useState(poster ?? "");

  useEffect(() => {
    const v = document.createElement("video");
    v.src = src;
    v.muted = true;
    v.playsInline = true;
    v.preload = "auto";
    const grab = () => {
      if (!v.videoWidth) return;
      const c = document.createElement("canvas");
      c.width = v.videoWidth;
      c.height = v.videoHeight;
      c.getContext("2d")?.drawImage(v, 0, 0);
      try {
        setUrl(c.toDataURL("image/jpeg", 0.72));
      } catch {
        /* tainted canvas — keep poster */
      }
    };
    const onMeta = () => {
      try {
        v.currentTime = Math.min(1.2, (v.duration || 2) * 0.2);
      } catch {
        grab();
      }
    };
    v.addEventListener("loadedmetadata", onMeta);
    v.addEventListener("seeked", grab);
    return () => {
      v.removeEventListener("loadedmetadata", onMeta);
      v.removeEventListener("seeked", grab);
      v.src = "";
    };
  }, [src]);

  if (!url) return <span className={cn("block size-full bg-ink", className)} />;
  return <img src={url} alt="" className={cn("size-full bg-ink object-contain", className)} />;
}
