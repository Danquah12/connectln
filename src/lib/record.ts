/** Mic capture for the line and voice notes. Transcription is separate (listen). */

export async function startMic(): Promise<{
  stop: () => Promise<string | undefined>;
} | null> {
  if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) return null;
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mime = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "";
    const rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
    const chunks: Blob[] = [];
    rec.ondataavailable = (e) => {
      if (e.data.size) chunks.push(e.data);
    };
    rec.start(250);
    return {
      stop: () =>
        new Promise((resolve) => {
          rec.onstop = () => {
            stream.getTracks().forEach((t) => t.stop());
            if (!chunks.length) {
              resolve(undefined);
              return;
            }
            const blob = new Blob(chunks, { type: rec.mimeType || "audio/webm" });
            const reader = new FileReader();
            reader.onloadend = () => resolve(typeof reader.result === "string" ? reader.result : undefined);
            reader.readAsDataURL(blob);
          };
          try {
            rec.stop();
          } catch {
            stream.getTracks().forEach((t) => t.stop());
            resolve(undefined);
          }
        }),
    };
  } catch {
    return null;
  }
}
