/** Build a 9:16 split card: person on the left, their written words on the right. */

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("still missing"));
    img.src = src;
  });
}

function wrap(ctx: CanvasRenderingContext2D, text: string, maxW: number) {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const next = line ? `${line} ${w}` : w;
    if (ctx.measureText(next).width > maxW && line) {
      lines.push(line);
      line = w;
    } else line = next;
  }
  if (line) lines.push(line);
  return lines;
}

function mime() {
  if (typeof MediaRecorder === "undefined") return "";
  for (const t of ["video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm"]) {
    if (MediaRecorder.isTypeSupported(t)) return t;
  }
  return "";
}

export async function makeSplitReel(opts: {
  portrait: string;
  name: string;
  title: string;
  script: string;
}): Promise<{ video?: string; still: string }> {
  const w = 540;
  const h = 960;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return { still: opts.portrait };
  const g = ctx;

  let face: HTMLImageElement | null = null;
  try {
    face = await loadImage(opts.portrait);
  } catch {
    face = null;
  }

  const left = Math.round(w * 0.52);
  const paper = w - left;

  function paint(chars: number) {
    g.fillStyle = "#1c1916";
    g.fillRect(0, 0, w, h);
    if (face) {
      const s = Math.max(left / face.width, h / face.height);
      const dw = face.width * s;
      const dh = face.height * s;
      g.drawImage(face, (left - dw) / 2, (h - dh) / 2, dw, dh);
    } else {
      g.fillStyle = "#3a342e";
      g.fillRect(0, 0, left, h);
    }
    g.fillStyle = "#f7f2e9";
    g.fillRect(left, 0, paper, h);
    g.fillStyle = "#8b3d2a";
    g.fillRect(left, 0, 4, h);
    g.fillStyle = "#1c1916";
    g.font = "600 18px ui-sans-serif, system-ui";
    g.fillText(opts.name, left + 20, 48);
    g.font = "13px ui-sans-serif, system-ui";
    g.fillStyle = "#6b645c";
    g.fillText(opts.title, left + 20, 70);
    g.fillStyle = "#1c1916";
    g.font = "22px Georgia, serif";
    const shown = opts.script.slice(0, chars);
    const shownLines = wrap(g, shown || " ", paper - 40);
    let y = 120;
    for (const ln of shownLines.slice(0, 16)) {
      g.fillText(ln, left + 20, y);
      y += 32;
    }
  }

  paint(opts.script.length);
  const still = canvas.toDataURL("image/jpeg", 0.85);
  const type = mime();
  if (!type) return { still };

  const stream = canvas.captureStream(24);
  const rec = new MediaRecorder(stream, { mimeType: type, videoBitsPerSecond: 1_200_000 });
  const chunks: Blob[] = [];
  rec.ondataavailable = (e) => {
    if (e.data.size) chunks.push(e.data);
  };

  const duration = Math.min(12000, 2500 + opts.script.length * 55);
  await new Promise<void>((resolve) => {
    rec.onstop = () => resolve();
    rec.start();
    const t0 = performance.now();
    const tick = (now: number) => {
      const t = now - t0;
      const chars = Math.min(opts.script.length, Math.floor((t / duration) * opts.script.length));
      paint(chars);
      if (t < duration) requestAnimationFrame(tick);
      else rec.stop();
    };
    requestAnimationFrame(tick);
  });

  const blob = new Blob(chunks, { type: rec.mimeType || "video/webm" });
  if (!blob.size) return { still };
  return { video: URL.createObjectURL(blob), still };
}
