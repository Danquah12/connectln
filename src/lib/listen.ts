/** Browser speech-to-text. Gloves on? Speak the search or the post. */

type Rec = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((ev: { results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

function Ctor(): (new () => Rec) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: new () => Rec;
    webkitSpeechRecognition?: new () => Rec;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function canListen() {
  return Boolean(Ctor());
}

export function startListening(onText: (text: string, done: boolean) => void, continuous = false): () => void {
  const Make = Ctor();
  if (!Make) return () => undefined;
  const rec = new Make();
  rec.lang = "en-US";
  rec.continuous = continuous;
  rec.interimResults = true;
  rec.onresult = (ev) => {
    const last = ev.results[ev.results.length - 1];
    if (!last?.[0]) return;
    onText(last[0].transcript, last.isFinal);
  };
  rec.onerror = () => onText("", true);
  rec.onend = () => onText("", true);
  try {
    rec.start();
  } catch {
    return () => undefined;
  }
  return () => {
    try {
      rec.stop();
    } catch {
      /* already stopped */
    }
  };
}
